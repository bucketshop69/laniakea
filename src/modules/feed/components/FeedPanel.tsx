import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Clock, Loader2, AlertCircle } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useFeedStore } from '../state/feedStore'
import { useAnnotationStore } from '../state/annotationStore'
import { FeedCard } from './FeedCard'
import { useToast, ToastContainer } from '@/hooks/useToast'
import type { FeedItem } from '../types/feedTypes'

export const FeedPanel: React.FC = () => {
  const feedItems = useFeedStore((state) => state.filteredItems)
  const isLoading = useFeedStore((state) => state.isLoading)
  const error = useFeedStore((state) => state.error)
  const loadFeedItems = useFeedStore((state) => state.loadFeedItems)

  const nowMarkerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const loadingAnnotationsRef = useRef(false) // Prevent race conditions

  // Wallet and annotation integration
  const { publicKey } = useWallet()
  const addAnnotation = useAnnotationStore((state) => state.addAnnotation)
  const deleteAnnotation = useAnnotationStore((state) => state.deleteAnnotation)
  const [savingItemId, setSavingItemId] = useState<string | null>(null)
  const { toasts, showToast } = useToast()

  // Local state for feed - load ALL user annotations
  const [allUserAnnotations, setAllUserAnnotations] = useState<any[]>([])

  // Load feed items on mount
  useEffect(() => {
    loadFeedItems()
  }, [loadFeedItems])

  // Load ALL user annotations (across all assets) for Feed display
  // This is separate from chart annotations which are asset-specific
  useEffect(() => {
    if (publicKey && !loadingAnnotationsRef.current) {
      loadingAnnotationsRef.current = true

      const loadAllAnnotations = async () => {
        try {
          // Use getAllUserAnnotations() instead of N+1 queries
          const { annotationService } = await import('../services/annotationService')
          const allAnnotations = await annotationService.getAllUserAnnotations(
            publicKey.toString()
          )

          setAllUserAnnotations(allAnnotations)
        } catch (error) {
          console.error('[FeedPanel] Failed to load all annotations:', error)
          // Continue with empty annotations rather than breaking the UI
          setAllUserAnnotations([])
        } finally {
          loadingAnnotationsRef.current = false
        }
      }

      loadAllAnnotations()
    } else if (!publicKey) {
      setAllUserAnnotations([])
      loadingAnnotationsRef.current = false
    }
  }, [publicKey])

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

  // Split items into past and future based on current time (memoized for performance)
  const { sortedPastItems, sortedFutureItems } = useMemo(() => {
    const now = new Date()
    const pastItems = feedItems.filter((item) => new Date(item.timestamp) < now)
    const futureItems = feedItems.filter((item) => new Date(item.timestamp) >= now)

    // Sort: past items closest to NOW first (descending), future items soonest first (ascending)
    // This makes items near NOW marker appear closest to it
    const sortedPastItems = [...pastItems].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    const sortedFutureItems = [...futureItems].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    return { sortedPastItems, sortedFutureItems }
  }, [feedItems])

  const handleSaveToChart = async (item: FeedItem) => {
    // Check wallet connection
    if (!publicKey) {
      showToast('Please connect your wallet to save annotations', 'warning')
      return
    }

    // SECURITY: Get the connected wallet address
    const walletAddress = publicKey.toString()

    // Check if item has asset
    if (!item.asset_related_to) {
      showToast('This feed item is not associated with an asset', 'warning')
      return
    }

    // Check if already saved (prevent duplicates)
    const alreadySaved = allUserAnnotations.some((ann) => ann.feed_item_id === item.id)

    if (alreadySaved) {
      showToast('This event is already saved to your chart!', 'warning')
      return
    }

    setSavingItemId(item.id)

    try {
      console.log('[FeedPanel] Saving annotation:', {
        wallet: walletAddress.slice(0, 8),
        asset: item.asset_related_to,
        timestamp: item.timestamp,
        note: item.title,
      })

      const result = await addAnnotation({
        walletAddress, // Use validated wallet address
        asset: item.asset_related_to,
        timestamp: item.timestamp,
        note: item.title,
        feedItemId: item.id,
      })

      if (result) {
        console.log('[FeedPanel] Annotation saved successfully:', result.id)
        // Add to local feed annotations list
        setAllUserAnnotations(prev => [result, ...prev])
        showToast(`Saved "${item.title}" to ${item.asset_related_to} chart!`, 'success')
      } else {
        console.error('[FeedPanel] Failed to save annotation - no result returned')
        showToast('Failed to save annotation. You may have reached the 10-annotation limit.', 'error')
      }
    } catch (error) {
      console.error('[FeedPanel] Error saving annotation:', error)
      showToast('Failed to save annotation. Please try again.', 'error')
    } finally {
      setSavingItemId(null)
    }
  }

  const handleRemoveFromChart = async (item: FeedItem) => {
    // Check wallet connection
    if (!publicKey) {
      showToast('Please connect your wallet to remove annotations', 'warning')
      return
    }

    // Find the annotation for this feed item
    const annotation = allUserAnnotations.find((ann) => ann.feed_item_id === item.id)

    if (!annotation) {
      showToast('Annotation not found!', 'warning')
      return
    }

    setSavingItemId(item.id)

    try {
      console.log('[FeedPanel] Removing annotation:', annotation.id)

      await deleteAnnotation(annotation.id)

      console.log('[FeedPanel] Annotation removed successfully')
      // Remove from local feed annotations list
      setAllUserAnnotations(prev => prev.filter(ann => ann.id !== annotation.id))
      showToast(`Removed "${item.title}" from chart`, 'success')
    } catch (error) {
      console.error('[FeedPanel] Error removing annotation:', error)
      showToast('Failed to remove annotation. Please try again.', 'error')
    } finally {
      setSavingItemId(null)
    }
  }

  // Loading skeleton component
  const FeedCardSkeleton = () => (
    <div className="bg-card/50 border border-muted/30 rounded-lg p-3 animate-pulse">
      <div className="flex justify-between items-start mb-2">
        <div className="h-4 bg-muted/50 rounded w-3/4"></div>
        <div className="h-3 bg-muted/50 rounded w-16"></div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-3 bg-muted/50 rounded w-full"></div>
        <div className="h-3 bg-muted/50 rounded w-5/6"></div>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-5 bg-muted/50 rounded w-16"></div>
        <div className="h-5 bg-muted/50 rounded w-12"></div>
      </div>
    </div>
  )

  // Loading state
  if (isLoading && feedItems.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="mb-1">
          <h3 className="text-sm font-medium text-primary">Market Feed</h3>
        </div>
        <div className="flex-1 space-y-3 max-h-96 overflow-y-auto pr-2">
          {[...Array(5)].map((_, i) => (
            <FeedCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="text-sm text-destructive">Failed to load feed</p>
        <p className="text-xs text-muted-foreground">{error}</p>
        <button
          onClick={() => loadFeedItems()}
          className="text-xs text-secondary-foreground underline hover:text-primary"
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
    <>
      <ToastContainer toasts={toasts} />
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-sm font-medium text-primary">Market Feed</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {feedItems.length} event{feedItems.length !== 1 ? 's' : ''} • {sortedPastItems.length}{' '}
            past • {sortedFutureItems.length} upcoming
          </p>
        </div>

        {/* Scrollable Feed */}
        <div
          ref={scrollContainerRef}
          className="flex-1 space-y-3 max-h-110 overflow-y-auto overflow-x-hidden pr-2
                     [&::-webkit-scrollbar]:w-1.5
                     [&::-webkit-scrollbar-track]:bg-transparent
                     [&::-webkit-scrollbar-thumb]:bg-primary/20
                     [&::-webkit-scrollbar-thumb]:rounded-full
                     hover:[&::-webkit-scrollbar-thumb]:bg-primary/40
                     [&::-webkit-scrollbar-thumb]:transition-colors"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'hsl(var(--primary) / 0.2) transparent'
          }}
        >
          {/* Past Events - Render in reverse so closest to NOW appears right above it */}
          {[...sortedPastItems].reverse().map((item) => (
            <FeedCard
              key={item.id}
              item={item}
              onSaveToChart={handleSaveToChart}
              onRemoveFromChart={handleRemoveFromChart}
              isSaving={savingItemId === item.id}
              isSaved={allUserAnnotations.some((ann) => ann.feed_item_id === item.id)}
            />
          ))}

          {/* NOW Marker */}
          <div ref={nowMarkerRef} className="relative py-1">
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

          {/* Future Events - Already sorted soonest first */}
          {sortedFutureItems.map((item) => (
            <FeedCard
              key={item.id}
              item={item}
              onSaveToChart={handleSaveToChart}
              onRemoveFromChart={handleRemoveFromChart}
              isSaving={savingItemId === item.id}
              isSaved={allUserAnnotations.some((ann) => ann.feed_item_id === item.id)}
            />
          ))}

          {/* End spacer */}
          <div className="h-4"></div>
        </div>
      </div>
    </>
  )
}
