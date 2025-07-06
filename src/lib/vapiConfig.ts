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
