// Vapi configuration optimized for browser compatibility
export const vapiConfig = {
  // Disable features that cause browser compatibility issues
  disableKrisp: true, // Disable Krisp noise cancellation
  disableAudioWorklets: true, // Disable Audio Worklets if not supported
  
  // Audio settings optimized for compatibility
  audio: {
    // Disable advanced audio processing that requires worklets
    enableNoiseCancellation: false,
    enableEchoCancellation: true, // Keep basic echo cancellation
    enableAutoGainControl: true,
    
    // Use basic audio constraints
    constraints: {
      audio: {
        echoCancellation: true,
        noiseSuppression: false, // Disable to avoid worklet issues
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 16000
      }
    }
  },
  
  // Daily.co specific settings
  daily: {
    // Disable features that require advanced browser APIs
    enableKrisp: false,
    enableBackgroundBlur: false,
    enableVirtualBackground: false,
    
    // Basic audio/video settings
    audio: true,
    video: false // Voice-only for better compatibility
  }
}

// Helper function to create Vapi instance with optimized settings
export function createOptimizedVapi(publicKey: string) {
  // Check browser capabilities
  const hasAudioWorklets = typeof AudioWorkletNode !== 'undefined'
  const hasWebRTC = typeof RTCPeerConnection !== 'undefined'
  
  console.log('🔧 Browser capabilities:', {
    hasAudioWorklets,
    hasWebRTC,
    userAgent: navigator.userAgent,
    isSecureContext: window.isSecureContext
  })
  
  // Import Vapi dynamically to avoid SSR issues
  return import('@vapi-ai/web').then(({ default: Vapi }) => {
    const vapi = new Vapi(publicKey)
    
    // Apply optimized settings if possible
    if (vapi && typeof vapi.setConfig === 'function') {
      vapi.setConfig(vapiConfig)
    }
    
    return vapi
  })
}

// Browser compatibility check
export function checkBrowserCompatibility() {
  const issues: string[] = []
  const warnings: string[] = []
  
  // Check for required APIs
  if (!navigator.mediaDevices) {
    issues.push('MediaDevices API not supported')
  }
  
  if (!navigator.mediaDevices?.getUserMedia) {
    issues.push('getUserMedia not supported')
  }
  
  if (typeof RTCPeerConnection === 'undefined') {
    issues.push('WebRTC not supported')
  }
  
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    issues.push('HTTPS required for microphone access')
  }
  
  // Check for optional but recommended APIs
  if (typeof AudioWorkletNode === 'undefined') {
    warnings.push('Audio Worklets not supported - advanced audio features disabled')
  }
  
  if (!window.isSecureContext) {
    warnings.push('Not in secure context - some features may be limited')
  }
  
  return {
    compatible: issues.length === 0,
    issues,
    warnings
  }
}
