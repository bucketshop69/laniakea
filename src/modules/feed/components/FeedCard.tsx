import React from 'react'
import { ExternalLink, PinIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FeedItem } from '../types/feedTypes'

interface FeedCardProps {
  item: FeedItem
  onSaveToChart?: (item: FeedItem) => void
  showTimeline?: boolean // Not used currently but kept for future expansion
}

/**
 * Get category badge color
 */
const getCategoryColor = (category: string): string => {
  const lower = category.toLowerCase()
  if (lower.includes('macro') || lower.includes('market')) return 'bg-blue-500/20 text-blue-400'
  if (lower.includes('protocol')) return 'bg-purple-500/20 text-purple-400'
  if (lower.includes('defi')) return 'bg-green-500/20 text-green-400'
  if (lower.includes('derivatives')) return 'bg-orange-500/20 text-orange-400'
  if (lower.includes('lending')) return 'bg-yellow-500/20 text-yellow-400'
  if (lower.includes('ecosystem')) return 'bg-pink-500/20 text-pink-400'
  return 'bg-gray-500/20 text-gray-400'
}

/**
 * Get asset badge color
 */
const getAssetColor = (asset: string): string => {
  const upper = asset.toUpperCase()
  if (upper === 'SOL') return 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
  if (upper === 'BTC') return 'bg-orange-500/30 text-orange-300 border border-orange-500/50'
  if (upper === 'ETH') return 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
  return 'bg-gray-500/30 text-gray-300 border border-gray-500/50'
}

/**
 * Format timestamp to readable format
 */
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const FeedCard: React.FC<FeedCardProps> = ({ item, onSaveToChart }) => {
  return (
    <div className="relative">
      <div className="flex">
        {/* Card content */}
        <div className="flex-1 bg-card/50 border border-muted/30 rounded-lg p-3 hover:border-primary/30 transition-all duration-200">
          {/* Header: Title and Time */}
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-sm font-medium text-primary flex-1">{item.title}</h4>
            <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
              {formatTimestamp(item.timestamp)}
            </span>
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{item.description}</p>
          )}

          {/* Tags and Actions */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Tags */}
            <div className="flex items-center gap-1 flex-wrap">
              {/* Category tags */}
              {item.category?.map((cat) => (
                <span
                  key={cat}
                  className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(cat)}`}
                >
                  {cat}
                </span>
              ))}

              {/* Asset tag */}
              {item.asset_related_to && (
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${getAssetColor(
                    item.asset_related_to
                  )}`}
                >
                  {item.asset_related_to}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Read More link */}
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <ExternalLink size={12} />
                  Read
                </a>
              )}

              {/* Save to Chart button - only show if asset exists */}
              {item.asset_related_to && onSaveToChart && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSaveToChart(item)}
                  className="h-6 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                >
                  <PinIcon size={12} className="mr-1" />
                  Save to Chart
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
