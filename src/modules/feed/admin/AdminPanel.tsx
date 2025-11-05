import React, { useState } from 'react';
import { AdminFormState, AdminFeedItem } from './types';
import { FeedCard } from '../components/FeedCard';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // For now, just show a success message
      alert('Form validated successfully! (In Milestone 2, this will connect to the database)');
      console.log('Form data:', formData);
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
                  Event Time (UTC) *
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
            
            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
              >
                Save Feed Item
              </button>
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
                }}
                className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
              >
                Reset Form
              </button>
            </div>
          </form>
        </div>

        {/* Preview Section - 4 columns */}
        <div className="lg:col-span-4">
          <div className="rounded-xl border border-border/40 bg-card/50 p-4 sticky top-6">
            <h2 className="text-xl font-semibold mb-4">Preview</h2>
            
            <div className="space-y-3">
              <FeedCard 
                item={{
                  id: 'preview-id',
                  title: previewData.title,
                  description: previewData.description || null,
                  link: previewData.source || null,
                  timestamp: previewData.timestamp,
                  category: previewData.category || [],
                  asset_related_to: previewData.asset_related_to || null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }} 
              />
            </div>
            
            <div className="mt-4 text-xs text-muted-foreground">
              <p>This is how the feed item will appear in the main application.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;