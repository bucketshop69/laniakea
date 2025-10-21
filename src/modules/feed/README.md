# Feed Module

## Overview
News feed and chart annotation system for Laniakea DeFi platform.

## Phase 1: Foundation & Setup ✅ COMPLETED

### Files Created:
1. **`/src/lib/supabase.ts`** - Supabase client initialization
2. **`/src/modules/feed/types/feedTypes.ts`** - TypeScript type definitions
3. **`/src/modules/feed/test-connection.ts`** - Connection test utility

### Type Definitions:
- `FeedItem` - News feed items from Supabase
- `ChartAnnotation` - User annotations on charts
- `CreateAnnotationParams` - Parameters for creating annotations
- `Asset` - Supported asset types (SOL, BTC, ETH)
- `FeedCategory` - Feed categories

### Environment Variables:
✅ `VITE_SUPABASE_URL` - Set in `.env`
✅ `VITE_SUPABASE_ANON_KEY` - Set in `.env`

### Testing:
To test the Supabase connection:
```typescript
import { testSupabaseConnection } from '@/modules/feed/test-connection'
await testSupabaseConnection()
// Expected: 10 feed items returned
```

---

## Phase 2: Feed Services Layer ✅ COMPLETED

### Files Created:
1. **`/src/modules/feed/services/feedService.ts`** - Feed item queries
2. **`/src/modules/feed/services/annotationService.ts`** - Annotation CRUD operations

### Feed Service Methods:
- `getAllFeedItems()` - Fetch all feed items (sorted by timestamp)
- `getFeedItemsByAsset(asset)` - Filter by specific asset
- `getFeedItemsByCategory(category)` - Filter by category
- `getFeedItemById(id)` - Get single feed item
- `getFeedItemsByDateRange(start, end)` - Filter by date range
- `getFeedItemsWithFilters({ asset?, category?, limit? })` - Combined filters

### Annotation Service Methods:
- `saveAnnotation(params)` - Save feed event to chart
- `createUserAnnotation(params)` - Create custom annotation
- `getUserAnnotations(walletAddress, asset)` - Fetch user's annotations for asset
- `getAllUserAnnotations(walletAddress)` - Fetch all user annotations
- `getAnnotationsByAsset(asset, limit?)` - Fetch annotations for asset
- `deleteAnnotation(id, walletAddress)` - Delete annotation
- `updateAnnotation(id, walletAddress, newNote)` - Update annotation note
- `getAnnotationCount(walletAddress, asset)` - Get count of annotations
- `canAddAnnotation(walletAddress, asset, limit)` - Check if under limit (default: 10)

### Features:
- ✅ Comprehensive error handling
- ✅ TypeScript type safety
- ✅ 10-annotation limit checking
- ✅ Wallet address validation on mutations
- ✅ Flexible filtering options

---

## Phase 3: State Management (Zustand Stores) ✅ COMPLETED

### Files Created:
1. **`/src/modules/feed/state/feedStore.ts`** - Feed state management
2. **`/src/modules/feed/state/annotationStore.ts`** - Annotation state management

### Feed Store Features:
- **State:**
  - `feedItems` - All feed items from Supabase
  - `filteredItems` - Filtered feed items based on current filters
  - `filters` - Active asset/category filters
  - `selectedFeedItemId` - Currently selected feed item
  - `isLoading`, `error`, `lastFetchedAt` - UI states

- **Actions:**
  - `loadFeedItems()` - Fetch all feed items
  - `setFilter(type, value)` - Set asset or category filter
  - `clearFilters()` - Reset all filters
  - `selectFeedItem(id)` - Select item for detail view
  - `refreshFeed()` - Force reload feed items
  - `applyFilters()` - Reapply current filters

- **Selectors:**
  - `useFeedItems()` - Get filtered feed items
  - `useFeedLoading()` - Get loading state
  - `useFeedError()` - Get error state
  - `useFeedFilters()` - Get current filters
  - `useSelectedFeedItem()` - Get selected feed item

