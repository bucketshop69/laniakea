import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
  Cell,
  Brush,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import type { SarosBinLiquidityPoint } from '../services/poolService'

interface BinChartProps {
  binData: SarosBinLiquidityPoint[]
  activeBinId: number
  minBinId: number | null
  maxBinId: number | null
  onRangeChange: (minBinId: number, maxBinId: number) => void
  baseSymbol: string
  quoteSymbol: string
}

type ChartDataPoint = {
  binId: number
  delta: number
  liquidity: number
  reserveBase: number
  reserveQuote: number
  price: number
  isActive: boolean
}

const BinChart = ({
  binData,
  activeBinId,
  minBinId,
  maxBinId,
  onRangeChange,
  baseSymbol,
  quoteSymbol,
}: BinChartProps) => {
  const chartData = useMemo<ChartDataPoint[]>(() => {
    return binData
      .sort((a, b) => a.binId - b.binId)
      .map((bin) => ({
        binId: bin.binId,
        delta: bin.binId - activeBinId,
        liquidity: bin.reserveBase + bin.reserveQuote,
        reserveBase: bin.reserveBase,
        reserveQuote: bin.reserveQuote,
        price: bin.price,
        isActive: bin.binId === activeBinId,
      }))
  }, [binData, activeBinId])

  const activeIndex = useMemo(() => {
    return chartData.findIndex((d) => d.binId === activeBinId)
  }, [chartData, activeBinId])

  const minIndex = useMemo(() => {
    if (minBinId === null) return 0
    return chartData.findIndex((d) => d.binId === minBinId)
  }, [chartData, minBinId])

  const maxIndex = useMemo(() => {
    if (maxBinId === null) return chartData.length - 1
    return chartData.findIndex((d) => d.binId === maxBinId)
  }, [chartData, maxBinId])

  const handleBrushChange = (range: { startIndex?: number; endIndex?: number }) => {
    if (range.startIndex === undefined || range.endIndex === undefined) return
    
    let startIdx = range.startIndex
    let endIdx = range.endIndex
    
    // Clamp to 63 bins max
    const selectedBins = endIdx - startIdx + 1
    if (selectedBins > 63) {
      // Keep the start, adjust the end
      endIdx = startIdx + 62
    }
    
    const startBinId = chartData[startIdx]?.binId
    const endBinId = chartData[endIdx]?.binId
    
    if (startBinId !== undefined && endBinId !== undefined) {
      onRangeChange(startBinId, endBinId)
    }
  }

  const CustomTooltip = ({ active, payload }: TooltipProps<ValueType, NameType>) => {
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
          Price: {data.price.toFixed(8)} {quoteSymbol}
        </div>
        <div>
          {baseSymbol}: {data.reserveBase.toFixed(4)}
        </div>
        <div>
          {quoteSymbol}: {data.reserveQuote.toFixed(4)}
        </div>
        <div className="mt-1 border-t border-border/40 pt-1">
          Total: {data.liquidity.toFixed(4)}
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
        <XAxis
          dataKey="delta"
          stroke="#64748B"
          fontSize={9}
          tickFormatter={(value) => (value === 0 ? '0' : value > 0 ? `+${value}` : `${value}`)}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          stroke="#64748B"
          fontSize={9}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => value.toFixed(0)}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1E293B', opacity: 0.3 }} />
        <ReferenceLine
          x={0}
          stroke="#F97316"
          strokeWidth={2}
          strokeDasharray="3 3"
        />
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
        <Brush
          dataKey="delta"
          height={20}
          stroke="#3B82F6"
          fill="#1E293B"
          startIndex={minIndex}
          endIndex={maxIndex}
          onChange={handleBrushChange}
          tickFormatter={(value) => (value === 0 ? '0' : value > 0 ? `+${value}` : `${value}`)}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default BinChart
