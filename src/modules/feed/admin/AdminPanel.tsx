import React, { useState } from 'react';
import { AdminFormState, AdminFeedItem } from './types';
import FeedForm from './components/FeedForm';
import FeedItemsList from './components/FeedItemsList';
import { useFeedForm } from './hooks/useFeedForm';
import { useFeedItems } from './hooks/useFeedItems';

const AdminPanel: React.FC = () => {
  const [formDataState, setFormData] = useState<AdminFormState>({
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

  // Using custom hooks to manage form and feed items logic
  const {
    formData,
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
  } = useFeedForm(setFormData);

  const {
    feedItems,
    loading,
    error,
    handleDelete,
    showDeleteConfirm,
    setShowDeleteConfirm,
    cancelDelete,
    refreshFeedItems
  } = useFeedItems(editingItemId, setFormData, setEditingItemId);

  // Set the error in formDataState when it comes from feed items
  if (error && !formDataState.error) {
    setFormData(prev => ({ ...prev, error }));
  }

  return (
    <div className="max-w-6xl mx-auto p-1 rounded-xl border border-border/40 bg-card/30">
      <h1 className="text-2xl mb-6">Feed Admin Panel</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Section - 8 columns */}
        <div className="lg:col-span-8">
          <FeedForm
            formData={formData}
            categories={categories}
            newCategory={newCategory}
            editingItemId={editingItemId}
            handleInputChange={handleInputChange}
            handleTimestampChange={handleTimestampChange}
            handleImpactChange={handleImpactChange}
            addCategory={addCategory}
            removeCategory={removeCategory}
            setNewCategory={setNewCategory}
            handleSubmit={handleSubmit}
            saveAsDraft={saveAsDraft}
            resetForm={resetForm}
          />
        </div>

        {/* Feed Items List - 4 columns */}
        <div className="lg:col-span-4">
          <FeedItemsList
            feedItems={feedItems}
            loading={loading}
            error={error}
            loadItemForEdit={loadItemForEdit}
            handleDelete={handleDelete}
            setShowDeleteConfirm={setShowDeleteConfirm}
            showDeleteConfirm={showDeleteConfirm}
            cancelDelete={cancelDelete}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;