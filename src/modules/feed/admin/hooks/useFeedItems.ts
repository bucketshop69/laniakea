import { useState, useEffect } from 'react';
import { AdminFeedItem } from '../types';
import { feedAdminService } from '../../services/feedAdminService';
import { feedService } from '../../services/feedService';

interface UseFeedItemsReturn {
  feedItems: AdminFeedItem[];
  loading: boolean;
  error: string | null;
  handleDelete: (id: string) => Promise<void>;
  showDeleteConfirm: string | null;
  setShowDeleteConfirm: React.Dispatch<React.SetStateAction<string | null>>;
  cancelDelete: () => void;
  refreshFeedItems: () => Promise<void>;
}

export const useFeedItems = (
  editingItemId: string | null,
  setFormData: React.Dispatch<any>,
  setEditingItemId: React.Dispatch<React.SetStateAction<string | null>>
): UseFeedItemsReturn => {
  const [feedItems, setFeedItems] = useState<AdminFeedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const refreshFeedItems = async () => {
    try {
      setLoading(true);
      const items = await feedService.getAllFeedItems();
      // Convert feedItems to admin format including the categories
      const adminItems: AdminFeedItem[] = items.map((item: any) => {
        // Handle the case where category might be a comma-separated string from the DB
        const categoryAsArray = (item.category as unknown) as string[] | string;
        
        let categoryArray: string[];
        if (Array.isArray(categoryAsArray)) {
          categoryArray = categoryAsArray;
        } else if (typeof categoryAsArray === 'string') {
          categoryArray = categoryAsArray.split(',').filter((c: string) => c.trim());
        } else {
          categoryArray = [];
        }
        
        return {
          id: item.id,
          title: item.title,
          description: item.description || '',
          timestamp: item.timestamp,
          category: categoryArray,
          asset_related_to: item.asset_related_to || '',
          source: item.link || '',
          impact: 'neutral', // Default impact
          published: true,
        };
      });
      setFeedItems(adminItems);
    } catch (err) {
      console.error('Error loading feed items:', err);
      setError('Failed to load existing feed items');
      setFormData((prev: any) => ({
        ...prev,
        error: 'Failed to load existing feed items'
      }));
    } finally {
      setLoading(false);
    }
  };

  // Load existing feed items when component mounts
  useEffect(() => {
    const loadFeedItems = async () => {
      try {
        setLoading(true);
        // We need to get the feed items in the AdminFeedItem format
        // Using the existing feedService to get items and then adapt them
        const items = await feedService.getAllFeedItems();
        
        // Adapt the items to our AdminFeedItem interface
        const adminItems: AdminFeedItem[] = items.map((item: any) => {
          // Handle the case where category might be a comma-separated string from the DB
          const categoryAsArray = (item.category as unknown) as string[] | string;
          
          let categoryArray: string[];
          if (Array.isArray(categoryAsArray)) {
            categoryArray = categoryAsArray;
          } else if (typeof categoryAsArray === 'string') {
            categoryArray = categoryAsArray.split(',').filter((c: string) => c.trim());
          } else {
            categoryArray = [];
          }
          
          return {
            id: item.id,
            title: item.title,
            description: item.description || '',
            timestamp: item.timestamp,
            category: categoryArray,
            asset_related_to: item.asset_related_to || '',
            source: item.link || '',
            // Note: The original feed item doesn't have impact, so we default to neutral
            impact: 'neutral',
            published: true, // Assuming all items from feed are published
          };
        });
        
        setFeedItems(adminItems);
      } catch (err) {
        console.error('Error loading feed items:', err);
        setError('Failed to load existing feed items');
        setFormData((prev: any) => ({
          ...prev,
          error: 'Failed to load existing feed items'
        }));
      } finally {
        setLoading(false);
      }
    };
    
    loadFeedItems();
  }, [setFormData]);

  // Function to handle deletion with confirmation
  const handleDelete = async (id: string) => {
    setShowDeleteConfirm(null); // Close confirmation
    
    try {
      const result = await feedAdminService.deleteFeedItem(id);
      
      if (result.success) {
        alert('Feed item deleted successfully!');
        await refreshFeedItems();
        
        // If we were editing the deleted item, reset the form
        if (editingItemId === id) {
          setFormData({
            title: '',
            description: '',
            asset_related_to: '',
            timestamp: new Date().toISOString().slice(0, 16),
            category: '',
            source: '',
            impact: 'neutral',
            published: false,
            error: null
          });
          setEditingItemId(null);
        }
      } else {
        setFormData((prev: any) => ({
          ...prev,
          error: result.error || 'Failed to delete feed item'
        }));
      }
    } catch (err) {
      console.error('Error deleting feed item:', err);
      setFormData((prev: any) => ({
        ...prev,
        error: 'An error occurred while deleting the feed item'
      }));
    }
  };
  
  // Function to cancel deletion
  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  return {
    feedItems,
    loading,
    error,
    handleDelete,
    showDeleteConfirm,
    setShowDeleteConfirm,
    cancelDelete,
    refreshFeedItems
  };
};