import React, { useState } from 'react'
import { ExternalLink, Pin, Loader2 } from 'lucide-react'
import type { FeedItem } from '../types/feedTypes'

interface FeedCardProps {
  item: FeedItem
  onSaveToChart?: (item: FeedItem) => void
  onRemoveFromChart?: (item: FeedItem) => void
  isSaving?: boolean
  isSaved?: boolean // Pass from parent instead of reading from store
}

/**
 * Get category badge color
 */
const getCategoryColor = (category: string): string => {
  const base = 'border border-border/40 bg-secondary/40 text-secondary-foreground'
  return base
}

/**
 * Get asset badge color
 */
const getAssetColor = (asset: string): string => {
  return 'border border-border/40 bg-card/50 text-secondary-foreground'
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

export const FeedCard: React.FC<FeedCardProps> = ({ item, onSaveToChart, onRemoveFromChart, isSaving = false, isSaved = false }) => {
  const [isHovered, setIsHovered] = useState(false)

  const handlePinClick = () => {
    if (isSaved && onRemoveFromChart) {
      onRemoveFromChart(item)
    } else if (!isSaved && onSaveToChart) {
      onSaveToChart(item)
    }
  }

  return (
    <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                  className="text-xs text-secondary-foreground hover:text-primary flex items-center gap-1"
                >
                  <ExternalLink size={12} />
                  Read
                </a>
              )}

              {/* Pin Icon - only show if asset exists */}
              {item.asset_related_to && (onSaveToChart || onRemoveFromChart) && (
                <div className="relative">
                  <button
                    onClick={handlePinClick}
                    disabled={isSaving}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className={`
                      relative p-1 rounded transition-all duration-200
                      ${isSaved 
                        ? 'bg-muted text-primary hover:bg-muted/80' 
                        : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-primary'
                      }
                      ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {isSaving ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Pin 
                        size={12} 
                        className={isSaved ? 'fill-current' : ''} 
                      />
                    )}
                  </button>

                  {/* Tooltip on hover */}
                  {isHovered && !isSaving && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 rounded border border-border bg-card text-[10px] text-primary whitespace-nowrap z-10">
                      {isSaved ? 'Remove from Chart' : 'Save to Chart'}
                      <div className="absolute left-1/2 top-full -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-l-transparent border-r-transparent border-t-[var(--card)]" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
