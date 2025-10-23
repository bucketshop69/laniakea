import { useMemo } from 'react'
import type { MeteoraPairGroup } from '../types/domain'
import { useMeteoraProtocolMetrics } from '../hooks/useMeteoraProtocolMetrics'

interface HeatmapCard {
  name: string
  value: number
  feeTvlRatio: number
  farmApy: number
  poolCount: number
  size: number // Relative size 1-4 for grid layout
  originalGroup: MeteoraPairGroup
}

interface MeteoraPairGroupsHeatmapProps {
  pairGroups: MeteoraPairGroup[]
  metric?: 'tvl' | 'volume'
  onCardClick?: (pairGroup: MeteoraPairGroup) => void
  variant?: 'default' | 'compact'
}

const formatNumber = (value: number): string => {
  if (!Number.isFinite(value)) return '—'
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

const formatPercent = (value: number): string => {
  if (!Number.isFinite(value) || value === 0) return '—'
  return `${value.toFixed(2)}%`
}

const CARD_BASE_CLASS = 'rounded-lg cursor-pointer transition-all duration-200 hover:opacity-90 hover:scale-[1.02] border border-border/40 bg-card/40 hover:border-border'

const STACKED_CARD_HEIGHTS = ['min-h-[28px]', 'min-h-[22px]', 'min-h-[18px]']

export const MeteoraPairGroupsHeatmap = ({
  pairGroups,
  metric = 'volume',
  onCardClick,
  variant = 'default',
}: MeteoraPairGroupsHeatmapProps) => {
  // Fetch protocol metrics
  const {
    data: protocolMetrics,
    isLoading: protocolLoading,
    error: protocolError,
  } = useMeteoraProtocolMetrics({ enabled: true })
  const cards = useMemo<HeatmapCard[]>(() => {
    if (pairGroups.length === 0) return []

    // Get metric value
    const getValue = (group: MeteoraPairGroup) =>
      metric === 'tvl' ? group.total_tvl : group.total_volume

    // Sort by metric descending
    const sorted = [...pairGroups].sort((a, b) => getValue(b) - getValue(a))

    // Take top 12 for custom layout
    const topGroups = sorted.slice(0, 12)

    return topGroups.map((group) => {
      const value = getValue(group)

      return {
        name: group.group_name,
        value,
        feeTvlRatio: group.max_fee_tvl_ratio,
        farmApy: group.max_farm_apy,
        poolCount: group.pool_count,
        size: 1, // Not used in custom layout
        originalGroup: group,
      }
    })
  }, [pairGroups, metric])

  const isCompact = variant === 'compact'

  if (protocolLoading) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed border-border/40 text-sm text-muted-foreground">
        Loading Meteora data…
      </div>
    )
  }

  if (protocolError) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-lg border border-red-500/40 bg-red-500/10 px-4 text-sm text-red-300">
        Failed to load protocol metrics. {protocolError}
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed border-border/40 text-sm text-muted-foreground">
        No pair groups available
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl text-primary mb-1">Meteora Market Overview</h2>
          <p className="text-sm text-muted-foreground">Top Pair Groups by 24h Volume</p>
        </div>

        {/* Primary stats */}
        <div className="text-right">
          <p className="text-2xl text-primary">
            {formatNumber(protocolMetrics?.total_tvl ?? 0)}
          </p>
          <p className="text-sm text-secondary-foreground">
            {formatNumber(protocolMetrics?.daily_trade_volume ?? 0)} (24h Volume)
          </p>
        </div>
      </div>

      {/* Heatmap - 3 Row Layout */}
      <div className="space-y-1">
        {/* Row 1: 60% + 40% */}
        <div className="grid grid-cols-10 gap-1">
          {cards[0] && (
            <div
              key={cards[0].name}
              className={`col-span-6 p-1 min-h-[50px] ${CARD_BASE_CLASS}`}
              onClick={() => onCardClick?.(cards[0].originalGroup)}
            >
              <div className="flex flex-col h-full">
                <div className="mb-3">
                  <div className="text-sm font-semibold text-primary mb-2">{cards[0].name}</div>
                  <div className="text-2xl text-primary mb-1">{formatNumber(cards[0].value)}</div>
                  <div className="text-xs text-muted-foreground">24h Volume</div>
                </div>
                <div className="flex-1" />
                <div className="space-y-1 pt-1 border-t border-border/20">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Pools</span>
                    <span className="text-xs text-primary font-medium">{cards[0].poolCount}</span>
                  </div>
                  {cards[0].farmApy > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Max APY</span>
                      <span className="text-xs text-secondary-foreground font-medium">{formatPercent(cards[0].farmApy)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {cards[1] && (
            <div
              key={cards[1].name}
              className={`col-span-4 p-1 min-h-[50px] ${CARD_BASE_CLASS}`}
              onClick={() => onCardClick?.(cards[1].originalGroup)}
            >
              <div className="flex flex-col h-full">
                <div className="mb-3">
                  <div className="text-sm font-semibold text-primary mb-2">{cards[1].name}</div>
                  <div className="text-2xl text-primary mb-1">{formatNumber(cards[1].value)}</div>
                  <div className="text-xs text-muted-foreground">24h Volume</div>
                </div>
                <div className="flex-1" />
                <div className="space-y-1 pt-3 border-t border-border/20">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Pools</span>
                    <span className="text-xs text-primary font-medium">{cards[1].poolCount}</span>
                  </div>
                  {cards[1].farmApy > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Max APY</span>
                      <span className="text-xs text-secondary-foreground font-medium">{formatPercent(cards[1].farmApy)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Row 2: 40% + 30% + 30% */}
        <div className="grid grid-cols-10 gap-1">
          {cards[2] && (
            <div
              key={cards[2].name}
              className={`col-span-4 p-1 min-h-[45px] ${CARD_BASE_CLASS}`}
              onClick={() => onCardClick?.(cards[2].originalGroup)}
            >
              <div className="flex flex-col h-full">
                <div className="mb-3">
                  <div className="text-sm font-semibold text-primary mb-2">{cards[2].name}</div>
                  <div className="text-2xl text-primary mb-1">{formatNumber(cards[2].value)}</div>
                  <div className="text-xs text-muted-foreground">24h Volume</div>
                </div>
                <div className="flex-1" />
                <div className="space-y-1 pt-3 border-t border-border/20">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Pools</span>
                    <span className="text-xs text-primary font-medium">{cards[2].poolCount}</span>
                  </div>
                  {cards[2].farmApy > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Max APY</span>
                      <span className="text-xs text-secondary-foreground font-medium">{formatPercent(cards[2].farmApy)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {cards[3] && (
            <div
              key={cards[3].name}
              className={`col-span-3 p-1 min-h-[45px] ${CARD_BASE_CLASS}`}
              onClick={() => onCardClick?.(cards[3].originalGroup)}
            >
              <div className="flex flex-col h-full">
                <div className="mb-3">
                  <div className="text-sm font-semibold text-primary mb-2">{cards[3].name}</div>
                  <div className="text-2xl font-bold text-primary mb-1">{formatNumber(cards[3].value)}</div>
                  <div className="text-xs text-muted-foreground">24h Volume</div>
                </div>
                <div className="flex-1" />
                <div className="space-y-1 pt-3 border-t border-border/20">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Pools</span>
                    <span className="text-xs text-primary font-medium">{cards[3].poolCount}</span>
                  </div>
                  {cards[3].farmApy > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Max APY</span>
                      <span className="text-xs text-secondary-foreground font-medium">{formatPercent(cards[3].farmApy)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {cards[4] && (
            <div
              key={cards[4].name}
              className={`col-span-3 p-1 min-h-[45px] ${CARD_BASE_CLASS}`}
              onClick={() => onCardClick?.(cards[4].originalGroup)}
            >
              <div className="flex flex-col h-full">
                <div className="mb-3">
                  <div className="text-sm font-semibold text-primary mb-2">{cards[4].name}</div>
                  <div className="text-2xl font-bold text-primary mb-1">{formatNumber(cards[4].value)}</div>
                  <div className="text-xs text-muted-foreground">24h Volume</div>
                </div>
                <div className="flex-1" />
                <div className="space-y-1 pt-3 border-t border-border/20">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Pools</span>
                    <span className="text-xs text-primary font-medium">{cards[4].poolCount}</span>
                  </div>
                  {cards[4].farmApy > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Max APY</span>
                      <span className="text-xs text-secondary-foreground font-medium">{formatPercent(cards[4].farmApy)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Row 3: Large + Stacked Column + Stacked Column */}
        <div className="grid grid-cols-10 gap-1">
          {/* Large card #6 */}
          {cards[5] && (
            <div
              key={cards[5].name}
              className={`col-span-4 p-1 min-h-[70px] ${CARD_BASE_CLASS}`}
              onClick={() => onCardClick?.(cards[5].originalGroup)}
            >
              <div className="flex flex-col h-full">
                <div className="mb-3">
                  <div className="text-sm font-semibold text-primary mb-2">{cards[5].name}</div>
                  <div className="text-2xl font-bold text-primary mb-1">{formatNumber(cards[5].value)}</div>
                  <div className="text-xs text-muted-foreground">24h Volume</div>
                </div>
                <div className="flex-1" />
                <div className="space-y-1 pt-3 border-t border-border/20">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Pools</span>
                    <span className="text-xs text-primary font-medium">{cards[5].poolCount}</span>
                  </div>
                  {cards[5].farmApy > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Max APY</span>
                      <span className="text-xs text-secondary-foreground font-medium">{formatPercent(cards[5].farmApy)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Column 2: Cards 7, 8, 9 stacked */}
          <div className="col-span-3 space-y-1">
            {[cards[6], cards[7], cards[8]].map((card, idx) => card && (
              <div
                key={card.name}
                className={`p-3 ${CARD_BASE_CLASS} ${STACKED_CARD_HEIGHTS[idx] ?? STACKED_CARD_HEIGHTS[STACKED_CARD_HEIGHTS.length - 1]}`}
                onClick={() => onCardClick?.(card.originalGroup)}
              >
                <div className="text-xs font-semibold text-primary mb-1">{card.name}</div>
                <div className="text-lg font-bold text-primary mb-1">{formatNumber(card.value)}</div>
                <div className="text-[10px] text-muted-foreground flex justify-between">
                  <span>{card.poolCount} pools</span>
                  {card.farmApy > 0 && <span className="text-secondary-foreground">{formatPercent(card.farmApy)}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Column 3: Cards 10, 11, 12 stacked */}
          <div className="col-span-3 space-y-1">
            {[cards[9], cards[10], cards[11]].map((card, idx) => card && (
              <div
                key={card.name}
                className={`p-3 ${CARD_BASE_CLASS} ${STACKED_CARD_HEIGHTS[idx] ?? STACKED_CARD_HEIGHTS[STACKED_CARD_HEIGHTS.length - 1]}`}
                onClick={() => onCardClick?.(card.originalGroup)}
              >
                <div className="text-xs font-semibold text-primary mb-1">{card.name}</div>
                <div className="text-lg font-bold text-primary mb-1">{formatNumber(card.value)}</div>
                <div className="text-[10px] text-muted-foreground flex justify-between">
                  <span>{card.poolCount} pools</span>
                  {card.farmApy > 0 && <span className="text-secondary-foreground">{formatPercent(card.farmApy)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MeteoraPairGroupsHeatmap
