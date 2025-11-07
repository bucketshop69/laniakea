// src/pages/api/feed/tags.ts
// This would be used in a Next.js app, but for this project we'll add the functionality to our service

import { supabase } from '@/lib/supabase';

/**
 * Get tag suggestions for AI training
 * This function can be used to analyze existing tags for pattern recognition
 */
export const getTagSuggestions = async (searchTerm?: string) => {
  try {
    let query = supabase
      .from('tags')
      .select(`
        name,
        feed_items_tags!inner (
          feed_item_id
        )
      `)
      .order('name', { ascending: true });

    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tag suggestions:', error);
      return { success: false, error: error.message };
    }

    // Transform to return just the tag names
    const tagNames = data?.map(item => item.name) || [];
    
    return { success: true, data: tagNames };
  } catch (error: any) {
    console.error('Unexpected error getting tag suggestions:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
};

/**
 * Get tag usage statistics
 * This can help understand how often specific tags are used
 */
export const getTagUsageStats = async (limit: number = 10) => {
  try {
    const { data, error } = await supabase
      .from('feed_items_tags')
      .select(`
        tags!inner (
          name
        )
      `)
      .order('tags.name');

    if (error) {
      console.error('Error fetching tag usage stats:', error);
      return { success: false, error: error.message };
    }

    // Count occurrences of each tag
    const tagCounts: Record<string, number> = {};
    data?.forEach(item => {
      const tagName = (item as any).tags?.name;
      if (tagName) {
        tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
      }
    });

    // Convert to array and sort by count
    const tagUsageArray = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return { success: true, data: tagUsageArray };
  } catch (error: any) {
    console.error('Unexpected error getting tag usage stats:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
};

/**
 * Get related tags for a specific tag
 * This can help identify commonly co-occurring tags
 */
export const getRelatedTags = async (tagName: string, limit: number = 5) => {
  try {
    // First get the tag ID
    const { data: tagData, error: tagError } = await supabase
      .from('tags')
      .select('id')
      .eq('name', tagName)
      .single();

    if (tagError) {
      console.error('Error finding tag:', tagError);
      return { success: false, error: tagError.message };
    }

    if (!tagData) {
      return { success: true, data: [] };
    }

    // Find all feed items that have this tag
    const { data: feedItemIds, error: feedItemError } = await supabase
      .from('feed_items_tags')
      .select('feed_item_id')
      .eq('tag_id', tagData.id);

    if (feedItemError) {
      console.error('Error finding feed items with tag:', feedItemError);
      return { success: false, error: feedItemError.message };
    }

    const feedItemIdsList = feedItemIds?.map(item => item.feed_item_id) || [];

    if (feedItemIdsList.length === 0) {
      return { success: true, data: [] };
    }

    // Find all tags associated with these feed items (excluding the original tag)
    const { data: relatedTagData, error: relatedTagError } = await supabase
      .from('feed_items_tags')
      .select(`
        tags!inner (
          name
        )
      `)
      .in('feed_item_id', feedItemIdsList)
      .neq('tags.name', tagName);

    if (relatedTagError) {
      console.error('Error finding related tags:', relatedTagError);
      return { success: false, error: relatedTagError.message };
    }

    // Count occurrences of each related tag
    const relatedTagCounts: Record<string, number> = {};
    relatedTagData?.forEach(item => {
      const relatedTagName = (item as any).tags?.name;
      if (relatedTagName) {
        relatedTagCounts[relatedTagName] = (relatedTagCounts[relatedTagName] || 0) + 1;
      }
    });

    // Convert to array and sort by count
    const relatedTagsArray = Object.entries(relatedTagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return { success: true, data: relatedTagsArray };
  } catch (error: any) {
    console.error('Unexpected error getting related tags:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
};