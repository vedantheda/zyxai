'use client'

import { useCallback, useRef } from 'react'

interface ClickFeedbackOptions {
  haptic?: boolean
  sound?: boolean
  visual?: boolean
  ripple?: boolean
  scale?: boolean
}

/**
 * Hook for providing click feedback with haptics, sound, and visual effects
 */
export function useClickFeedback(options: ClickFeedbackOptions = {}) {
  const {
    haptic = true,
    sound = false,
    visual = true,
    ripple = true,
    scale = true
  } = options

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize click sound
  const initializeSound = useCallback(() => {
    if (sound && !audioRef.current) {
      // Create a subtle click sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1)
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    }
  }, [sound])

  // Haptic feedback
  const triggerHaptic = useCallback(() => {
    if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(10) // Very short vibration
    }
  }, [haptic])

  // Visual feedback
  const triggerVisualFeedback = useCallback((element: HTMLElement) => {
    if (!visual) return

    // Add temporary class for visual feedback
    element.classList.add('cursor-loading')
    
    setTimeout(() => {
      element.classList.remove('cursor-loading')
    }, 150)

    // Scale effect
    if (scale) {
      element.style.transform = 'scale(0.95)'
      setTimeout(() => {
        element.style.transform = ''
      }, 100)
    }
  }, [visual, scale])

  // Ripple effect
  const triggerRipple = useCallback((element: HTMLElement, event: MouseEvent) => {
    if (!ripple) return

    const rect = element.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    const rippleElement = document.createElement('div')
    rippleElement.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: hsl(199 89% 48% / 0.3);
      transform: scale(0);
      animation: ripple 0.6s linear;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      pointer-events: none;
      z-index: 1000;
    `

    // Add ripple animation keyframes if not already added
    if (!document.querySelector('#ripple-keyframes')) {
      const style = document.createElement('style')
      style.id = 'ripple-keyframes'
      style.textContent = `
        @keyframes ripple {
          to {
            transform: scale(2);
            opacity: 0;
          }
        }
      `
      document.head.appendChild(style)
    }

    element.style.position = 'relative'
    element.style.overflow = 'hidden'
    element.appendChild(rippleElement)

    setTimeout(() => {
      rippleElement.remove()
    }, 600)
  }, [ripple])

  // Main click feedback function
  const handleClick = useCallback((event: MouseEvent) => {
    const element = event.currentTarget as HTMLElement
    
    // Trigger all feedback types
    triggerHaptic()
    initializeSound()
    triggerVisualFeedback(element)
    triggerRipple(element, event)
  }, [triggerHaptic, initializeSound, triggerVisualFeedback, triggerRipple])

  // Get click props for elements
  const getClickProps = useCallback(() => ({
    onClick: handleClick,
    className: 'interactive-element'
  }), [handleClick])

  return {
    handleClick,
    getClickProps,
    triggerHaptic,
    triggerVisualFeedback,
    triggerRipple
  }
}

/**
 * Hook for enhanced button feedback
 */
export function useButtonFeedback(options: ClickFeedbackOptions = {}) {
  const { handleClick, getClickProps } = useClickFeedback({
    haptic: true,
    visual: true,
    ripple: true,
    scale: true,
    ...options
  })

  const getButtonProps = useCallback(() => ({
    ...getClickProps(),
    className: 'btn-press ripple-effect'
  }), [getClickProps])

  return {
    handleClick,
    getButtonProps
  }
}

/**
 * Hook for enhanced link feedback
 */
export function useLinkFeedback(options: ClickFeedbackOptions = {}) {
  const { handleClick, getClickProps } = useClickFeedback({
    haptic: true,
    visual: true,
    ripple: false,
    scale: false,
    ...options
  })

  const getLinkProps = useCallback(() => ({
    ...getClickProps(),
    className: 'link-hover'
  }), [getClickProps])

  return {
    handleClick,
    getLinkProps
  }
}

/**
 * Hook for card click feedback
 */
export function useCardFeedback(options: ClickFeedbackOptions = {}) {
  const { handleClick, getClickProps } = useClickFeedback({
    haptic: true,
    visual: true,
    ripple: true,
    scale: false,
    ...options
  })

  const getCardProps = useCallback(() => ({
    ...getClickProps(),
    className: 'card-interactive'
  }), [getClickProps])

  return {
    handleClick,
    getCardProps
  }
}

/**
 * Global click feedback utility
 */
export const ClickFeedback = {
  // Quick setup for common elements
  button: (options?: ClickFeedbackOptions) => {
    const { getButtonProps } = useButtonFeedback(options)
    return getButtonProps()
  },
  
  link: (options?: ClickFeedbackOptions) => {
    const { getLinkProps } = useLinkFeedback(options)
    return getLinkProps()
  },
  
  card: (options?: ClickFeedbackOptions) => {
    const { getCardProps } = useCardFeedback(options)
    return getCardProps()
  }
}
