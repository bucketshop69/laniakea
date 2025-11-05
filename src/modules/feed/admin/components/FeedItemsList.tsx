import React from 'react';
import { AdminFeedItem } from '../types';

interface FeedItemsListProps {
  feedItems: AdminFeedItem[];
  loading: boolean;
  error: string | null;
  loadItemForEdit: (item: AdminFeedItem) => void;
  handleDelete: (id: string) => void;
  setShowDeleteConfirm: React.Dispatch<React.SetStateAction<string | null>>;
  showDeleteConfirm: string | null;
  cancelDelete: () => void;
}

const FeedItemsList: React.FC<FeedItemsListProps> = ({
  feedItems,
  loading,
  error,
  loadItemForEdit,
  handleDelete,
  setShowDeleteConfirm,
  showDeleteConfirm,
  cancelDelete
}) => {
  return (
    <div className="rounded-xl border border-border/40 bg-card/50 p-4 sticky top-6">
      <h2 className="text-xl font-semibold mb-4">Feed Items</h2>
      
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
        ) : error ? (
          <p className="text-sm text-destructive text-center py-4">{error}</p>
        ) : feedItems.length === 0 ? (
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
  );
};

export default FeedItemsList;