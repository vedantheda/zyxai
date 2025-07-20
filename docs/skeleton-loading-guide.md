# Skeleton Loading System Guide

This guide explains how to use the comprehensive skeleton loading system implemented in ZyxAI.

## Overview

The skeleton loading system provides consistent, beautiful loading states across the application. Instead of showing blank pages or simple spinners, users see skeleton placeholders that match the expected content structure.

## Components

### 1. Basic Skeleton Components

Located in `src/components/ui/skeleton.tsx`:

- `Skeleton` - Base skeleton component with shimmer effect
- `SkeletonCard` - Card-shaped skeleton for dashboard cards
- `SkeletonTable` - Table skeleton with header and rows
- `SkeletonList` - List skeleton for contact/agent lists
- `SkeletonStats` - Stats grid skeleton for analytics
- `SkeletonDashboard` - Complete dashboard skeleton
- `SkeletonAgents` - Agents page skeleton
- `SkeletonContacts` - Contacts page skeleton
- `SkeletonCampaigns` - Campaigns page skeleton

### 2. Page Skeleton Component

Located in `src/components/ui/page-skeleton.tsx`:

```tsx
import { PageSkeleton } from '@/components/ui/page-skeleton'

// Usage
<PageSkeleton type="dashboard" />
<PageSkeleton type="agents" />
<PageSkeleton type="contacts" />
<PageSkeleton type="campaigns" />
<PageSkeleton type="leads" />
<PageSkeleton type="analytics" />
<PageSkeleton type="settings" />
<PageSkeleton type="generic" />
```

### 3. Smart Skeleton Components

Located in `src/components/ui/with-skeleton.tsx`:

#### SmartSkeleton
Automatically handles loading, data, and error states:

```tsx
import { SmartSkeleton } from '@/components/ui/with-skeleton'

<SmartSkeleton 
  loading={isLoading} 
  data={data} 
  error={error}
  skeletonType="stats"
>
  <YourComponent data={data} />
</SmartSkeleton>
```

#### SkeletonWrapper
Simple wrapper for conditional skeleton display:

```tsx
import { SkeletonWrapper } from '@/components/ui/with-skeleton'

<SkeletonWrapper loading={isLoading} skeletonType="table" count={5}>
  <YourTable data={data} />
</SkeletonWrapper>
```

#### withSkeleton HOC
Higher-order component for adding skeleton to any component:

```tsx
import { withSkeleton } from '@/components/ui/with-skeleton'

const MyComponentWithSkeleton = withSkeleton(MyComponent, {
  skeletonType: 'card',
  count: 3,
  minLoadingTime: 500
})
```

## Hooks

### useSkeletonLoading

Located in `src/hooks/useSkeletonLoading.ts`:

```tsx
import { useSkeletonLoading } from '@/hooks/useSkeletonLoading'

const MyComponent = () => {
  const skeleton = useSkeletonLoading({
    minLoadingTime: 300,
    maxLoadingTime: 10000,
    debugName: 'MyComponent'
  })

  const loadData = async () => {
    skeleton.startLoading()
    try {
      const data = await fetchData()
      setData(data)
    } finally {
      skeleton.stopLoading()
    }
  }

  if (skeleton.showSkeleton) {
    return <SkeletonCard />
  }

  return <div>Your content</div>
}
```

### useSkeletonData

For data fetching with automatic skeleton handling:

```tsx
import { useSkeletonData } from '@/hooks/useSkeletonLoading'

const MyComponent = () => {
  const { data, error, showSkeleton, refetch } = useSkeletonData(
    () => fetchMyData(),
    [dependency1, dependency2],
    { minLoadingTime: 500 }
  )

  if (showSkeleton) {
    return <SkeletonTable rows={5} />
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return <MyTable data={data} />
}
```

## Implementation Examples

### 1. Page-Level Loading

Replace simple loading screens with page skeletons:

```tsx
// Before
if (loading) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

// After
if (loading) {
  return <PageSkeleton type="agents" />
}
```

### 2. Component-Level Loading

Replace inline loading states:

```tsx
// Before
{isLoading ? (
  <div className="p-8 text-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
    <p className="mt-2 text-muted-foreground">Loading...</p>
  </div>
) : (
  <MyTable data={data} />
)}

// After
<SmartSkeleton loading={isLoading} data={data} skeletonType="table">
  <MyTable data={data} />
</SmartSkeleton>
```

### 3. Suspense Fallbacks

Update Suspense fallbacks to use skeletons:

```tsx
// Before
<Suspense fallback={<div>Loading...</div>}>
  <MyComponent />
</Suspense>

// After
<Suspense fallback={<PageSkeleton type="dashboard" />}>
  <MyComponent />
</Suspense>
```

## Best Practices

### 1. Choose Appropriate Skeleton Types

- **Page skeletons** for full page loading states
- **Table skeletons** for data tables
- **Card skeletons** for dashboard cards
- **List skeletons** for contact/agent lists
- **Stats skeletons** for analytics grids

### 2. Set Appropriate Timing

- **minLoadingTime**: 300-500ms to prevent flash
- **maxLoadingTime**: 10-15s to prevent infinite loading
- **Component loading**: Shorter timeouts (5s)
- **Page loading**: Longer timeouts (15s)

### 3. Maintain Layout Consistency

Ensure skeletons match the actual content layout:

```tsx
// Good - skeleton matches actual content structure
<SkeletonTable rows={expectedRowCount} />

// Bad - skeleton doesn't match content
<SkeletonCard /> // when showing a table
```

### 4. Use Smart Loading States

Combine skeleton with data and error handling:

```tsx
<SmartSkeleton 
  loading={isLoading} 
  data={data} 
  error={error}
  skeletonType="appropriate-type"
  errorFallback={<CustomErrorComponent />}
>
  <YourContent />
</SmartSkeleton>
```

## Migration Guide

### Step 1: Replace Simple Loading Screens

Find components with basic loading states and replace with PageSkeleton:

```bash
# Search for loading patterns
grep -r "Loading..." src/
grep -r "animate-spin" src/
```

### Step 2: Update Suspense Fallbacks

Replace simple fallbacks with appropriate skeletons:

```tsx
// Update all Suspense components
<Suspense fallback={<PageSkeleton type="appropriate-type" />}>
```

### Step 3: Add Inline Skeletons

For components with data fetching, wrap with SmartSkeleton or SkeletonWrapper.

### Step 4: Test Loading States

Ensure all loading states show appropriate skeletons:

1. Test slow network conditions
2. Test error states
3. Verify skeleton timing
4. Check layout consistency

## Troubleshooting

### Skeleton Not Showing

1. Check if `loading` prop is properly passed
2. Verify skeleton type matches content
3. Check console for timing issues

### Layout Shifts

1. Ensure skeleton dimensions match content
2. Use `LayoutPreservingSkeleton` for complex layouts
3. Test with different content sizes

### Performance Issues

1. Use `memo()` for skeleton components
2. Avoid creating skeletons in render loops
3. Set appropriate `maxLoadingTime`

## CSS Animations

The skeleton system uses CSS animations defined in `globals.css`:

- `shimmer` - Shimmer effect for skeleton elements
- `pulse` - Pulse animation for loading states
- `fadeIn` - Fade in animation for content

These animations are optimized for performance and accessibility.
