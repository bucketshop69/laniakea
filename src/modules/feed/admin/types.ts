// Form state for the admin panel (internal use)
export interface AdminFormState {
  title: string;
  description: string;
  timestamp: string;
  category: string; // Single string input that will be converted to array
  asset_related_to: string;
  source: string;
  impact: 'bullish' | 'bearish' | 'neutral';
  published: boolean;
  error: string | null;
}

// Compatible with the existing FeedItem type for the preview
export interface AdminFeedItem {
  id?: string;
  title: string;
  description: string;
  timestamp: string; // ISO string or timestamp with timezone
  category: string[]; // Array of categories as shown in the SQL
  asset_related_to: string; // As shown in the SQL
  source?: string;
  impact?: 'bullish' | 'bearish' | 'neutral';
  published?: boolean;
  created_at?: string;
  updated_at?: string;
  link?: string | null; // Added to match feedTypes.ts
}