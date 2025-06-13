import { useEffect, useState } from 'react'
/**
 * Hook to handle hydration-safe rendering
 * Prevents hydration mismatches by only rendering on client after hydration
 */
export function useHydrationSafe() {
  const [isHydrated, setIsHydrated] = useState(false)
  useEffect(() => {
    setIsHydrated(true)
  }, [])
  return isHydrated
}
/**
 * Hook specifically for input fields that might be modified by browser extensions
 * Returns props that should be applied to input elements to prevent hydration warnings
 */
export function useInputHydrationSafe() {
  const isHydrated = useHydrationSafe()
  return {
    suppressHydrationWarning: true,
    // Only apply autocomplete after hydration to prevent extension conflicts
    autoComplete: isHydrated ? undefined : 'off',
  }
}
