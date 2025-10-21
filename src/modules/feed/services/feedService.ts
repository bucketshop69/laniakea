import { supabase } from '@/lib/supabase'
import type { FeedItem } from '../types/feedTypes'

/**
 * Service for fetching feed items from Supabase
 */
export const feedService = {
  /**
   * Fetch all feed items, sorted by timestamp (newest first)
   * @returns Promise resolving to array of feed items
   */
  async getAllFeedItems(): Promise<FeedItem[]> {
    try {
      const { data, error } = await supabase
        .from('feed_items')
        .select('*')
        .order('timestamp', { ascending: false })

      if (error) {
        console.error('Error fetching feed items:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Unexpected error fetching feed items:', error)
      throw error
    }
  },

  /**
   * Fetch feed items for a specific asset
   * @param asset - Asset symbol (e.g., 'SOL', 'BTC', 'ETH')
   * @returns Promise resolving to array of feed items
   */
  async getFeedItemsByAsset(asset: string): Promise<FeedItem[]> {
    try {
      const { data, error } = await supabase
        .from('feed_items')
        .select('*')
        .eq('asset_related_to', asset)
        .order('timestamp', { ascending: false })

      if (error) {
        console.error(`Error fetching feed items for asset ${asset}:`, error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error(`Unexpected error fetching feed items for asset ${asset}:`, error)
      throw error
    }
  },

  /**
   * Fetch feed items by category
   * @param category - Category name (e.g., 'macro', 'protocol', 'defi')
   * @returns Promise resolving to array of feed items
   */
  async getFeedItemsByCategory(category: string): Promise<FeedItem[]> {
    try {
      const { data, error } = await supabase
        .from('feed_items')
        .select('*')
        .contains('category', [category])
        .order('timestamp', { ascending: false })

      if (error) {
        console.error(`Error fetching feed items for category ${category}:`, error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error(`Unexpected error fetching feed items for category ${category}:`, error)
      throw error
    }
  },

  /**
   * Fetch a single feed item by ID
   * @param id - Feed item UUID
   * @returns Promise resolving to feed item or null
   */
  async getFeedItemById(id: string): Promise<FeedItem | null> {
    try {
      const { data, error } = await supabase
        .from('feed_items')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error(`Error fetching feed item ${id}:`, error)
        throw error
      }

      return data
    } catch (error) {
      console.error(`Unexpected error fetching feed item ${id}:`, error)
      throw error
    }
  },

  /**
   * Fetch feed items within a date range
   * @param startDate - Start date (ISO 8601 string)
   * @param endDate - End date (ISO 8601 string)
   * @returns Promise resolving to array of feed items
   */
  async getFeedItemsByDateRange(startDate: string, endDate: string): Promise<FeedItem[]> {
    try {
      const { data, error } = await supabase
        .from('feed_items')
        .select('*')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)
        .order('timestamp', { ascending: false })

      if (error) {
        console.error('Error fetching feed items by date range:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Unexpected error fetching feed items by date range:', error)
      throw error
    }
  },

  /**
   * Fetch feed items with multiple filters
   * @param filters - Object with optional asset and category filters
   * @returns Promise resolving to array of feed items
   */
  async getFeedItemsWithFilters(filters: {
    asset?: string
    category?: string
    limit?: number
  }): Promise<FeedItem[]> {
    try {
      let query = supabase.from('feed_items').select('*')

      if (filters.asset) {
        query = query.eq('asset_related_to', filters.asset)
      }

      if (filters.category) {
        query = query.contains('category', [filters.category])
      }

      query = query.order('timestamp', { ascending: false })

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching feed items with filters:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Unexpected error fetching feed items with filters:', error)
      throw error
    }
  },
}
