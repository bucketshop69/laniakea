/**
 * Feed Item from Supabase feed_items table
 */
export interface FeedItem {
  id: string
  title: string
  description: string | null
  link: string | null
  timestamp: string // ISO 8601 format
  category: string[] | null
  asset_related_to: string | null // e.g., "SOL", "BTC", "ETH"
  created_at: string
  updated_at: string
}

/**
 * Chart Annotation from Supabase chart_annotations table
 */
export interface ChartAnnotation {
  id: string
  user_id: string // Solana wallet address
  asset: string // e.g., "SOL", "BTC", "ETH"
  timestamp: string // ISO 8601 format
  note: string
  source: 'feed' | 'user'
  feed_item_id: string | null
  created_at: string
}

/**
 * Parameters for creating a new annotation
 */
export interface CreateAnnotationParams {
  walletAddress: string
  asset: string
  timestamp: string
  note: string
  feedItemId?: string
}

/**
 * Supported asset types
 */
export type Asset = 'SOL' | 'BTC' | 'ETH' | string

/**
 * Feed categories
 */
export type FeedCategory = 'macro' | 'market' | 'protocol' | 'defi' | 'derivatives' | 'ecosystem' | 'lending' | string
