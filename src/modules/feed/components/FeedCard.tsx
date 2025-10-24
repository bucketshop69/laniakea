import React, { useState } from 'react'
import { ExternalLink, Pin, Loader2, Smile } from 'lucide-react'
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
  const [isSmileHovered, setIsSmileHovered] = useState(false)
  const [isHappy, setIsHappy] = useState(false)

  const handlePinClick = () => {
    if (isSaved && onRemoveFromChart) {
      onRemoveFromChart(item)
    } else if (!isSaved && onSaveToChart) {
      onSaveToChart(item)
    }
  }

  const handleSmileClick = () => {
    setIsHappy(!isHappy)
  }

  return (
    <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-card/50 border border-border rounded-lg p-1 transition-all duration-200">
        <div className="grid grid-cols-12 gap-1">
          {/* Left side: Title and Description (9 cols on desktop, 8 cols on mobile) */}
          <div className="col-span-8 md:col-span-9 flex flex-col gap-2">
            {/* Title */}
            <h4 className="text-sm font-medium text-primary">{item.title}</h4>

            {/* Description */}
            {item.description && (
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            )}
          </div>

          {/* Right side: Time, Tags, Actions (3 cols on desktop, 4 cols on mobile) */}
          <div className="col-span-4 md:col-span-3 flex flex-col gap-2">
            {/* Time */}
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(item.timestamp)}
            </span>

            {/* Category Tags */}
            <div className="grid grid-cols-2 gap-1">
              {/* Category tags */}
              {item.category?.map((cat) => (
                <span
                  key={cat}
                  className={`px-2 py-0.5 rounded text-xs font-medium text-center ${getCategoryColor(cat)}`}
                >
                  {cat}
                </span>
              ))}

              {/* Asset tag */}
              {item.asset_related_to && (
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium text-center ${getAssetColor(
                    item.asset_related_to
                  )}`}
                >
                  {item.asset_related_to}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-12 gap-1">
              {/* Read More link */}
              {item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="col-span-4 p-1 rounded transition-all duration-200 bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-primary flex items-center justify-center"
                >
                  <ExternalLink size={14} />
                </a>
              ) : (
                <div className="col-span-4" />
              )}

              {/* Smile Icon */}
              <div className="col-span-4 relative">
                <button
                  onClick={handleSmileClick}
                  onMouseEnter={() => setIsSmileHovered(true)}
                  onMouseLeave={() => setIsSmileHovered(false)}
                  className={`
                    w-full p-1 rounded transition-all duration-200 flex items-center justify-center cursor-pointer
                    ${isHappy
                      ? 'bg-muted text-primary hover:bg-muted/80'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-primary'
                    }
                  `}
                >
                  <Smile size={14} />
                </button>

                {/* Tooltip on hover */}
                {isSmileHovered && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 rounded border border-border bg-card text-[10px] text-primary whitespace-nowrap z-10">
                    {isHappy ? 'Very Happy' : 'Happy'}
                    <div className="absolute left-1/2 top-full -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-l-transparent border-r-transparent border-t-[var(--card)]" />
                  </div>
                )}
              </div>

              {/* Pin Icon - only show if asset exists */}
              {item.asset_related_to && (onSaveToChart || onRemoveFromChart) && (
                <div className="col-span-4 relative">
                  <button
                    onClick={handlePinClick}
                    disabled={isSaving}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className={`
                      w-full p-1 rounded transition-all duration-200 flex items-center justify-center
                      ${isSaved
                        ? 'bg-muted text-primary hover:bg-muted/80'
                        : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-primary'
                      }
                      ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {isSaving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Pin
                        size={14}
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
