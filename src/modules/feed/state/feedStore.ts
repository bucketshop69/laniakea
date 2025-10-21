import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FeedItem, Asset, FeedCategory } from '../types/feedTypes'
import { feedService } from '../services/feedService'

/**
 * Feed filters state
 */
export interface FeedFilters {
  asset: Asset | null
  category: FeedCategory | null
}

/**
 * Feed store state and actions
 */
interface FeedStoreState {
  // State
  feedItems: FeedItem[]
  filteredItems: FeedItem[]
  filters: FeedFilters
  selectedFeedItemId: string | null
  isLoading: boolean
  error: string | null
  lastFetchedAt: number | null

  // Actions
  loadFeedItems: () => Promise<void>
  setFilter: (filterType: 'asset' | 'category', value: string | null) => void
  clearFilters: () => void
  selectFeedItem: (itemId: string | null) => void
  refreshFeed: () => Promise<void>
  applyFilters: () => void
}

/**
 * Helper function to apply filters to feed items
 */
const filterFeedItems = (items: FeedItem[], filters: FeedFilters): FeedItem[] => {
  let filtered = [...items]

  if (filters.asset) {
    filtered = filtered.filter((item) => item.asset_related_to === filters.asset)
  }

  if (filters.category) {
    filtered = filtered.filter((item) => item.category?.includes(filters.category as string))
  }

  return filtered
}

/**
 * Feed store with Zustand
 * Manages feed items, filters, and loading states
 */
export const useFeedStore = create<FeedStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      feedItems: [],
      filteredItems: [],
      filters: {
        asset: null,
        category: null,
      },
      selectedFeedItemId: null,
      isLoading: false,
      error: null,
      lastFetchedAt: null,

      // Load all feed items from Supabase
      loadFeedItems: async () => {
        set({ isLoading: true, error: null })

        try {
          const items = await feedService.getAllFeedItems()
          const { filters } = get()
          const filtered = filterFeedItems(items, filters)

          set({
            feedItems: items,
            filteredItems: filtered,
            isLoading: false,
            lastFetchedAt: Date.now(),
          })
        } catch (error) {
          console.error('Error loading feed items:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to load feed items',
            isLoading: false,
          })
        }
      },

      // Set a filter (asset or category)
      setFilter: (filterType, value) => {
        set((state) => {
          const newFilters = {
            ...state.filters,
            [filterType]: value,
          }
          const filtered = filterFeedItems(state.feedItems, newFilters)

          return {
            filters: newFilters,
            filteredItems: filtered,
          }
        })
      },

      // Clear all filters
      clearFilters: () => {
        set((state) => ({
          filters: {
            asset: null,
            category: null,
          },
          filteredItems: state.feedItems,
        }))
      },

      // Select a feed item for detail view
      selectFeedItem: (itemId) => {
        set({ selectedFeedItemId: itemId })
      },

      // Refresh feed (force reload)
      refreshFeed: async () => {
        const { loadFeedItems } = get()
        await loadFeedItems()
      },

      // Manually reapply filters (useful after data changes)
      applyFilters: () => {
        set((state) => {
          const filtered = filterFeedItems(state.feedItems, state.filters)
          return { filteredItems: filtered }
        })
      },
    }),
    {
      name: 'feed-store',
      // Only persist filters and selected item (not feed data)
      partialize: (state) => ({
        filters: state.filters,
        selectedFeedItemId: state.selectedFeedItemId,
      }),
    }
  )
)

/**
 * Selectors for derived state
 */
export const useFeedItems = () => useFeedStore((state) => state.filteredItems)
export const useFeedLoading = () => useFeedStore((state) => state.isLoading)
export const useFeedError = () => useFeedStore((state) => state.error)
export const useFeedFilters = () => useFeedStore((state) => state.filters)
export const useSelectedFeedItem = () => {
  const selectedId = useFeedStore((state) => state.selectedFeedItemId)
  const feedItems = useFeedStore((state) => state.feedItems)
  return feedItems.find((item) => item.id === selectedId) || null
}
