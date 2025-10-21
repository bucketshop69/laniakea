# Feed State Management

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Feed Components                         │
│  (FeedPanel, FeedCard, AnnotationMarker, etc.)              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ (uses hooks)
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌───────────────┐           ┌──────────────────┐
│  feedStore    │           │ annotationStore  │
├───────────────┤           ├──────────────────┤
│ - feedItems   │           │ - annotations    │
│ - filters     │           │ - currentAsset   │
│ - isLoading   │           │ - currentWallet  │
│ - error       │           │ - isLoading      │
└───────┬───────┘           └────────┬─────────┘
        │                            │
        │ (calls)                    │ (calls)
        │                            │
        ▼                            ▼
┌───────────────┐           ┌──────────────────┐
│ feedService   │           │ annotationService│
├───────────────┤           ├──────────────────┤
│ - getAllItems │           │ - getUserAnnot.  │
│ - getByAsset  │           │ - saveAnnotation │
│ - getByCateg. │           │ - deleteAnnot.   │
└───────┬───────┘           └────────┬─────────┘
        │                            │
        └────────────┬───────────────┘
                     │
                     ▼
              ┌─────────────┐
              │  Supabase   │
              │  Database   │
              └─────────────┘
```

## Store Usage Examples

### Feed Store

```typescript
import { useFeedStore, useFeedItems } from '@/modules/feed/state/feedStore'

// In a component
function FeedPanel() {
  const loadFeedItems = useFeedStore((state) => state.loadFeedItems)
  const feedItems = useFeedItems() // Uses selector
  const isLoading = useFeedStore((state) => state.isLoading)

  useEffect(() => {
    loadFeedItems()
  }, [])

  // Filter by asset
  const setAssetFilter = useFeedStore((state) => state.setFilter)
  setAssetFilter('asset', 'SOL')

  return (
    <div>
      {isLoading ? 'Loading...' : feedItems.map(item => <FeedCard key={item.id} item={item} />)}
    </div>
  )
}
```

### Annotation Store

```typescript
import { useAnnotationStore, useAnnotations } from '@/modules/feed/state/annotationStore'
import { useWallet } from '@solana/wallet-adapter-react'

function ChartWithAnnotations() {
  const { publicKey } = useWallet()
  const loadAnnotations = useAnnotationStore((state) => state.loadAnnotations)
  const annotations = useAnnotations()
  const addAnnotation = useAnnotationStore((state) => state.addAnnotation)

  useEffect(() => {
    if (publicKey) {
      loadAnnotations(publicKey.toString(), 'SOL')
    }
  }, [publicKey])

  const handleSaveAnnotation = async () => {
    if (!publicKey) return

    await addAnnotation({
      walletAddress: publicKey.toString(),
      asset: 'SOL',
      timestamp: new Date().toISOString(),
      note: 'Important event',
      feedItemId: 'feed-item-uuid',
    })
  }

  return (
    <div>
      {annotations.map(ann => (
        <AnnotationMarker key={ann.id} annotation={ann} />
      ))}
    </div>
  )
}
```

## State Flow

### Loading Feed Items
1. Component calls `loadFeedItems()`
2. Store sets `isLoading = true`
3. `feedService.getAllFeedItems()` called
4. Supabase returns data
5. Store updates `feedItems` and `filteredItems`
6. Store sets `isLoading = false`
7. Component re-renders with new data

### Adding Annotation
1. Component calls `addAnnotation(params)`
2. Store validates wallet and checks limit
3. `annotationService.saveAnnotation()` called
4. Supabase inserts row and returns new annotation
5. Store adds to `annotations` array (sorted by timestamp)
6. Component re-renders with new annotation

### Filtering Feed
1. Component calls `setFilter('asset', 'SOL')`
2. Store updates `filters.asset = 'SOL'`
3. Store applies filter function to `feedItems`
4. Store updates `filteredItems` with filtered results
5. Component re-renders with filtered items

## Persistence

### Feed Store
- **Persisted:** `filters`, `selectedFeedItemId`
- **Not Persisted:** `feedItems`, `isLoading`, `error`
- **Storage Key:** `feed-store`

### Annotation Store
- **Not Persisted:** All state is session-only
- Annotations are loaded fresh from Supabase on mount
- Ensures data consistency across sessions

## Performance Considerations

### Optimizations
1. **Selectors:** Use granular selectors to minimize re-renders
2. **Memoization:** Filter function creates new array only when needed
3. **Pagination:** Limit feed items if list grows large (future enhancement)
4. **Lazy Loading:** Annotations loaded only when wallet connects

### Best Practices
- Use selectors (`useFeedItems()`) instead of accessing full store
- Call `loadFeedItems()` once on mount, use `refreshFeed()` sparingly
- Clear annotations on wallet disconnect to free memory
- Implement optimistic updates for better UX
