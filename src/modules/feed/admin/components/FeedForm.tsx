import React from 'react';
import { AdminFormState } from '../types';

interface FeedFormProps {
  formData: AdminFormState;
  categories: string[];
  newCategory: string;
  editingItemId: string | null;
  submitLoading: boolean;
  draftLoading: boolean;
  successMessage: string | null;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleTimestampChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImpactChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  addCategory: () => void;
  removeCategory: (categoryToRemove: string) => void;
  setNewCategory: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  saveAsDraft: () => Promise<void>;
  resetForm: () => void;
}

const FeedForm: React.FC<FeedFormProps> = ({
  formData,
  categories,
  newCategory,
  editingItemId,
  submitLoading,
  draftLoading,
  successMessage,
  handleInputChange,
  handleTimestampChange,
  handleImpactChange,
  addCategory,
  removeCategory,
  setNewCategory,
  handleSubmit,
  saveAsDraft,
  resetForm
}) => {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formData.error && (
        <div className="mb-1 p-1 bg-destructive/20 text-destructive-foreground rounded-lg">
          {formData.error}
        </div>
      )}

      {successMessage && (
        <div className="mb-1 p-1 bg-green-500/20 text-green-500 rounded-lg">
          {successMessage}
        </div>
      )}

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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="asset_related_to_form" className="block text-sm font-medium mb-1">
            Asset Related To *
          </label>
          <input
            type="text"
            id="asset_related_to_form"
            name="asset_related_to"
            value={formData.asset_related_to}
            onChange={handleInputChange}
            className="w-full p-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="e.g., SOL, BTC, ETH"
          />
        </div>
        
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
        </div>
        
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
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        
        <div className="flex items-center py-2">
          <input
            type="checkbox"
            id="published"
            name="published"
            checked={formData.published}
            onChange={(e) => {
              const target = e.target as HTMLInputElement;
              handleInputChange({
                target: {
                  name: 'published',
                  value: target.checked ? 'true' : 'false'
                }
              } as unknown as React.ChangeEvent<HTMLInputElement>)}
            }
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
          disabled={submitLoading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background disabled:opacity-50"
        >
          {submitLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {editingItemId ? 'Updating...' : 'Publishing...'}
            </span>
          ) : (
            editingItemId ? 'Update Feed Item' : 'Publish Feed Item'
          )}
        </button>
        <button
          type="button"
          onClick={saveAsDraft}
          disabled={draftLoading}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background disabled:opacity-50"
        >
          {draftLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {editingItemId ? 'Updating Draft...' : 'Saving Draft...'}
            </span>
          ) : (
            editingItemId ? 'Update Draft' : 'Save as Draft'
          )}
        </button>
        {editingItemId && (
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
          >
            Cancel Edit
          </button>
        )}
        <button
          type="button"
          onClick={resetForm}
          className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
        >
          Reset Form
        </button>
      </div>
    </form>
  );
};

export default FeedForm;