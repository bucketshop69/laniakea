import { useState } from 'react';
import { AdminFormState, AdminFeedItem } from '../types';
import { feedAdminService } from '../../services/feedAdminService';
import { feedService } from '../../services/feedService';

interface UseFeedFormReturn {
  formData: AdminFormState;
  setFormData: React.Dispatch<React.SetStateAction<AdminFormState>>;
  categories: string[];
  newCategory: string;
  editingItemId: string | null;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleTimestampChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImpactChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  addCategory: () => void;
  removeCategory: (categoryToRemove: string) => void;
  setNewCategory: React.Dispatch<React.SetStateAction<string>>;
  validateForm: () => boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  saveAsDraft: () => Promise<void>;
  loadItemForEdit: (item: AdminFeedItem) => void;
  setEditingItemId: React.Dispatch<React.SetStateAction<string | null>>;
  resetForm: () => void;
}

export const useFeedForm = (
  setFormDataGlobal: React.Dispatch<React.SetStateAction<AdminFormState>>
): UseFeedFormReturn => {
  const [formData, setFormDataLocal] = useState<AdminFormState>({
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormDataLocal(prev => ({
      ...prev,
      [name]: name === 'published' ? (value === 'true') : value
    }));
  };

  const handleTimestampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // The datetime-local input already provides the value in the correct format
    // The browser handles timezone conversion automatically
    setFormDataLocal(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleImpactChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormDataLocal(prev => ({
      ...prev,
      impact: e.target.value as 'bullish' | 'bearish' | 'neutral'
    }));
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setFormDataLocal((prev: AdminFormState) => ({
        ...prev,
        category: [...categories, newCategory.trim()].join(',') // Keep as comma-separated for the form state
      }));
      setNewCategory('');
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    const updatedCategories = categories.filter(cat => cat !== categoryToRemove);
    setCategories(updatedCategories);
    setFormDataLocal((prev: AdminFormState) => ({
      ...prev,
      category: updatedCategories.join(',') // Update form state
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setFormDataLocal((prev: AdminFormState) => ({ ...prev, error: 'Title is required' }));
      return false;
    }
    
    if (!formData.description.trim()) {
      setFormDataLocal((prev: AdminFormState) => ({ ...prev, error: 'Description is required' }));
      return false;
    }
    
    if (!formData.asset_related_to.trim()) {
      setFormDataLocal((prev: AdminFormState) => ({ ...prev, error: 'Asset is required' }));
      return false;
    }
    
    if (categories.length === 0) {
      setFormDataLocal((prev: AdminFormState) => ({ ...prev, error: 'At least one category is required' }));
      return false;
    }
    
    // Validate timestamp format (YYYY-MM-DDTHH:mm)
    const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    if (!timestampRegex.test(formData.timestamp)) {
      setFormDataLocal((prev: AdminFormState) => ({ ...prev, error: 'Invalid timestamp format' }));
      return false;
    }
    
    setFormDataLocal((prev: AdminFormState) => ({ ...prev, error: null }));
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
        
        // Reset the form after successful submission
        setFormDataLocal({
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
        setFormDataGlobal({
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
      } else {
        setFormDataLocal((prev: AdminFormState) => ({
          ...prev,
          error: result.error || 'Failed to publish feed item'
        }));
      }
    }
  };

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
        
        // Reset the form after successful submission
        setFormDataLocal({
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
        setFormDataGlobal({
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
      } else {
        setFormDataLocal((prev: AdminFormState) => ({
          ...prev,
          error: result.error || 'Failed to save draft'
        }));
      }
    }
  };

  const loadItemForEdit = (item: AdminFeedItem) => {
    setFormDataLocal({
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

  const resetForm = () => {
    setFormDataLocal({
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
    setFormDataGlobal({
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
  };

  return {
    formData: formData,
    setFormData: setFormDataLocal,
    categories,
    newCategory,
    editingItemId,
    handleInputChange,
    handleTimestampChange,
    handleImpactChange,
    addCategory,
    removeCategory,
    setNewCategory,
    validateForm,
    handleSubmit,
    saveAsDraft,
    loadItemForEdit,
    setEditingItemId,
    resetForm
  };
};