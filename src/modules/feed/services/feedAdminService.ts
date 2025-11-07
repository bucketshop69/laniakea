import { supabase } from '@/lib/supabase';
import { AdminFeedItem } from '../admin/types';
import { tagService } from './tagService';

interface CreateFeedItemResponse {
  success: boolean;
  data?: AdminFeedItem;
  error?: string;
}

/**
 * Service for creating feed items in Supabase with normalized tags
 */
export const feedAdminService = {
  /**
   * Create a new feed item with normalized tags
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
        category: item.category || [], // Store the categories in the feed_items table as well
        asset_related_to: item.asset_related_to,
        link: item.source || null, // Using source field as link
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Map impact to a format that might be used by the existing feed system
        // Note: The existing schema doesn't have an 'impact' field, so we're not including it
      };

      // Create the feed item first
      const { data: feedItem, error: itemError } = await supabase
        .from('feed_items')
        .insert([feedItemData])
        .select()
        .single();

      if (itemError) {
        console.error('Error creating feed item:', itemError);
        // Check if it's an RLS policy violation
        if (itemError.code === '42501') {
          return {
            success: false,
            error: 'Access denied. This operation requires admin privileges. Check your authentication or database RLS policies.'
          };
        }
        return {
          success: false,
          error: itemError.message
        };
      }

      // Now create and link the tags
      if (item.category && item.category.length > 0) {
        const tagResult = await tagService.findOrCreateTags(item.category);
        if (!tagResult.success) {
          // If there was an error with tags, we might want to rollback the feed item creation
          // For now we'll log the error and proceed
          console.error('Error creating tags:', tagResult.error);
        } else if (tagResult.tags) {
          const tagIds = tagResult.tags.map(tag => tag.id);
          const linkResult = await tagService.linkTagsToFeedItem(feedItem.id, tagIds);
          if (!linkResult.success) {
            console.error('Error linking tags to feed item:', linkResult.error);
          }
        }
      }

      // Return the feed item with tags populated
      const resultItem: AdminFeedItem = {
        id: feedItem.id,
        title: feedItem.title,
        description: feedItem.description || '',
        timestamp: feedItem.timestamp,
        category: item.category || [], // We'll get actual tags in a separate query if needed
        asset_related_to: feedItem.asset_related_to || '',
        source: feedItem.link || '',
        impact: item.impact || 'neutral',
        published: item.published || false,
      };

      return {
        success: true,
        data: resultItem
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
   * Update an existing feed item with normalized tags
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
      if (item.category !== undefined) feedItemData.category = item.category || []; // Update category as well
      if (item.asset_related_to) feedItemData.asset_related_to = item.asset_related_to;
      if (item.source !== undefined) feedItemData.link = item.source;
      feedItemData.updated_at = new Date().toISOString();

      // Update the feed item
      const { data: feedItem, error: itemError } = await supabase
        .from('feed_items')
        .update(feedItemData)
        .eq('id', id)
        .select()
        .single();

      if (itemError) {
        console.error('Error updating feed item:', itemError);
        // Check if it's an RLS policy violation
        if (itemError.code === '42501') {
          return {
            success: false,
            error: 'Access denied. This operation requires admin privileges. Check your authentication or database RLS policies.'
          };
        }
        return {
          success: false,
          error: itemError.message
        };
      }

      // Handle tags if they were provided
      if (item.category !== undefined) {
        // Replace all existing tags with the new ones
        if (item.category && item.category.length > 0) {
          const tagResult = await tagService.findOrCreateTags(item.category);
          if (!tagResult.success) {
            console.error('Error creating tags:', tagResult.error);
          } else if (tagResult.tags) {
            const tagIds = tagResult.tags.map(tag => tag.id);
            const replaceResult = await tagService.replaceTagsForFeedItem(id, tagIds);
            if (!replaceResult.success) {
              console.error('Error replacing tags for feed item:', replaceResult.error);
            }
          }
        } else {
          // If category is an empty array, remove all existing tags
          const replaceResult = await tagService.replaceTagsForFeedItem(id, []);
          if (!replaceResult.success) {
            console.error('Error removing all tags for feed item:', replaceResult.error);
          }
        }
      }

      // Return the updated feed item
      const resultItem: AdminFeedItem = {
        id: feedItem.id,
        title: feedItem.title,
        description: feedItem.description || '',
        timestamp: feedItem.timestamp,
        category: Array.isArray(item.category) ? item.category : [],
        asset_related_to: feedItem.asset_related_to || '',
        source: feedItem.link || '',
        impact: item.impact || 'neutral',
        published: item.published || false,
      };

      return {
        success: true,
        data: resultItem
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
   * Delete a feed item (this will cascade delete the tags associations)
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