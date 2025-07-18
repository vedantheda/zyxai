# Infinite Loading Cycle Fix

## Problem
When users alt-tab (unfocus the browser tab) and then return to the application, it would often get stuck in an infinite loading cycle. This happened because:

1. **Tab Focus Events**: When a tab loses focus and regains it, the AuthProvider would trigger `initializeAuth(true)` to refresh the authentication state
2. **Loading State Conflicts**: Multiple components had their own loading states that could get out of sync
3. **Interrupted Operations**: Async operations could be interrupted when the tab lost focus, leaving loading states stuck
4. **Rapid Event Firing**: Multiple focus/visibility events could fire in quick succession, causing race conditions

## Solution

### 1. AuthProvider Improvements

**Debounced Refresh Operations**:
- Added debouncing to prevent rapid successive calls to `initializeAuth`
- Refresh operations no longer set loading to `true` to prevent UI flickering
- Added timeout management to prevent memory leaks

**Smart Loading State Management**:
```typescript
const initializeAuth = async (isRefresh = false) => {
  if (isRefresh) {
    // For refresh operations, don't show loading spinner
    // Only refresh the session and user data silently
  } else {
    // Only set loading to true for initial auth
    setLoading(true)
  }
  // ... rest of auth logic
}
```

**Event Handler Debouncing**:
```typescript
const handleVisibilityChange = () => {
  if (!document.hidden && mounted) {
    const now = Date.now()
    if (now - lastRefreshRef.current > REFRESH_DEBOUNCE_MS) {
      // Clear any existing timeout to prevent multiple rapid calls
      if (refreshTimeoutRef) {
        clearTimeout(refreshTimeoutRef)
      }
      
      // Debounce the refresh to prevent rapid successive calls
      refreshTimeoutRef = setTimeout(() => {
        if (mounted) {
          initializeAuth(true)
        }
      }, 100) // Small delay to batch rapid events
    }
  }
}
```

### 2. PageLoader Enhancements

**Force Ready Mechanism**:
- Added `forceReady` state that activates after a timeout
- Prevents infinite loading by forcing the page to be ready after 5 seconds
- Improved logging for debugging

### 3. LoadingProvider Improvements

**Visibility Change Handling**:
- Added automatic detection of stuck loading states when tab becomes visible
- Force stops loading if it's been active for more than 10 seconds when tab regains focus

### 4. New Tab-Safe Loading Hooks

Created `useTabSafeLoading` hook family for components that need loading states:

**useTabSafeLoading**:
```typescript
const { loading, error, setLoading, withLoading, forceStop } = useTabSafeLoading({
  maxLoadingTime: 15000, // Auto-stop after 15 seconds
  resetOnVisibilityChange: true, // Reset when tab becomes visible
  debugName: 'MyComponent' // For debugging
})
```

**usePageLoading** (for page-level loading):
```typescript
const { loading, error, withLoading } = usePageLoading()

// Use with async operations
const loadData = async () => {
  const result = await withLoading(
    () => fetchData(),
    'Failed to load data'
  )
  if (result) {
    setData(result)
  }
}
```

**useComponentLoading** (for component-level loading):
```typescript
const { loading, setLoading } = useComponentLoading()
```

## Key Features of the Fix

### 1. **Debounced Event Handling**
- Prevents rapid successive auth refreshes
- Batches multiple focus/visibility events
- Reduces race conditions

### 2. **Smart Loading States**
- Refresh operations don't trigger loading spinners
- Multiple timeout mechanisms prevent infinite loading
- Automatic cleanup prevents memory leaks

### 3. **Tab Visibility Awareness**
- Detects when tabs become visible again
- Automatically stops stuck loading states
- Prevents operations from being stuck indefinitely

### 4. **Graceful Degradation**
- Force ready mechanisms ensure pages always load eventually
- Error states provide user feedback
- Logging helps with debugging

## Usage Guidelines

### For New Components
Use the new tab-safe loading hooks instead of manual useState for loading:

```typescript
// ❌ Old way (prone to infinite loading)
const [loading, setLoading] = useState(false)

// ✅ New way (tab-safe)
const { loading, withLoading } = usePageLoading()
```

### For Existing Components
Replace manual loading state management with the new hooks where appropriate, especially for:
- Page-level components
- Components that make API calls
- Components that might be affected by tab focus changes

### For Auth-Related Components
The AuthProvider improvements are automatic and don't require changes to existing components using `useAuth()`.

## Testing the Fix

1. **Basic Tab Switching**: Alt-tab away and back to the application multiple times
2. **Rapid Tab Switching**: Quickly switch between tabs multiple times
3. **Long Tab Absence**: Leave the tab unfocused for several minutes, then return
4. **Network Issues**: Test with poor network conditions while tab switching
5. **Multiple Windows**: Test with multiple browser windows/tabs open

## Monitoring

The fix includes extensive logging (in development mode) to help monitor:
- Auth refresh operations
- Loading state changes
- Force ready activations
- Stuck loading state detections

Look for console messages with prefixes:
- `🔄` - Auth refresh operations
- `🚨` - Force ready/stop operations
- `🧪` - Debug state information
