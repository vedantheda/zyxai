import { ProcessingResult, ServiceConfig, ServiceError } from './types';
export abstract class BaseService {
  protected config: ServiceConfig;
  protected logger: Logger;
  constructor(config: ServiceConfig = {}) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      enableLogging: true,
      ...config
    };
    this.logger = new Logger(this.constructor.name, this.config.enableLogging);
  }
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<ProcessingResult<T>> {
    const startTime = Date.now();
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= (this.config.retryAttempts || 3); attempt++) {
      try {
        this.logger.info(`${operationName} - Attempt ${attempt}`);
        const result = await this.withTimeout(operation(), this.config.timeout || 30000);
        const processingTime = Date.now() - startTime;
        this.logger.info(`${operationName} completed successfully in ${processingTime}ms`);
        return {
          success: true,
          data: result,
          processingTime
        };
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`${operationName} - Attempt ${attempt} failed:`, error);
        if (attempt === (this.config.retryAttempts || 3)) {
          break;
        }
        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
    const processingTime = Date.now() - startTime;
    this.logger.error(`${operationName} failed after ${this.config.retryAttempts} attempts`);
    return {
      success: false,
      error: lastError?.message || 'Unknown error occurred',
      processingTime
    };
  }
  protected async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]);
  }
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  protected validateRequired(data: Record<string, any>, requiredFields: string[]): void {
    const missing = requiredFields.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new ServiceError(
        `Missing required fields: ${missing.join(', ')}`,
        'VALIDATION_ERROR',
        { missingFields: missing }
      );
    }
  }
  protected sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      // Remove sensitive fields
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = this.sanitizeData(value);
      }
    }
    return sanitized;
  }
  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'ssn', 'social_security_number', 'password', 'api_key', 'secret',
      'token', 'credit_card', 'bank_account', 'routing_number'
    ];
    return sensitiveFields.some(field =>
      fieldName.toLowerCase().includes(field.toLowerCase())
    );
  }
  // Health check method for all services
  public async healthCheck(): Promise<ProcessingResult<{ status: string; timestamp: Date }>> {
    try {
      const result = await this.performHealthCheck();
      return {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date(),
          ...result
        }
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        data: {
          status: 'unhealthy',
          timestamp: new Date()
        }
      };
    }
  }
  protected abstract performHealthCheck(): Promise<Record<string, any>>;
}
// Simple logger class - production-safe
class Logger {
  constructor(
    private serviceName: string,
    private enabled: boolean = process.env.NODE_ENV === 'development'
  ) {}
  info(message: string, ...args: any[]): void {
    if (this.enabled && process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] [${this.serviceName}] INFO:`, message, ...args);
    }
  }
  warn(message: string, ...args: any[]): void {
    if (this.enabled && process.env.NODE_ENV === 'development') {
      .toISOString()}] [${this.serviceName}] WARN:`, message, ...args);
    }
  }
  error(message: string, ...args: any[]): void {
    // Always log errors, but only with details in development
    ] [${this.serviceName}] ERROR:`, message, ...args);
    } else {
      // In production, log errors without sensitive details
      }
  }
  debug(message: string, ...args: any[]): void {
    if (this.enabled && process.env.NODE_ENV === 'development') {
      console.debug(`[${new Date().toISOString()}] [${this.serviceName}] DEBUG:`, message, ...args);
    }
  }
}