- **Persistence:** Filters and selected item saved to localStorage

### Annotation Store Features:
- **State:**
  - `annotations` - User's annotations for current asset
  - `currentAsset` - Currently selected asset
  - `currentWalletAddress` - Connected wallet address
  - `isLoading`, `error` - UI states
  - `annotationLimit` - Max annotations (default: 10)

- **Actions:**
  - `loadAnnotations(wallet, asset)` - Load user's annotations
  - `addAnnotation(params)` - Create new annotation (with limit check)
  - `deleteAnnotation(id)` - Delete annotation
  - `updateAnnotation(id, note)` - Update annotation note
  - `clearAnnotations()` - Clear state
  - `setCurrentAsset(asset)` - Set current asset
  - `setCurrentWallet(wallet)` - Set wallet address
  - `checkCanAddAnnotation()` - Check if under limit
  - `getAnnotationCount()` - Get current count

- **Selectors:**
  - `useAnnotations()` - Get all annotations
  - `useAnnotationsLoading()` - Get loading state
  - `useAnnotationsError()` - Get error state
  - `useCurrentAsset()` - Get current asset
  - `useAnnotationCount()` - Get annotation count
  - `useCanAddAnnotation()` - Check if can add more
  - `useChartAnnotations()` - Get 10 most recent for chart

### Features:
✅ Follows existing Zustand patterns (like meteoraStore)
✅ localStorage persistence for feed preferences
✅ Automatic filter application
✅ 10-annotation limit enforcement
✅ Optimistic updates for better UX
✅ Comprehensive selectors for components
✅ Error handling and validation
✅ TypeScript type safety

---

## Phase 4: Feed UI Components ✅ COMPLETED

### Files Created:
1. **`/src/modules/feed/components/FeedPanel.tsx`** - Main feed container
2. **`/src/modules/feed/components/FeedCard.tsx`** - Individual feed item cards
3. **`/src/modules/feed/components/index.ts`** - Component exports

### FeedPanel Features:
- **Timeline Layout:**
  - Past events at top (newest first)
  - "NOW" marker at 60% position
  - Future events at bottom (soonest first)
  - Single scrollable container

- **States:**
  - Loading state with spinner
  - Error state with retry button
  - Empty state when no items
  - Shows count of past/future events

- **Data Flow:**
  - Fetches from `useFeedStore` on mount
  - Splits items by current timestamp
  - Sorts past/future appropriately

### FeedCard Features:
- **Visual Design:**
  - Timeline dot with category icon
  - Title, description, timestamp
  - Category tags (color-coded)
  - Asset badges (SOL/BTC/ETH)
  - Hover effects

- **Category Icons:**
  - 📊 Macro/Market → TrendingUp (blue)
  - 📅 Protocol/Ecosystem → Calendar (purple)
  - 💰 DeFi/Lending → TrendingDown (green)
  - 📈 Derivatives → TrendingUp (orange)
  - 📰 Default → Rss (gray)

- **Actions:**
  - "Read More" link (external URL)
  - "Save to Chart" button (only if asset exists)
  - Conditional rendering based on data

### Integration:
✅ Imported into ActionPanel
✅ Replaces placeholder feed tab
✅ Uses existing Tailwind classes
✅ Matches dark theme design
✅ Responsive layout

---

## Phase 5: ActionPanel Integration ✅ COMPLETED

### Changes Made:
- Added `FeedPanel` import to `ActionPanel.tsx`
- Replaced placeholder feed content (lines 403-439)
- Feed tab now renders live Supabase data
- Removed `opacity-50` placeholder styling

### Integration Points:
```typescript
import { FeedPanel } from '@/modules/feed/components'

<TabsContent value="feed" className="flex-1 px-4">
  <FeedPanel />
</TabsContent>
```

---

## Next Steps (Phase 6)
Create Annotation Components:
- `AnnotationMarker.tsx` - Visual marker on charts
- `AnnotationToggle.tsx` - Toggle to show/hide markers
- Integration with Drift chart
