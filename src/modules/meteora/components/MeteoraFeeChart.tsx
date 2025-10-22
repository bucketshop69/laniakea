import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import type { MeteoraFeeBpsPoint } from '../services/analytics'
import { Button } from '@/components/ui/button'

interface MeteoraFeeChartProps {
  data: MeteoraFeeBpsPoint[]
  isLoading?: boolean
  selectedPeriod: number
  onPeriodChange: (days: number) => void
}

interface ChartPoint {
  time: string
  avgFee: number
  minFee: number
  maxFee: number
  timestamp: number
}

const formatBps = (bps: number) => {
  return `${(bps / 100).toFixed(3)}%`
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const feeChartColors = {
  gradient: 'var(--chart-2)',
  grid: 'var(--border)',
  axis: 'var(--muted-foreground)',
  stroke: 'var(--chart-1)',
  tooltipBackground: 'var(--card)',
  tooltipBorder: 'var(--border)',
  tooltipMin: 'var(--destructive)',
  tooltipMax: 'var(--chart-2)',
  tooltipAvg: 'var(--chart-1)',
  tooltipHighlight: 'var(--chart-4)',
}

export const MeteoraFeeChart = ({ data, isLoading, selectedPeriod, onPeriodChange }: MeteoraFeeChartProps) => {
  const periodOptions = [
    { label: '1D', value: 1 },
    { label: '7D', value: 7 },
    { label: '30D', value: 30 },
  ]
  const chartData = useMemo<ChartPoint[]>(() => {
    return data
      .map((point) => ({
        time: new Date(point.hour_date).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        avgFee: point.average_fee_bps,
        minFee: point.min_fee_bps,
        maxFee: point.max_fee_bps,
        timestamp: new Date(point.hour_date).getTime(),
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
  }, [data])

  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return { current: 0, min: 0, max: 0, spike: 1 }
    }

    const current = chartData[chartData.length - 1]?.avgFee ?? 0
    const min = Math.min(...chartData.map(d => d.minFee))
    const max = Math.max(...chartData.map(d => d.maxFee))
    const spike = max / Math.max(min, 0.01) // Avoid division by zero

    return { current, min, max, spike }
  }, [chartData])

  // Determine volatility level
const getVolatilityLevel = (spike: number) => {
  if (spike > 3) return { label: 'High', color: 'text-destructive', bgColor: 'bg-destructive/20' }
  if (spike > 2) return { label: 'Moderate', color: 'text-secondary-foreground', bgColor: 'bg-secondary/40' }
  return { label: 'Low', color: 'text-muted-foreground', bgColor: 'bg-muted/40' }
  }

  const volatility = getVolatilityLevel(stats.spike)

  const hasData = chartData.length > 0

  return (
    <div className="space-y-2 relative">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-primary mb-2">Dynamic Fee Activity</h3>
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <div>
              <span className="text-primary font-medium">Current:</span> {formatBps(stats.current)}
            </div>
            <div>
              <span className="text-destructive font-medium">Min:</span> {formatBps(stats.min)}
            </div>
            <div>
              <span className="text-secondary-foreground font-medium">Max:</span> {formatBps(stats.max)}
            </div>
            {stats.spike > 2 && (
              <div>
                <span className="text-secondary-foreground">⚠️ {stats.spike.toFixed(1)}× spike detected</span>
              </div>
            )}
          </div>
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

      {/* Chart or empty state */}
      {!hasData && !isLoading ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
          No fee data available
        </div>
      ) : (
        <div className={`transition-opacity duration-200 ${isLoading ? 'opacity-40' : 'opacity-100'}`}>
          <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="feeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={feeChartColors.gradient} stopOpacity={0.3} />
              <stop offset="95%" stopColor={feeChartColors.gradient} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={feeChartColors.grid} opacity={0.3} />
          <XAxis
            dataKey="time"
            stroke={feeChartColors.axis}
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={feeChartColors.axis}
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatBps(value)}
            domain={['dataMin', 'dataMax']}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null

              const data = payload[0]?.payload as ChartPoint | undefined
              if (!data) return null

              return (
                <div className="rounded-md border border-border/60 bg-card/95 p-2 text-xs">
                  <div className="font-semibold text-primary mb-1">{data.time}</div>
                  <div className="space-y-0.5">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Avg Fee:</span>
                      <span className="text-primary font-medium">{formatBps(data.avgFee)}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Min:</span>
                      <span className="text-destructive">{formatBps(data.minFee)}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Max:</span>
                      <span className="text-secondary-foreground">{formatBps(data.maxFee)}</span>
                    </div>
                  </div>
                </div>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="avgFee"
            stroke={feeChartColors.stroke}
            strokeWidth={2}
            fill="url(#feeGradient)"
            dot={false}
            activeDot={{ r: 4, fill: feeChartColors.stroke, stroke: feeChartColors.tooltipHighlight, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default MeteoraFeeChart
