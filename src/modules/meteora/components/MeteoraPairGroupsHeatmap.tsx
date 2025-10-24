import { useEffect, useMemo, useState } from 'react'
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
  variant,
}: MeteoraPairGroupsHeatmapProps) => {
  const [autoCompact, setAutoCompact] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const query = window.matchMedia('(max-width: 768px)')
    const updateMatches = () => setAutoCompact(query.matches)
    const listener = (event: MediaQueryListEvent) => setAutoCompact(event.matches)

    updateMatches()

    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', listener)
      return () => {
        query.removeEventListener('change', listener)
      }
    }

    if (typeof query.addListener === 'function') {
      const legacyListener = function (this: MediaQueryList, ev: MediaQueryListEvent) {
        setAutoCompact(ev.matches)
      }
      query.addListener(legacyListener)
      return () => {
        query.removeListener(legacyListener)
      }
    }

    // Fallback cleanup
    return undefined
  }, [])

  const effectiveVariant = variant ?? (autoCompact ? 'compact' : 'default')
  const isCompact = effectiveVariant === 'compact'

  console.log('[MeteoraPairGroupsHeatmap] variant', {
    passed: variant,
    autoCompact,
    effectiveVariant,
  })

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

  const baseSpacingClass = isCompact ? 'space-y-3' : 'space-y-6'
  const headerTitleClass = isCompact ? 'text-base font-semibold text-primary leading-tight' : 'text-xl text-primary mb-1'
  const headerSubtitleClass = isCompact ? 'text-[11px] text-muted-foreground leading-tight' : 'text-sm text-muted-foreground'
  const headerValueClass = isCompact ? 'text-lg text-primary leading-tight' : 'text-2xl text-primary'
  const headerVolumeClass = isCompact ? 'text-[11px] text-secondary-foreground leading-tight' : 'text-sm text-secondary-foreground'
  const heatmapSpacingClass = isCompact ? 'space-y-0.5' : 'space-y-1'
  const gridGapClass = isCompact ? 'gap-0.5' : 'gap-1'
  const topCardNameClass = isCompact ? 'text-[11px] font-semibold text-primary truncate' : 'text-sm font-semibold text-primary'
  const topCardValueClass = isCompact ? 'text-base font-semibold text-primary' : 'text-2xl font-bold text-primary'
  const topCardLabelClass = isCompact ? 'text-[10px] text-muted-foreground' : 'text-xs text-muted-foreground'
  const topCardMetaValueClass = isCompact ? 'text-[10px] text-primary font-medium' : 'text-xs text-primary font-medium'
  const topCardMetaApyClass = isCompact ? 'text-[10px] text-secondary-foreground font-medium' : 'text-xs text-secondary-foreground font-medium'
  const sectionPaddingClass = isCompact ? 'p-1' : 'p-1'
  const sectionMinHeightLarge = isCompact ? 'min-h-[60px]' : 'min-h-[70px]'
  const sectionMinHeightMedium = isCompact ? 'min-h-[46px]' : 'min-h-[50px]'
  const sectionMinHeightSmall = isCompact ? 'min-h-[42px]' : 'min-h-[45px]'
  const stackedHeights = isCompact ? ['min-h-[26px]', 'min-h-[24px]', 'min-h-[22px]'] : STACKED_CARD_HEIGHTS
  const stackedNameClass = isCompact ? 'text-[10px] font-semibold text-primary leading-tight truncate' : 'text-xs font-semibold text-primary'
  const stackedValueClass = isCompact ? 'text-sm font-bold text-primary leading-tight' : 'text-lg font-bold text-primary'
  const stackedMetaLabelClass = isCompact ? 'text-[9px] text-muted-foreground' : 'text-[10px] text-muted-foreground'
  const stackedMetaValueClass = isCompact ? 'text-[9px] text-secondary-foreground font-medium' : 'text-[10px] text-secondary-foreground'
  const stackedColumnSpacing = isCompact ? 'space-y-0.5' : 'space-y-1'
  const stackedPaddingClass = isCompact ? 'p-2' : 'p-3'
  const dividerPadding = isCompact ? 'pt-1.5' : 'pt-3'
  const topCardHeaderClass = isCompact ? 'flex items-start justify-between gap-1' : 'flex flex-col gap-1'
  const stackedHeaderClass = isCompact ? 'flex items-start justify-between gap-1' : 'flex flex-col gap-0.5'

  return (
    <div className={baseSpacingClass}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className={headerTitleClass}>Meteora Market Overview</h2>
          <p className={headerSubtitleClass}>Top Pair Groups by 24h Volume</p>
        </div>
      </div>

      {/* Heatmap - 3 Row Layout */}
      <div className={heatmapSpacingClass}>
        {/* Row 1: 60% + 40% */}
        <div className={`grid grid-cols-10 ${gridGapClass}`}>
          {cards[0] && (
            <div
              key={cards[0].name}
              className={`col-span-6 ${sectionPaddingClass} ${sectionMinHeightMedium} ${CARD_BASE_CLASS}`}
              onClick={() => onCardClick?.(cards[0].originalGroup)}
            >
              <div className="flex flex-col h-full">
                <div className={isCompact ? 'mb-1.5' : 'mb-3'}>
                  <div className={topCardHeaderClass}>
                    <span className={topCardNameClass}>{cards[0].name}</span>
                    <span className={topCardValueClass}>{formatNumber(cards[0].value)}</span>
                  </div>
                  <div className={topCardLabelClass}>24h Volume</div>
                </div>
                <div className="flex-1" />
                <div className={`space-y-1 pt-1 border-t border-border/20`}>
                  <div className="flex justify-between items-center">
                    <span className={topCardLabelClass}>Pools</span>
                    <span className={topCardMetaValueClass}>{cards[0].poolCount}</span>
                  </div>
                  {cards[0].farmApy > 0 && (
                    <div className="flex justify-between items-center">
                      <span className={topCardLabelClass}>Max APY</span>
                      <span className={topCardMetaApyClass}>{formatPercent(cards[0].farmApy)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {cards[1] && (
            <div
              key={cards[1].name}
              className={`col-span-4 ${sectionPaddingClass} ${sectionMinHeightMedium} ${CARD_BASE_CLASS}`}
              onClick={() => onCardClick?.(cards[1].originalGroup)}
            >
              <div className="flex flex-col h-full">
                <div className={isCompact ? 'mb-1.5' : 'mb-3'}>
                  <div className={topCardHeaderClass}>
                    <span className={topCardNameClass}>{cards[1].name}</span>
                    <span className={topCardValueClass}>{formatNumber(cards[1].value)}</span>
                  </div>
                  <div className={topCardLabelClass}>24h Volume</div>
                </div>
                <div className="flex-1" />
                <div className={`space-y-1 ${dividerPadding} border-t border-border/20`}>
                  <div className="flex justify-between items-center">
                    <span className={topCardLabelClass}>Pools</span>
                    <span className={topCardMetaValueClass}>{cards[1].poolCount}</span>
                  </div>
                  {cards[1].farmApy > 0 && (
                    <div className="flex justify-between items-center">
                      <span className={topCardLabelClass}>Max APY</span>
                      <span className={topCardMetaApyClass}>{formatPercent(cards[1].farmApy)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Row 2: 40% + 30% + 30% */}
        <div className={`grid grid-cols-10 ${gridGapClass}`}>
          {cards[2] && (
            <div
              key={cards[2].name}
              className={`col-span-4 ${sectionPaddingClass} ${sectionMinHeightSmall} ${CARD_BASE_CLASS}`}
              onClick={() => onCardClick?.(cards[2].originalGroup)}
            >
              <div className="flex flex-col h-full">
                <div className={isCompact ? 'mb-1.5' : 'mb-3'}>
                  <div className={topCardHeaderClass}>
                    <span className={topCardNameClass}>{cards[2].name}</span>
                    <span className={topCardValueClass}>{formatNumber(cards[2].value)}</span>
                  </div>
                  <div className={topCardLabelClass}>24h Volume</div>
                </div>
                <div className="flex-1" />
                <div className={`space-y-1 ${dividerPadding} border-t border-border/20`}>
                  <div className="flex justify-between items-center">
                    <span className={topCardLabelClass}>Pools</span>
                    <span className={topCardMetaValueClass}>{cards[2].poolCount}</span>
                  </div>
                  {cards[2].farmApy > 0 && (
                    <div className="flex justify-between items-center">
                      <span className={topCardLabelClass}>Max APY</span>
                      <span className={topCardMetaApyClass}>{formatPercent(cards[2].farmApy)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {cards[3] && (
            <div
              key={cards[3].name}
              className={`col-span-3 ${sectionPaddingClass} ${sectionMinHeightSmall} ${CARD_BASE_CLASS}`}
              onClick={() => onCardClick?.(cards[3].originalGroup)}
            >
              <div className="flex flex-col h-full">
                <div className={isCompact ? 'mb-1.5' : 'mb-3'}>
                  <div className={topCardHeaderClass}>
                    <span className={topCardNameClass}>{cards[3].name}</span>
                    <span className={topCardValueClass}>{formatNumber(cards[3].value)}</span>
                  </div>
                  <div className={topCardLabelClass}>24h Volume</div>
                </div>
                <div className="flex-1" />
                <div className={`space-y-1 ${dividerPadding} border-t border-border/20`}>
                  <div className="flex justify-between items-center">
                    <span className={topCardLabelClass}>Pools</span>
                    <span className={topCardMetaValueClass}>{cards[3].poolCount}</span>
                  </div>
                  {cards[3].farmApy > 0 && (
                    <div className="flex justify-between items-center">
                      <span className={topCardLabelClass}>Max APY</span>
                      <span className={topCardMetaApyClass}>{formatPercent(cards[3].farmApy)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {cards[4] && (
            <div
              key={cards[4].name}
              className={`col-span-3 ${sectionPaddingClass} ${sectionMinHeightSmall} ${CARD_BASE_CLASS}`}
              onClick={() => onCardClick?.(cards[4].originalGroup)}
            >
              <div className="flex flex-col h-full">
                <div className={isCompact ? 'mb-1.5' : 'mb-3'}>
                  <div className={topCardHeaderClass}>
                    <span className={topCardNameClass}>{cards[4].name}</span>
                    <span className={topCardValueClass}>{formatNumber(cards[4].value)}</span>
                  </div>
                  <div className={topCardLabelClass}>24h Volume</div>
                </div>
                <div className="flex-1" />
                <div className={`space-y-1 ${dividerPadding} border-t border-border/20`}>
                  <div className="flex justify-between items-center">
                    <span className={topCardLabelClass}>Pools</span>
                    <span className={topCardMetaValueClass}>{cards[4].poolCount}</span>
                  </div>
                  {cards[4].farmApy > 0 && (
                    <div className="flex justify-between items-center">
                      <span className={topCardLabelClass}>Max APY</span>
                      <span className={topCardMetaApyClass}>{formatPercent(cards[4].farmApy)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Row 3: Large + Stacked Column + Stacked Column */}
        <div className={`grid grid-cols-10 ${gridGapClass}`}>
          {/* Large card #6 */}
          {cards[5] && (
            <div
              key={cards[5].name}
              className={`col-span-4 ${sectionPaddingClass} ${sectionMinHeightLarge} ${CARD_BASE_CLASS}`}
              onClick={() => onCardClick?.(cards[5].originalGroup)}
            >
              <div className="flex flex-col h-full">
                <div className={isCompact ? 'mb-1.5' : 'mb-3'}>
                  <div className={topCardHeaderClass}>
                    <span className={topCardNameClass}>{cards[5].name}</span>
                    <span className={topCardValueClass}>{formatNumber(cards[5].value)}</span>
                  </div>
                  <div className={topCardLabelClass}>24h Volume</div>
                </div>
                <div className="flex-1" />
                <div className={`space-y-1 ${dividerPadding} border-t border-border/20`}>
                  <div className="flex justify-between items-center">
                    <span className={topCardLabelClass}>Pools</span>
                    <span className={topCardMetaValueClass}>{cards[5].poolCount}</span>
                  </div>
                  {cards[5].farmApy > 0 && (
                    <div className="flex justify-between items-center">
                      <span className={topCardLabelClass}>Max APY</span>
                      <span className={topCardMetaApyClass}>{formatPercent(cards[5].farmApy)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Column 2: Cards 7, 8, 9 stacked */}
          <div className={`col-span-3 ${stackedColumnSpacing}`}>
            {[cards[6], cards[7], cards[8]].map((card, idx) => card && (
              <div
                key={card.name}
                className={`${stackedPaddingClass} ${CARD_BASE_CLASS} ${stackedHeights[idx] ?? stackedHeights[stackedHeights.length - 1]}`}
                onClick={() => onCardClick?.(card.originalGroup)}
              >
                <div className={stackedHeaderClass}>
                  <span className={stackedNameClass}>{card.name}</span>
                  <span className={stackedValueClass}>{formatNumber(card.value)}</span>
                </div>
                <div className={`${stackedMetaLabelClass} flex justify-between`}>
                  <span>{card.poolCount} pools</span>
                  {card.farmApy > 0 && <span className={stackedMetaValueClass}>{formatPercent(card.farmApy)}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Column 3: Cards 10, 11, 12 stacked */}
          <div className={`col-span-3 ${stackedColumnSpacing}`}>
            {[cards[9], cards[10], cards[11]].map((card, idx) => card && (
              <div
                key={card.name}
                className={`${stackedPaddingClass} ${CARD_BASE_CLASS} ${stackedHeights[idx] ?? stackedHeights[stackedHeights.length - 1]}`}
                onClick={() => onCardClick?.(card.originalGroup)}
              >
                <div className={stackedHeaderClass}>
                  <span className={stackedNameClass}>{card.name}</span>
                  <span className={stackedValueClass}>{formatNumber(card.value)}</span>
                </div>
                <div className={`${stackedMetaLabelClass} flex justify-between`}>
                  <span>{card.poolCount} pools</span>
                  {card.farmApy > 0 && <span className={stackedMetaValueClass}>{formatPercent(card.farmApy)}</span>}
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
