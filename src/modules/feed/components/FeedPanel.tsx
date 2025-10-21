import React, { useEffect, useRef } from 'react'
import { Clock, Loader2, AlertCircle } from 'lucide-react'
import { useFeedStore } from '../state/feedStore'
import { FeedCard } from './FeedCard'
import type { FeedItem } from '../types/feedTypes'

export const FeedPanel: React.FC = () => {
  const feedItems = useFeedStore((state) => state.filteredItems)
  const isLoading = useFeedStore((state) => state.isLoading)
  const error = useFeedStore((state) => state.error)
  const loadFeedItems = useFeedStore((state) => state.loadFeedItems)

  const nowMarkerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Load feed items on mount
  useEffect(() => {
    loadFeedItems()
  }, [loadFeedItems])

  // Auto-scroll to NOW marker after feed items load
  useEffect(() => {
    if (feedItems.length > 0 && nowMarkerRef.current && scrollContainerRef.current) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        nowMarkerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }, 100)
    }
  }, [feedItems.length])

  // Split items into past and future based on current time
  const now = new Date()
  const pastItems = feedItems.filter((item) => new Date(item.timestamp) < now)
  const futureItems = feedItems.filter((item) => new Date(item.timestamp) >= now)

  // Sort: past items newest first, future items soonest first
  const sortedPastItems = [...pastItems].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
  const sortedFutureItems = [...futureItems].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  const handleSaveToChart = (item: FeedItem) => {
    console.log('Save to chart:', item)
    // TODO: Phase 8 - Implement save to chart logic
    alert('Save to chart functionality will be implemented in Phase 8')
  }

  // Loading state
  if (isLoading && feedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading feed...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-red-400">Failed to load feed</p>
        <p className="text-xs text-muted-foreground">{error}</p>
        <button
          onClick={() => loadFeedItems()}
          className="text-xs text-blue-400 hover:text-blue-300 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  // Empty state
  if (feedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <AlertCircle className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No feed items available</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-primary">Market Feed</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {feedItems.length} event{feedItems.length !== 1 ? 's' : ''} • {sortedPastItems.length}{' '}
          past • {sortedFutureItems.length} upcoming
        </p>
      </div>

      {/* Scrollable Feed */}
      <div ref={scrollContainerRef} className="flex-1 space-y-3 max-h-96 overflow-y-auto pr-2">
        {/* Past Events */}
        {sortedPastItems.map((item) => (
          <FeedCard key={item.id} item={item} onSaveToChart={handleSaveToChart} />
        ))}

        {/* NOW Marker */}
        <div ref={nowMarkerRef} className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-primary/50"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 py-1 text-xs font-medium text-primary flex items-center gap-2 border border-primary/50 rounded-full">
              <Clock size={12} />
              NOW - {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Future Events */}
        {sortedFutureItems.map((item) => (
          <FeedCard key={item.id} item={item} onSaveToChart={handleSaveToChart} />
        ))}

        {/* End spacer */}
        <div className="h-4"></div>
      </div>
    </div>
  )
}
