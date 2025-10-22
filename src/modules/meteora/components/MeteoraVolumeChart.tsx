import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import type { MeteoraVolumePoint } from '../services/analytics'
import { Button } from '@/components/ui/button'

interface MeteoraVolumeChartProps {
  data: MeteoraVolumePoint[]
  isLoading?: boolean
  selectedPeriod: number
  onPeriodChange: (days: number) => void
}

interface ChartPoint {
  date: string
  volume: number
  fees: number
}

const volumeChartColors = {
  grid: 'var(--border)',
  axis: 'var(--muted-foreground)',
  bar: 'var(--chart-2)',
  tooltipBackground: 'var(--card)',
  tooltipBorder: 'var(--border)',
  tooltipFees: 'var(--chart-2)',
}

const formatCurrency = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

export const MeteoraVolumeChart = ({ data, isLoading, selectedPeriod, onPeriodChange }: MeteoraVolumeChartProps) => {
  const periodOptions = [
    { label: '7D', value: 7 },
    { label: '14D', value: 14 },
    { label: '30D', value: 30 },
  ]
  const chartData = useMemo<ChartPoint[]>(() => {
    return data.map((v) => ({
      date: new Date(v.day_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      volume: v.trade_volume,
      fees: v.fee_volume,
    }))
  }, [data])

  const hasData = chartData.length > 0

  if (!hasData && !isLoading) {
    return null
  }

  return (
    <div className="rounded-lg border border-border/40 bg-card p-3 relative">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-primary">Volume Trend</h3>
          <p className="text-xs text-muted-foreground">Daily trading activity</p>
        </div>
        <div className="flex gap-1">
          {periodOptions.map((option) => (
            <Button
              key={option.value}
              variant={selectedPeriod === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPeriodChange(option.value)}
              className="h-6 px-2 text-[10px]"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg z-10">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      )}

      {/* Chart */}
      <div className={`transition-opacity duration-200 ${isLoading ? 'opacity-40' : 'opacity-100'}`}>
        <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={volumeChartColors.grid} opacity={0.3} />
          <XAxis
            dataKey="date"
            stroke={volumeChartColors.axis}
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={volumeChartColors.axis}
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null

              const data = payload[0]?.payload as ChartPoint | undefined
              if (!data) return null

              return (
                <div className="rounded-md border border-border/60 bg-card/95 p-2 text-xs">
                  <div className="font-semibold text-primary mb-1">{data.date}</div>
                  <div className="space-y-0.5">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Volume:</span>
                      <span className="text-primary font-medium">{formatCurrency(data.volume)}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Fees:</span>
                      <span className="text-secondary-foreground">{formatCurrency(data.fees)}</span>
                    </div>
                  </div>
                </div>
              )
            }}
          />
          <Bar dataKey="volume" fill={volumeChartColors.bar} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

        <div className="mt-2 text-[10px] text-muted-foreground text-center">
          💡 Consistent volume = Sustainable APY
        </div>
      </div>
    </div>
  )
}

export default MeteoraVolumeChart
