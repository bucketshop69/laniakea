import { supabase } from '@/lib/supabase';
import { AdminFeedItem } from '../admin/types';

interface Tag {
  id: string;
  name: string;
  created_at: string;
}

interface FeedItemTag {
  id: string;
  feed_item_id: string;
  tag_id: string;
  created_at: string;
}

interface CreateTagResponse {
  success: boolean;
  data?: Tag;
  error?: string;
}

interface GetTagResponse {
  success: boolean;
  data?: Tag;
  error?: string;
}

interface GetTagsResponse {
  success: boolean;
  data?: Tag[];
  error?: string;
}

/**
 * Service for managing tags in the normalized structure
 */
export const tagService = {
  /**
   * Create a new tag or get existing if it already exists
   * @param tagName - Name of the tag to create
   * @returns Promise resolving to CreateTagResponse
   */
  async createTag(tagName: string): Promise<CreateTagResponse> {
    try {
      // First check if tag already exists
      const { data: existingTag, error: fetchError } = await supabase
        .from('tags')
        .select('*')
        .eq('name', tagName)
        .single();

      if (existingTag) {
        return {
          success: true,
          data: existingTag as Tag
        };
      }

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error checking existing tag:', fetchError);
        return {
          success: false,
          error: fetchError.message
        };
      }

      // Create new tag if it doesn't exist
      const { data, error } = await supabase
        .from('tags')
        .insert([{ name: tagName }])
        .select()
        .single();

      if (error) {
        console.error('Error creating tag:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as Tag
      };
    } catch (error: any) {
      console.error('Unexpected error creating tag:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred'
      };
    }
  },

  /**
   * Get all tags
   * @returns Promise resolving to GetTagsResponse
   */
  async getAllTags(): Promise<GetTagsResponse> {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching tags:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as Tag[]
      };
    } catch (error: any) {
      console.error('Unexpected error fetching tags:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred'
      };
    }
  },

  /**
   * Find or create multiple tags
   * @param tagNames - Array of tag names to find or create
   * @returns Promise resolving to array of Tag objects
   */
  async findOrCreateTags(tagNames: string[]): Promise<{ success: boolean; tags?: Tag[]; error?: string }> {
    try {
      const tags: Tag[] = [];

      for (const tagName of tagNames) {
        const result = await this.createTag(tagName);
        if (!result.success) {
          return {
            success: false,
            error: result.error
          };
        }
        if (result.data) {
          tags.push(result.data);
        }
      }

      return {
        success: true,
        tags
      };
    } catch (error: any) {
      console.error('Error finding or creating tags:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred'
      };
    }
  },

  /**
   * Get tags for a specific feed item
   * @param feedItemId - ID of the feed item
   * @returns Promise resolving to array of tag names
   */
  async getTagsForFeedItem(feedItemId: string): Promise<{ success: boolean; tags?: string[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('feed_items_tags')
        .select(`
          tags (name)
        `)
        .eq('feed_item_id', feedItemId);

      if (error) {
        console.error('Error fetching tags for feed item:', error);
        return {
          success: false,
          error: error.message
        };
      }

      const tagNames = data?.map(item => (item as any).tags?.name).filter(Boolean) || [];
      
      return {
        success: true,
        tags: tagNames
      };
    } catch (error: any) {
      console.error('Unexpected error fetching tags for feed item:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred'
      };
    }
  },

  /**
   * Link tags to a feed item
   * @param feedItemId - ID of the feed item
   * @param tagIds - Array of tag IDs to link
   * @returns Promise resolving to success/failure
   */
  async linkTagsToFeedItem(feedItemId: string, tagIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      if (!tagIds.length) {
        return { success: true }; // Nothing to link
      }

      // Prepare the data for insertion
      const feedItemTags = tagIds.map(tagId => ({
        feed_item_id: feedItemId,
        tag_id: tagId
      }));

      const { error } = await supabase
        .from('feed_items_tags')
        .insert(feedItemTags)
        .select();

      if (error) {
        console.error('Error linking tags to feed item:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true
      };
    } catch (error: any) {
      console.error('Unexpected error linking tags to feed item:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred'
      };
    }
  },

  /**
   * Replace all tags for a feed item
   * @param feedItemId - ID of the feed item
   * @param tagIds - Array of new tag IDs to link
   * @returns Promise resolving to success/failure
   */
  async replaceTagsForFeedItem(feedItemId: string, tagIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      // First, remove all existing links for this feed item
      const { error: deleteError } = await supabase
        .from('feed_items_tags')
        .delete()
        .eq('feed_item_id', feedItemId);

      if (deleteError) {
        console.error('Error deleting existing tag links:', deleteError);
        return {
          success: false,
          error: deleteError.message
        };
      }

      // Then add the new tags
      if (tagIds.length > 0) {
        return await this.linkTagsToFeedItem(feedItemId, tagIds);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Unexpected error replacing tags for feed item:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred'
      };
    }
  },

  /**
   * Get tags matching a search term (for autocomplete)
   * @param searchTerm - Partial tag name to search for
   * @returns Promise resolving to array of matching tag names
   */
  async searchTags(searchTerm: string): Promise<{ success: boolean; tags?: string[]; error?: string }> {
    try {
      if (!searchTerm) {
        return { success: true, tags: [] };
      }

      const { data, error } = await supabase
        .from('tags')
        .select('name')
        .ilike('name', `%${searchTerm}%`)
        .limit(10) // Limit results for performance
        .order('name', { ascending: true });

      if (error) {
        console.error('Error searching tags:', error);
        return {
          success: false,
          error: error.message
        };
      }

      const tagNames = data?.map(tag => tag.name) || [];
      
      return {
        success: true,
        tags: tagNames
      };
    } catch (error: any) {
      console.error('Unexpected error searching tags:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred'
      };
    }
  }
};