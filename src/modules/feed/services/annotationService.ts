import { supabase } from '@/lib/supabase'
import type { ChartAnnotation, CreateAnnotationParams } from '../types/feedTypes'

/**
 * Service for managing chart annotations in Supabase
 */
export const annotationService = {
  /**
   * Save a feed event as a chart annotation
   * Requires wallet connection
   * @param params - Annotation parameters
   * @returns Promise resolving to created annotation
   */
  async saveAnnotation(params: CreateAnnotationParams): Promise<ChartAnnotation> {
    try {
      const { data, error } = await supabase
        .from('chart_annotations')
        .insert({
          user_id: params.walletAddress,
          asset: params.asset,
          timestamp: params.timestamp,
          note: params.note,
          source: 'feed',
          feed_item_id: params.feedItemId || null,
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving annotation:', error)
        throw error
      }

      if (!data) {
        throw new Error('No data returned after saving annotation')
      }

      return data as ChartAnnotation
    } catch (error) {
      console.error('Unexpected error saving annotation:', error)
      throw error
    }
  },

  /**
   * Create a custom user annotation (not from feed)
   * @param params - Annotation parameters without feedItemId
   * @returns Promise resolving to created annotation
   */
  async createUserAnnotation(params: Omit<CreateAnnotationParams, 'feedItemId'>): Promise<ChartAnnotation> {
    try {
      const { data, error } = await supabase
        .from('chart_annotations')
        .insert({
          user_id: params.walletAddress,
          asset: params.asset,
          timestamp: params.timestamp,
          note: params.note,
          source: 'user',
          feed_item_id: null,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating user annotation:', error)
        throw error
      }

      if (!data) {
        throw new Error('No data returned after creating user annotation')
      }

      return data as ChartAnnotation
    } catch (error) {
      console.error('Unexpected error creating user annotation:', error)
      throw error
    }
  },

  /**
   * Fetch all annotations for a user's wallet address and asset
   * @param walletAddress - Solana wallet address
   * @param asset - Asset symbol (e.g., 'SOL', 'BTC', 'ETH')
   * @returns Promise resolving to array of annotations
   */
  async getUserAnnotations(walletAddress: string, asset: string): Promise<ChartAnnotation[]> {
    try {
      const { data, error } = await supabase
        .from('chart_annotations')
        .select('*')
        .eq('user_id', walletAddress)
        .eq('asset', asset)
        .order('timestamp', { ascending: false })

      if (error) {
        console.error('Error fetching user annotations:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Unexpected error fetching user annotations:', error)
      throw error
    }
  },

  /**
   * Fetch all annotations for a specific user (across all assets)
   * @param walletAddress - Solana wallet address
   * @returns Promise resolving to array of annotations
   */
  async getAllUserAnnotations(walletAddress: string): Promise<ChartAnnotation[]> {
    try {
      const { data, error } = await supabase
        .from('chart_annotations')
        .select('*')
        .eq('user_id', walletAddress)
        .order('timestamp', { ascending: false })

      if (error) {
        console.error('Error fetching all user annotations:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Unexpected error fetching all user annotations:', error)
      throw error
    }
  },

  /**
   * Fetch annotations for an asset (for all users - useful for shared view)
   * @param asset - Asset symbol (e.g., 'SOL', 'BTC', 'ETH')
   * @param limit - Optional limit on number of results
   * @returns Promise resolving to array of annotations
   */
  async getAnnotationsByAsset(asset: string, limit?: number): Promise<ChartAnnotation[]> {
    try {
      let query = supabase
        .from('chart_annotations')
        .select('*')
        .eq('asset', asset)
        .order('timestamp', { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) {
        console.error(`Error fetching annotations for asset ${asset}:`, error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error(`Unexpected error fetching annotations for asset ${asset}:`, error)
      throw error
    }
  },

  /**
   * Delete an annotation
   * @param annotationId - Annotation UUID
   * @param walletAddress - Solana wallet address (for security check)
   * @returns Promise resolving when deletion is complete
   */
  async deleteAnnotation(annotationId: string, walletAddress: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chart_annotations')
        .delete()
        .eq('id', annotationId)
        .eq('user_id', walletAddress) // Safety check - only delete own annotations

      if (error) {
        console.error('Error deleting annotation:', error)
        throw error
      }
    } catch (error) {
      console.error('Unexpected error deleting annotation:', error)
      throw error
    }
  },

  /**
   * Update an annotation's note
   * @param annotationId - Annotation UUID
   * @param walletAddress - Solana wallet address (for security check)
   * @param newNote - Updated note text
   * @returns Promise resolving to updated annotation
   */
  async updateAnnotation(
    annotationId: string,
    walletAddress: string,
    newNote: string
  ): Promise<ChartAnnotation> {
    try {
      const { data, error } = await supabase
        .from('chart_annotations')
        .update({ note: newNote })
        .eq('id', annotationId)
        .eq('user_id', walletAddress) // Safety check - only update own annotations
        .select()
        .single()

      if (error) {
        console.error('Error updating annotation:', error)
        throw error
      }

      if (!data) {
        throw new Error('No data returned after updating annotation')
      }

      return data as ChartAnnotation
    } catch (error) {
      console.error('Unexpected error updating annotation:', error)
      throw error
    }
  },

  /**
   * Get annotation count for a user and asset (useful for 10-annotation limit)
   * @param walletAddress - Solana wallet address
   * @param asset - Asset symbol
   * @returns Promise resolving to count
   */
  async getAnnotationCount(walletAddress: string, asset: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('chart_annotations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', walletAddress)
        .eq('asset', asset)

      if (error) {
        console.error('Error counting annotations:', error)
        throw error
      }

      return count || 0
    } catch (error) {
      console.error('Unexpected error counting annotations:', error)
      throw error
    }
  },

  /**
   * Check if adding a new annotation would exceed the limit
   * @param walletAddress - Solana wallet address
   * @param asset - Asset symbol
   * @param limit - Maximum allowed annotations (default: 10)
   * @returns Promise resolving to boolean
   */
  async canAddAnnotation(walletAddress: string, asset: string, limit = 10): Promise<boolean> {
    try {
      const count = await this.getAnnotationCount(walletAddress, asset)
      return count < limit
    } catch (error) {
      console.error('Error checking annotation limit:', error)
      return false
    }
  },
}
