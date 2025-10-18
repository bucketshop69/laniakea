import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
  Brush,
} from 'recharts'
import type { MeteoraBinLiquidityPoint } from '../services/bins'

interface MeteoraBinChartProps {
  binData: MeteoraBinLiquidityPoint[]
  activeBinId: number
  minBinId: number | null
  maxBinId: number | null
  onRangeChange: (minBinId: number, maxBinId: number) => void
  baseSymbol: string
  quoteSymbol: string
  maxBinSelection?: number // Optional max bin selection limit
}

type ChartDataPoint = {
  binId: number
  delta: number
  liquidity: number
  reserveX: number
  reserveY: number
  price: number
  pricePerToken: number
  isActive: boolean
}

const MeteoraBinChart = ({
  binData,
  activeBinId,
  minBinId,
  maxBinId,
  onRangeChange,
  baseSymbol,
  quoteSymbol,
  maxBinSelection,
}: MeteoraBinChartProps) => {
  const chartData = useMemo<ChartDataPoint[]>(() => {
    const data = binData
      .sort((a, b) => a.binId - b.binId)
      .map((bin) => {
        // Ensure all numeric values are valid numbers
        const ensureNumber = (val: any): number => {
          const num = Number(val)
          return Number.isFinite(num) ? num : 0
        }

        return {
          binId: bin.binId,
          delta: bin.binId - activeBinId,
          liquidity: ensureNumber(bin.liquidity),
          reserveX: ensureNumber(bin.reserveX),
          reserveY: ensureNumber(bin.reserveY),
          price: ensureNumber(bin.price),
          pricePerToken: ensureNumber(bin.pricePerToken),
          isActive: bin.binId === activeBinId,
        }
      })

    // Debug: log first few data points
    console.log('[Meteora Chart] Chart data (first 3):', data.slice(0, 3))
    console.log('[Meteora Chart] Any NaN values?', data.some(d =>
      !Number.isFinite(d.liquidity) ||
      !Number.isFinite(d.pricePerToken) ||
      !Number.isFinite(d.reserveX) ||
      !Number.isFinite(d.reserveY)
    ))

    return data
  }, [binData, activeBinId])

  const activeIndex = useMemo(() => {
    return chartData.findIndex((d) => d.binId === activeBinId)
  }, [chartData, activeBinId])

  const minIndex = useMemo(() => {
    if (minBinId === null || chartData.length === 0) return 0
    const idx = chartData.findIndex((d) => d.binId === minBinId)
    return idx >= 0 ? idx : 0
  }, [chartData, minBinId])

  const maxIndex = useMemo(() => {
    if (maxBinId === null || chartData.length === 0) return chartData.length - 1
    const idx = chartData.findIndex((d) => d.binId === maxBinId)
    return idx >= 0 ? idx : chartData.length - 1
  }, [chartData, maxBinId])

  const handleBrushChange = (range: { startIndex?: number; endIndex?: number }) => {
    if (range.startIndex === undefined || range.endIndex === undefined) return

    let startIdx = range.startIndex
    let endIdx = range.endIndex

    // Apply bin selection limit if provided
    if (maxBinSelection && maxBinSelection > 0) {
      const selectedBins = endIdx - startIdx + 1
      if (selectedBins > maxBinSelection) {
        // Keep the start, adjust the end to respect the limit
        endIdx = startIdx + maxBinSelection - 1
        console.log('[Meteora Chart] Bin selection clamped to max:', {
          requested: selectedBins,
          maxAllowed: maxBinSelection,
          adjustedRange: `${startIdx} to ${endIdx}`,
        })
      }
    }

    const startBinId = chartData[startIdx]?.binId
    const endBinId = chartData[endIdx]?.binId

    if (startBinId !== undefined && endBinId !== undefined) {
      onRangeChange(startBinId, endBinId)
    }
  }

  const formatNumber = (value: number | undefined, decimals: number = 4): string => {
    if (value === undefined || value === null || !Number.isFinite(value) || Number.isNaN(value)) {
      return '0'
    }
    return value.toFixed(decimals)
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (!active || !payload || payload.length === 0) return null

    const data = payload[0]?.payload as ChartDataPoint | undefined
    if (!data) return null

    return (
      <div className="rounded border border-border/60 bg-slate-900/95 p-2 text-[9px] text-muted-foreground">
        <div className="font-semibold text-primary">
          {data.isActive ? 'Active Bin' : `Δ ${data.delta > 0 ? '+' : ''}${data.delta}`}
        </div>
        <div>Bin ID: {data.binId}</div>
        <div>
          Price: {formatNumber(data.pricePerToken, 8)} {quoteSymbol}
        </div>
        <div>
          {baseSymbol}: {formatNumber(data.reserveX, 4)}
        </div>
        <div>
          {quoteSymbol}: {formatNumber(data.reserveY, 4)}
        </div>
        <div className="mt-1 border-t border-border/40 pt-1">
          Total: {formatNumber(data.liquidity, 4)}
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
          <XAxis
            dataKey="pricePerToken"
            stroke="#64748B"
            fontSize={9}
            tickFormatter={(value) => Number(value).toFixed(4)}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1E293B', opacity: 0.3 }} />
          <Bar dataKey="liquidity" radius={[2, 2, 0, 0]}>
            {chartData.map((entry, index) => {
              const isInRange = index >= minIndex && index <= maxIndex
              let fillColor = '#22D3EE'
              if (entry.isActive) fillColor = '#F97316'
              else if (isInRange) fillColor = '#3B82F6'

              return (
                <Cell
                  key={`cell-${entry.binId}`}
                  fill={fillColor}
                  opacity={entry.isActive ? 0.9 : isInRange ? 0.7 : 0.3}
                />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="100%" height="15%">
        <BarChart
          data={chartData}
          margin={{ top: 0, right: 5, left: 5, bottom: 5 }}
        >
          <Brush
            dataKey="pricePerToken"
            height={20}
            stroke="#3B82F6"
            fill="#1E293B"
            startIndex={minIndex}
            endIndex={maxIndex}
            onChange={handleBrushChange}
            tickFormatter={(value) => Number(value).toFixed(4)}
            alwaysShowText
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default MeteoraBinChart
