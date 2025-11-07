/**
 * Migration script to convert existing feed_items.category arrays to normalized tags structure
 * This script should be run once to migrate existing data to the new schema
 */

import { supabase } from '@/lib/supabase';
import { tagService } from './tagService';

interface FeedItem {
  id: string;
  category: string[] | null;
}

export const migrateCategoriesToTags = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Starting migration of categories to tags...');

    // Fetch all feed items that have categories
    const { data: feedItems, error: fetchError } = await supabase
      .from('feed_items')
      .select('id, category');

    if (fetchError) {
      console.error('Error fetching feed items:', fetchError);
      return {
        success: false,
        error: fetchError.message
      };
    }

    if (!feedItems || feedItems.length === 0) {
      console.log('No feed items to migrate');
      return { success: true };
    }

    console.log(`Found ${feedItems.length} feed items to process`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const item of feedItems as FeedItem[]) {
      if (!item.category || !Array.isArray(item.category) || item.category.length === 0) {
        continue; // Skip items with no categories
      }

      try {
        // Find or create tags for this feed item
        const tagResult = await tagService.findOrCreateTags(item.category);
        if (!tagResult.success) {
          console.error(`Error finding/creating tags for item ${item.id}:`, tagResult.error);
          errorCount++;
          continue;
        }

        if (tagResult.tags && tagResult.tags.length > 0) {
          // Get the tag IDs
          const tagIds = tagResult.tags.map(tag => tag.id);

          // Link tags to feed item
          const linkResult = await tagService.linkTagsToFeedItem(item.id, tagIds);
          if (!linkResult.success) {
            console.error(`Error linking tags to item ${item.id}:`, linkResult.error);
            errorCount++;
            continue;
          }

          migratedCount++;
          console.log(`Successfully migrated item ${item.id} with ${tagIds.length} tags`);
        }
      } catch (itemError) {
        console.error(`Error processing item ${item.id}:`, itemError);
        errorCount++;
      }
    }

    console.log(`Migration completed: ${migratedCount} items migrated successfully, ${errorCount} errors encountered`);
    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error during migration:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during migration'
    };
  }
};

// Function to run the migration
export const runMigration = async () => {
  console.log('Starting categories to tags migration...');
  const result = await migrateCategoriesToTags();
  
  if (result.success) {
    console.log('Migration completed successfully!');
  } else {
    console.error('Migration failed:', result.error);
  }
  
  return result;
};