import { supabase } from '@/lib/supabase';
import { AdminFeedItem } from '../admin/types';

interface CreateFeedItemResponse {
  success: boolean;
  data?: AdminFeedItem;
  error?: string;
}

/**
 * Service for creating feed items in Supabase
 */
export const feedAdminService = {
  /**
   * Create a new feed item
   * @param item - Feed item to create
   * @returns Promise resolving to CreateFeedItemResponse
   */
  async createFeedItem(item: Omit<AdminFeedItem, 'id' | 'created_at' | 'updated_at'>): Promise<CreateFeedItemResponse> {
    try {
      // Prepare the item data for insertion
      const feedItemData = {
        title: item.title,
        description: item.description,
        timestamp: item.timestamp,
        category: item.category || [],
        asset_related_to: item.asset_related_to,
        link: item.source || null, // Using source field as link
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Note: The existing schema doesn't have an 'impact' field, so we're not including it
      };

      const { data, error } = await supabase
        .from('feed_items')
        .insert([feedItemData])
        .select()
        .single();

      if (error) {
        console.error('Error creating feed item:', error);
        // Check if it's an RLS policy violation
        if (error.code === '42501') {
          return {
            success: false,
            error: 'Access denied. This operation requires admin privileges. Check your authentication or database RLS policies.'
          };
        }
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as AdminFeedItem
      };
    } catch (error: any) {
      console.error('Unexpected error creating feed item:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred'
      };
    }
  },
  
  /**
   * Update an existing feed item
   * @param id - Feed item ID to update
   * @param item - Updated feed item data
   * @returns Promise resolving to CreateFeedItemResponse
   */
  async updateFeedItem(id: string, item: Partial<Omit<AdminFeedItem, 'id' | 'created_at' | 'updated_at'>>): Promise<CreateFeedItemResponse> {
    try {
      // Prepare the item data for updating
      const feedItemData: any = {};
      if (item.title) feedItemData.title = item.title;
      if (item.description) feedItemData.description = item.description;
      if (item.timestamp) feedItemData.timestamp = item.timestamp;
      if (item.category) feedItemData.category = item.category;
      if (item.asset_related_to) feedItemData.asset_related_to = item.asset_related_to;
      if (item.source !== undefined) feedItemData.link = item.source;
      feedItemData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('feed_items')
        .update(feedItemData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating feed item:', error);
        // Check if it's an RLS policy violation
        if (error.code === '42501') {
          return {
            success: false,
            error: 'Access denied. This operation requires admin privileges. Check your authentication or database RLS policies.'
          };
        }
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as AdminFeedItem
      };
    } catch (error: any) {
      console.error('Unexpected error updating feed item:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred'
      };
    }
  },
  
  /**
   * Delete a feed item
   * @param id - Feed item ID to delete
   * @returns Promise resolving to success/failure response
   */
  async deleteFeedItem(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('feed_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting feed item:', error);
        // Check if it's an RLS policy violation
        if (error.code === '42501') {
          return {
            success: false,
            error: 'Access denied. This operation requires admin privileges. Check your authentication or database RLS policies.'
          };
        }
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true
      };
    } catch (error: any) {
      console.error('Unexpected error deleting feed item:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred'
      };
    }
  }
};