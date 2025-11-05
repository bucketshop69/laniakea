import React, { useState, useEffect } from 'react';
import { AdminFormState, AdminFeedItem } from './types';
import { FeedCard } from '../components/FeedCard';
import { feedAdminService } from '../services/feedAdminService';
import { feedService } from '../services/feedService';

const AdminPanel: React.FC = () => {
  const [formData, setFormData] = useState<AdminFormState>({
    title: '',
    description: '',
    asset_related_to: '',
    timestamp: new Date().toISOString().slice(0, 16), // Format as YYYY-MM-DDTHH:mm
    category: '',
    source: '',
    impact: 'neutral',
    published: false,
    error: null
  });

  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState<string>('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [feedItems, setFeedItems] = useState<AdminFeedItem[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null); // Track which item to delete
  
  // Function to handle deletion with confirmation
  const handleDelete = async (id: string) => {
    setShowDeleteConfirm(null); // Close confirmation
    
    try {
      const result = await feedAdminService.deleteFeedItem(id);
      
      if (result.success) {
        alert('Feed item deleted successfully!');
        
        // Refresh the feed items list
        const items = await feedService.getAllFeedItems();
        const adminItems: AdminFeedItem[] = items.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description || '',
          timestamp: item.timestamp,
          category: item.category || [],
          asset_related_to: item.asset_related_to || '',
          source: item.link || '',
          impact: 'neutral', // Default impact
          published: true,
        }));
        setFeedItems(adminItems);
        
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
          setCategories([]);
          setEditingItemId(null);
        }
      } else {
        setFormData(prev => ({
          ...prev,
          error: result.error || 'Failed to delete feed item'
        }));
      }
    } catch (error) {
      console.error('Error deleting feed item:', error);
      setFormData(prev => ({
        ...prev,
        error: 'An error occurred while deleting the feed item'
      }));
    }
  };
  
  // Function to cancel deletion
  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };
  
  // Function to save as draft (unpublished)
  const saveAsDraft = async () => {
    if (validateForm()) {
      // Prepare the feed item data from form data, but set published to false
      const feedItemData = {
        ...formData,
        published: false,
        category: categories, // Using the actual categories array
        asset_related_to: formData.asset_related_to,
        source: formData.source,
        impact: formData.impact,
      };
      
      let result;
      if (editingItemId) {
        // Update existing item as draft
        result = await feedAdminService.updateFeedItem(editingItemId, {
          ...feedItemData,
          published: false
        });
      } else {
        // Create new draft item
        result = await feedAdminService.createFeedItem({
          ...feedItemData,
          published: false
        });
      }
      
      if (result.success) {
        if (editingItemId) {
          alert('Draft updated successfully!');
        } else {
          alert('Draft saved successfully!');
        }
        
        // Refresh the feed items list
        const items = await feedService.getAllFeedItems();
        const adminItems: AdminFeedItem[] = items.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description || '',
          timestamp: item.timestamp,
          category: item.category || [],
          asset_related_to: item.asset_related_to || '',
          source: item.link || '',
          impact: 'neutral', // Default impact
          published: true,
        }));
        setFeedItems(adminItems);
        
        // Reset the form after successful submission
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
        setCategories([]);
        setEditingItemId(null); // Clear editing mode
      } else {
        setFormData(prev => ({
          ...prev,
          error: result.error || 'Failed to save draft'
        }));
      }
    }
  };
  
  // Load existing feed items when component mounts
  useEffect(() => {
    const loadFeedItems = async () => {
      try {
        // We need to get the feed items in the AdminFeedItem format
        // Using the existing feedService to get items and then adapt them
        const items = await feedService.getAllFeedItems();
        
        // Adapt the items to our AdminFeedItem interface
        const adminItems: AdminFeedItem[] = items.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description || '',
          timestamp: item.timestamp,
          category: item.category || [],
          asset_related_to: item.asset_related_to || '',
          source: item.link || '',
          // Note: The original feed item doesn't have impact, so we default to neutral
          impact: 'neutral',
          published: true, // Assuming all items from feed are published
        }));
        
        setFeedItems(adminItems);
      } catch (error) {
        console.error('Error loading feed items:', error);
        setFormData(prev => ({
          ...prev,
          error: 'Failed to load existing feed items'
        }));
      }
    };
    
    loadFeedItems();
  }, []);
  
  // Function to load an item for editing
  const loadItemForEdit = (item: AdminFeedItem) => {
    setFormData({
      title: item.title,
      description: item.description,
      asset_related_to: item.asset_related_to,
      timestamp: item.timestamp.slice(0, 16), // Format as YYYY-MM-DDTHH:mm
      category: item.category.join(','), // Convert array back to comma-separated string for form
      source: item.source || '',
      impact: item.impact || 'neutral',
      published: item.published || false,
      error: null
    });
    setCategories(item.category);
    setEditingItemId(item.id || null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'published' ? (value === 'true') : value
    }));
  };

  const handleTimestampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // The datetime-local input already provides the value in the correct format
    // The browser handles timezone conversion automatically
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleImpactChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      impact: e.target.value as 'bullish' | 'bearish' | 'neutral'
    }));
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setFormData(prev => ({
        ...prev,
        category: [...categories, newCategory.trim()].join(',') // Keep as comma-separated for the form state
      }));
      setNewCategory('');
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    const updatedCategories = categories.filter(cat => cat !== categoryToRemove);
    setCategories(updatedCategories);
    setFormData(prev => ({
      ...prev,
      category: updatedCategories.join(',') // Update form state
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setFormData(prev => ({ ...prev, error: 'Title is required' }));
      return false;
    }
    
    if (!formData.description.trim()) {
      setFormData(prev => ({ ...prev, error: 'Description is required' }));
      return false;
    }
    
    if (!formData.asset_related_to.trim()) {
      setFormData(prev => ({ ...prev, error: 'Asset is required' }));
      return false;
    }
    
    if (categories.length === 0) {
      setFormData(prev => ({ ...prev, error: 'At least one category is required' }));
      return false;
    }
    
    // Validate timestamp format (YYYY-MM-DDTHH:mm)
    const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    if (!timestampRegex.test(formData.timestamp)) {
      setFormData(prev => ({ ...prev, error: 'Invalid timestamp format' }));
      return false;
    }
    
    setFormData(prev => ({ ...prev, error: null }));
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Prepare the feed item data from form data
      const feedItemData = {
        title: formData.title,
        description: formData.description,
        timestamp: formData.timestamp,
        category: categories, // Using the actual categories array
        asset_related_to: formData.asset_related_to,
        source: formData.source,
        impact: formData.impact,
        published: formData.published
      };
      
      let result;
      if (editingItemId) {
        // Update existing item
        result = await feedAdminService.updateFeedItem(editingItemId, feedItemData);
      } else {
        // Create new item
        result = await feedAdminService.createFeedItem(feedItemData);
      }
      
      if (result.success) {
        if (editingItemId) {
          alert('Feed item updated successfully!');
        } else {
          alert('Feed item published successfully!');
        }
        
        // Refresh the feed items list
        const items = await feedService.getAllFeedItems();
        const adminItems: AdminFeedItem[] = items.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description || '',
          timestamp: item.timestamp,
          category: item.category || [],
          asset_related_to: item.asset_related_to || '',
          source: item.link || '',
          impact: 'neutral', // Default impact
          published: true,
        }));
        setFeedItems(adminItems);
        
        // Reset the form after successful submission
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
        setCategories([]);
        setEditingItemId(null); // Clear editing mode
      } else {
        setFormData(prev => ({
          ...prev,
          error: result.error || 'Failed to publish feed item'
        }));
      }
    }
  };

  // Preview data based on form values
  const previewData: AdminFeedItem = {
    title: formData.title,
    description: formData.description,
    timestamp: formData.timestamp,
    category: categories, // Use the actual categories array
    asset_related_to: formData.asset_related_to,
    source: formData.source,
    impact: formData.impact,
    published: formData.published
  };

  return (
    <div className="max-w-6xl mx-auto p-1 rounded-xl border border-border/40 bg-card/30">
      <h1 className="text-2xl mb-6">Feed Admin Panel</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Section - 8 columns */}
        <div className="lg:col-span-8">
          {formData.error && (
            <div className="mb-1 p-1 bg-destructive/20 text-destructive-foreground rounded-lg">
              {formData.error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full p-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Enter title"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full p-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Enter description"
              />
            </div>
            
            <div>
              <label htmlFor="asset_related_to" className="block text-sm font-medium mb-1">
                Asset Related To *
              </label>
              <input
                type="text"
                id="asset_related_to"
                name="asset_related_to"
                value={formData.asset_related_to}
                onChange={handleInputChange}
                className="w-full p-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="e.g., SOL, BTC, ETH"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Category *
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {categories.map((category, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md"
                  >
                    {category}
                    <button 
                      type="button" 
                      onClick={() => removeCategory(category)}
                      className="ml-1 text-secondary-foreground/70 hover:text-secondary-foreground"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                  className="flex-1 p-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="e.g., market, defi, ecosystem"
                />
                <button
                  type="button"
                  onClick={addCategory}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
                >
                  Add
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="timestamp" className="block text-sm font-medium mb-1">
                  Event Time (Local Time) *
                </label>
                <input
                  type="datetime-local"
                  id="timestamp"
                  name="timestamp"
                  value={formData.timestamp}
                  onChange={handleTimestampChange}
                  className="w-full p-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">Enter the time of the event in your local timezone. It will be stored in UTC.</p>
              </div>
              
              <div>
                <label htmlFor="source" className="block text-sm font-medium mb-1">
                  Source
                </label>
                <input
                  type="text"
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Original source URL or name"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="impact" className="block text-sm font-medium mb-1">
                  Impact
                </label>
                <select
                  id="impact"
                  name="impact"
                  value={formData.impact}
                  onChange={handleImpactChange}
                  className="w-full p-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="bullish">Bullish</option>
                  <option value="bearish">Bearish</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>
              
              <div className="flex items-center py-2">
                <input
                  type="checkbox"
                  id="published"
                  name="published"
                  checked={formData.published}
                  onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                  className="h-4 w-4 border-border rounded"
                />
                <label htmlFor="published" className="ml-2 block text-sm">
                  Publish immediately
                </label>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
              >
                {editingItemId ? 'Update Feed Item' : 'Publish Feed Item'}
              </button>
              <button
                type="button"
                onClick={saveAsDraft}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
              >
                {editingItemId ? 'Update Draft' : 'Save as Draft'}
              </button>
              {editingItemId && (
                <button
                  type="button"
                  onClick={() => {
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
                    setCategories([]);
                    setEditingItemId(null);
                  }}
                  className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="button"
                onClick={() => {
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
                  setCategories([]);
                  setEditingItemId(null);
                }}
                className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
              >
                Reset Form
              </button>
            </div>
          </form>
        </div>

        {/* Feed Items List - 4 columns */}
        <div className="lg:col-span-4">
          <div className="rounded-xl border border-border/40 bg-card/50 p-4 sticky top-6">
            <h2 className="text-xl font-semibold mb-4">Feed Items</h2>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {feedItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No feed items yet</p>
              ) : (
                feedItems.map((item, index) => (
                  <div key={item.id || index} className="border border-border rounded p-2 bg-background">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-medium truncate max-w-[160px]">{item.title}</h3>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => loadItemForEdit(item)}
                          className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(item.id || '')}
                          className="text-xs px-2 py-1 bg-destructive/20 text-destructive-foreground rounded hover:bg-destructive/30"
                          title="Delete"
                        >
                          Del
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{item.asset_related_to} • {new Date(item.timestamp).toLocaleDateString()}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(item.category || []).slice(0, 2).map((cat, catIndex) => (
                        <span 
                          key={catIndex} 
                          className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded"
                        >
                          {cat}
                        </span>
                      ))}
                      {item.category && item.category.length > 2 && (
                        <span className="text-xs text-muted-foreground">+{item.category.length - 2}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-card border border-border rounded-lg p-4 w-80">
                  <h3 className="font-medium mb-2">Confirm Deletion</h3>
                  <p className="text-sm text-muted-foreground mb-4">Are you sure you want to delete this feed item?</p>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={cancelDelete}
                      className="px-3 py-1.5 text-sm bg-muted text-muted-foreground rounded hover:bg-muted/80"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(showDeleteConfirm)}
                      className="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;