// Global script to disable Krisp and other problematic Daily.co features
// This runs before any other scripts to prevent worklet loading

(function() {
  'use strict';
  
  console.log('🔧 Disabling Krisp and problematic audio features...');
  
  // Override Daily.co configuration globally
  if (typeof window !== 'undefined') {
    // Disable Krisp before it can load
    window.DISABLE_KRISP = true;
    window.DISABLE_NOISE_CANCELLATION = true;
    window.DISABLE_BACKGROUND_BLUR = true;
    
    // Override AudioWorkletNode to prevent worklet loading
    if (typeof AudioWorkletNode !== 'undefined') {
      const originalAudioWorkletNode = window.AudioWorkletNode;
      window.AudioWorkletNode = function() {
        console.log('🚫 Blocked AudioWorkletNode creation to prevent Krisp errors');
        throw new Error('AudioWorkletNode disabled to prevent compatibility issues');
      };
      
      // Keep reference to original for legitimate uses
      window.AudioWorkletNode.original = originalAudioWorkletNode;
    }
    
    // Override AudioContext.audioWorklet to prevent worklet module loading
    if (typeof AudioContext !== 'undefined' && AudioContext.prototype.audioWorklet) {
      const originalAddModule = AudioContext.prototype.audioWorklet.addModule;
      AudioContext.prototype.audioWorklet.addModule = function(moduleURL) {
        if (moduleURL && moduleURL.includes('krisp')) {
          console.log('🚫 Blocked Krisp worklet module loading:', moduleURL);
          return Promise.reject(new Error('Krisp worklet disabled'));
        }
        return originalAddModule.call(this, moduleURL);
      };
    }
    
    // Override fetch to block Krisp-related requests
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
      const url = typeof input === 'string' ? input : input.url;
      
      if (url && (url.includes('krisp') || url.includes('noise-filter'))) {
        console.log('🚫 Blocked Krisp-related fetch request:', url);
        return Promise.reject(new Error('Krisp requests blocked'));
      }
      
      return originalFetch.call(this, input, init);
    };
    
    // Set Daily.co configuration to disable problematic features
    window.DAILY_CONFIG_OVERRIDE = {
      enableKrisp: false,
      enableNoiseCancellation: false,
      enableBackgroundBlur: false,
      enableVirtualBackground: false,
      audioProcessing: {
        krisp: false,
        noiseCancellation: false
      }
    };
    
    console.log('✅ Krisp and problematic features disabled globally');
  }
})();
