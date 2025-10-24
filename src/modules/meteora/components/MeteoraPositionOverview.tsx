import { useMemo, useState } from 'react'
import type { MeteoraPool } from '../types/domain'
import MeteoraFeeChart from './MeteoraFeeChart'
import MeteoraVolumeChart from './MeteoraVolumeChart'
import { useMeteoraPoolAnalytics } from '../hooks/useMeteoraPoolAnalytics'
import { Button } from '@/components/ui/button'

interface MeteoraPositionOverviewProps {
  pool: MeteoraPool
}

export interface MeteoraPositionHeaderData {
  title: string
  subtitle: string
  apy: number
  tvl: number
  volume24h: number
  fees24h: number
}

const formatCurrency = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

const formatPercent = (value: number) => {
  return `${value.toFixed(2)}%`
}

// Helper to get header data for Stats.tsx
export const getMeteoraPositionHeaderData = (pool: MeteoraPool): MeteoraPositionHeaderData => {
  const baseSymbol = pool.name.split('-')[0] || 'BASE'
  const quoteSymbol = pool.name.split('-')[1] || 'QUOTE'

  return {
    title: pool.name,
    subtitle: `${baseSymbol}/${quoteSymbol}`,
    apy: pool.apy,
    tvl: parseFloat(pool.liquidity),
    volume24h: pool.trade_volume_24h,
    fees24h: pool.fees_24h,
  }
}

export const MeteoraPositionOverview = ({ pool }: MeteoraPositionOverviewProps) => {
  const [feePeriod, setFeePeriod] = useState(1)
  const [volumePeriod, setVolumePeriod] = useState(7)
  const [activeChart, setActiveChart] = useState<'fees' | 'volume'>('fees')

  const { feeBps, volume, isLoading, error } = useMeteoraPoolAnalytics({
    poolAddress: pool.address,
    enabled: true,
    feeDays: feePeriod,
    volumeDays: volumePeriod,
  })

  // Calculate verdict based on pool metrics
  const verdict = useMemo(() => {
    const avgFee = feeBps.length > 0
      ? feeBps.reduce((sum, p) => sum + p.average_fee_bps, 0) / feeBps.length
      : pool.base_fee_percentage ? parseFloat(pool.base_fee_percentage) * 100 : 4

    const maxFee = feeBps.length > 0
      ? Math.max(...feeBps.map(p => p.max_fee_bps))
      : pool.max_fee_percentage ? parseFloat(pool.max_fee_percentage) * 100 : 10

    const volatility = maxFee / Math.max(avgFee, 0.01)

    // Risk score (1-10)
    const riskScore = Math.min(10, Math.max(1, Math.round(volatility)))

    // Activity score based on volume
    const volumeScore = pool.trade_volume_24h > 10_000_000 ? 10
      : pool.trade_volume_24h > 5_000_000 ? 8
        : pool.trade_volume_24h > 1_000_000 ? 6
          : 4

    // Determine signal
    let signal: 'enter' | 'wait' | 'risky' | 'avoid' = 'enter'
    let signalColor = 'text-secondary-foreground'
    let signalBg = 'bg-secondary/30'

    if (riskScore > 7) {
      signal = 'risky'
      signalColor = 'text-secondary-foreground'
      signalBg = 'bg-secondary/20'
    } else if (riskScore > 5 && pool.apy < 20) {
      signal = 'wait'
      signalColor = 'text-muted-foreground'
      signalBg = 'bg-muted/30'
    } else if (pool.trade_volume_24h < 100_000) {
      signal = 'avoid'
      signalColor = 'text-destructive'
      signalBg = 'bg-destructive/10'
    }

    return {
      signal,
      signalColor,
      signalBg,
      riskScore,
      activityScore: volumeScore,
      avgFee,
      maxFee,
    }
  }, [pool, feeBps])



  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-24 rounded-lg bg-muted/20 animate-pulse" />
        <div className="h-32 rounded-lg bg-muted/20 animate-pulse" />
        <div className="h-64 rounded-lg bg-muted/20 animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load pool analytics. {error}
        </div>
      </div>
    )
  }

  const feeChart = (
    <div className="rounded-lg border border-border/40 bg-card p-3">
      <MeteoraFeeChart
        data={feeBps}
        isLoading={false}
        selectedPeriod={feePeriod}
        onPeriodChange={setFeePeriod}
      />
    </div>
  )

  const volumeChart = (
    <MeteoraVolumeChart
      data={volume}
      isLoading={false}
      selectedPeriod={volumePeriod}
      onPeriodChange={setVolumePeriod}
    />
  )

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <h2 className="text-xl text-primary mb-1">{pool.name}</h2>
        </div>

        {/* Primary stats (hidden on small screens) */}
        <div className="hidden md:block text-right">
          <div className="grid grid-cols-3 gap-4 text-xs mt-1">
            <div className="text-right">
              <div className="text-muted-foreground mb-1">TVL</div>
              <div className="text-sm font-semibold text-primary">
                {formatCurrency(parseFloat(pool.liquidity))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground mb-1">24h Volume</div>
              <div className="text-sm font-semibold text-primary">
                {formatCurrency(pool.trade_volume_24h)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground mb-1">24h Fees</div>
              <div className="text-sm font-semibold text-primary">
                {formatCurrency(pool.fees_24h)}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between md:hidden">
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              className="h-6 px-2 text-[10px]"
              variant={activeChart === 'fees' ? 'default' : 'outline'}
              onClick={() => setActiveChart('fees')}
            >
              Fees
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-6 px-2 text-[10px]"
              variant={activeChart === 'volume' ? 'default' : 'outline'}
              onClick={() => setActiveChart('volume')}
            >
              Volume
            </Button>
          </div>
        </div>
      </div>


      <div className="md:hidden space-y-2">
        {activeChart === 'fees' ? feeChart : volumeChart}
      </div>

      <div className="hidden md:flex md:flex-col md:gap-2">
        {feeChart}
        {volumeChart}
      </div>
    </div>
  )
}

export default MeteoraPositionOverview
