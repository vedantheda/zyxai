/**
 * VAPI utility functions
 */

// Browser compatibility check for voice features
export function checkBrowserCompatibility() {
  const issues: string[] = []

  // Check for required APIs
  if (!navigator.mediaDevices?.getUserMedia) {
    issues.push('Microphone access not supported')
  }

  if (typeof RTCPeerConnection === 'undefined') {
    issues.push('WebRTC not supported')
  }

  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    issues.push('HTTPS required for microphone access')
  }

  return {
    compatible: issues.length === 0,
    issues,
    warnings: []
  }
}

// Create VAPI instance (placeholder implementation)
export function createVapi(config?: any) {
  return {
    start: () => Promise.resolve(),
    stop: () => Promise.resolve(),
    isActive: () => false,
    on: (event: string, callback: Function) => {},
    off: (event: string, callback: Function) => {},
    config
  }
}
