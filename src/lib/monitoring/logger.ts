/**
 * Professional-grade structured logging system
 * Supports multiple log levels, structured data, and external services
 */

import React from 'react'

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogContext {
  userId?: string
  sessionId?: string
  requestId?: string
  component?: string
  action?: string
  traceId?: string
  spanId?: string
  [key: string]: any
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  levelName: string
  message: string
  context: LogContext
  data?: any
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  performance?: {
    duration?: number
    memory?: number
  }
  environment: string
  version: string
}

export interface LogTransport {
  name: string
  log(entry: LogEntry): void | Promise<void>
}

class ConsoleTransport implements LogTransport {
  name = 'console'

  log(entry: LogEntry): void {
    const { timestamp, levelName, message, context, data, error } = entry

    const logMethod = this.getConsoleMethod(entry.level)
    const prefix = `[${timestamp}] ${levelName.toUpperCase()}`

    if (process.env.NODE_ENV === 'development') {
      // Pretty formatting for development
      logMethod(
        `%c${prefix}%c ${message}`,
        this.getLevelStyle(entry.level),
        'color: inherit',
        {
          context,
          data,
          error,
        }
      )
    } else {
      // JSON format for production
      logMethod(JSON.stringify(entry))
    }
  }

  private getConsoleMethod(level: LogLevel) {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug
      case LogLevel.INFO:
        return console.info
      case LogLevel.WARN:
        return console.warn
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return console.error
      default:
        return console.log
    }
  }

  private getLevelStyle(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'color: #6B7280; font-weight: bold'
      case LogLevel.INFO:
        return 'color: #3B82F6; font-weight: bold'
      case LogLevel.WARN:
        return 'color: #F59E0B; font-weight: bold'
      case LogLevel.ERROR:
        return 'color: #EF4444; font-weight: bold'
      case LogLevel.FATAL:
        return 'color: #DC2626; font-weight: bold; background: #FEE2E2'
      default:
        return 'font-weight: bold'
    }
  }
}

class RemoteTransport implements LogTransport {
  name = 'remote'
  private buffer: LogEntry[] = []
  private flushInterval: NodeJS.Timeout | null = null

  constructor(
    private endpoint: string = '/api/logs',
    private bufferSize: number = 10,
    private flushIntervalMs: number = 5000
  ) {
    this.startFlushInterval()
  }

  log(entry: LogEntry): void {
    this.buffer.push(entry)

    if (this.buffer.length >= this.bufferSize) {
      this.flush()
    }
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush()
      }
    }, this.flushIntervalMs)
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return

    const logs = [...this.buffer]
    this.buffer = []

    try {
      if (typeof window !== 'undefined' && navigator.sendBeacon) {
        // Use sendBeacon for reliability
        navigator.sendBeacon(
          this.endpoint,
          JSON.stringify({ logs })
        )
      } else {
        // Fallback to fetch
        await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ logs }),
        })
      }
    } catch (error) {
      // Re-add logs to buffer if sending failed
      this.buffer.unshift(...logs)
      console.error('Failed to send logs to remote endpoint:', error)
    }
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flush()
  }
}

class Logger {
  private context: LogContext = {}
  private transports: LogTransport[] = []
  private minLevel: LogLevel = LogLevel.INFO

  constructor() {
    // Add default console transport
    this.addTransport(new ConsoleTransport())

    // Add remote transport in production
    if (process.env.NODE_ENV === 'production') {
      this.addTransport(new RemoteTransport())
    }

    // Set log level based on environment
    this.minLevel = process.env.NODE_ENV === 'development'
      ? LogLevel.DEBUG
      : LogLevel.INFO
  }

  addTransport(transport: LogTransport): void {
    this.transports.push(transport)
  }

  removeTransport(name: string): void {
    this.transports = this.transports.filter(t => t.name !== name)
  }

  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context }
  }

  clearContext(): void {
    this.context = {}
  }

  setLevel(level: LogLevel): void {
    this.minLevel = level
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data)
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data)
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data)
  }

  error(message: string, error?: Error, data?: any): void {
    this.log(LogLevel.ERROR, message, data, error)
  }

  fatal(message: string, error?: Error, data?: any): void {
    this.log(LogLevel.FATAL, message, data, error)
  }

  /**
   * Log with performance timing
   */
  performance(message: string, duration: number, data?: any): void {
    this.log(LogLevel.INFO, message, data, undefined, { duration })
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger()
    childLogger.context = { ...this.context, ...context }
    childLogger.transports = this.transports
    childLogger.minLevel = this.minLevel
    return childLogger
  }

  /**
   * Time a function execution and log the result
   */
  async time<T>(
    name: string,
    fn: () => Promise<T> | T,
    context?: LogContext
  ): Promise<T> {
    const startTime = Date.now()
    const childLogger = context ? this.child(context) : this

    try {
      childLogger.debug(`Starting ${name}`)
      const result = await fn()
      const duration = Date.now() - startTime
      childLogger.performance(`Completed ${name}`, duration)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      childLogger.error(
        `Failed ${name} after ${duration}ms`,
        error as Error,
        { duration }
      )
      throw error
    }
  }

  private log(
    level: LogLevel,
    message: string,
    data?: any,
    error?: Error,
    performance?: { duration?: number; memory?: number }
  ): void {
    if (level < this.minLevel) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      levelName: LogLevel[level],
      message,
      context: { ...this.context },
      data,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      } : undefined,
      performance,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    }

    // Add memory usage if available
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      const memory = (window as any).performance.memory
      entry.performance = {
        ...entry.performance,
        memory: memory.usedJSHeapSize,
      }
    }

    this.transports.forEach(transport => {
      try {
        transport.log(entry)
      } catch (transportError) {
        console.error(`Transport ${transport.name} failed:`, transportError)
      }
    })
  }
}

// Singleton logger instance
export const logger = new Logger()

// React hook for component-specific logging
export function useLogger(componentName: string) {
  const componentLogger = React.useMemo(
    () => logger.child({ component: componentName }),
    [componentName]
  )

  return componentLogger
}

// Higher-order component for automatic error logging
export function withErrorLogging<T extends object>(
  Component: React.ComponentType<T>,
  componentName: string
) {
  return function ErrorLoggedComponent(props: T) {
    const componentLogger = useLogger(componentName)

    React.useEffect(() => {
      const handleError = (error: ErrorEvent) => {
        componentLogger.error('Unhandled error in component', error.error, {
          filename: error.filename,
          lineno: error.lineno,
          colno: error.colno,
        })
      }

      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        componentLogger.error('Unhandled promise rejection in component',
          event.reason instanceof Error ? event.reason : new Error(String(event.reason))
        )
      }

      window.addEventListener('error', handleError)
      window.addEventListener('unhandledrejection', handleUnhandledRejection)

      return () => {
        window.removeEventListener('error', handleError)
        window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      }
    }, [componentLogger])

    return <Component {...props} />
  }
}

// Decorator for automatic function logging
export function loggedFunction(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value

  descriptor.value = async function (...args: any[]) {
    const functionLogger = logger.child({
      function: `${target.constructor.name}.${propertyName}`
    })

    return functionLogger.time(propertyName, () => method.apply(this, args))
  }

  return descriptor
}

// Export for global usage
declare global {
  interface Window {
    logger: Logger
  }
}

if (typeof window !== 'undefined') {
  window.logger = logger
}
