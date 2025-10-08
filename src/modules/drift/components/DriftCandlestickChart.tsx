import { useEffect, useRef } from 'react'
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  CandlestickSeries,
  type CandlestickData,
  type Time,
  type DeepPartial,
  type CandlestickSeriesOptions
} from 'lightweight-charts'
import type { DriftCandlePoint } from '../types'

interface DriftCandlestickChartProps {
  data: DriftCandlePoint[]
  isLoading: boolean
}

export const DriftCandlestickChart = ({ data, isLoading }: DriftCandlestickChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#334155' },
        horzLines: { color: '#334155' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 520,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#334155',
      },
      rightPriceScale: {
        borderColor: '#334155',
      },
      crosshair: {
        horzLine: {
          color: '#64748B',
          labelBackgroundColor: '#1E293B',
        },
        vertLine: {
          color: '#64748B',
          labelBackgroundColor: '#1E293B',
        },
      },
    })

    const seriesOptions: DeepPartial<CandlestickSeriesOptions> = {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    }

    const candlestickSeries = chart.addSeries(CandlestickSeries, seriesOptions)

    chartRef.current = chart
    candlestickSeriesRef.current = candlestickSeries

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [])

  useEffect(() => {
    if (!candlestickSeriesRef.current || data.length === 0) return

    const chartData: CandlestickData[] = data.map((candle) => ({
      time: Math.floor(candle.time / 1000) as Time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }))

    candlestickSeriesRef.current.setData(chartData)
    chartRef.current?.timeScale().fitContent()
  }, [data])

  if (isLoading) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded-lg border border-dashed border-border/40 text-sm text-muted-foreground">
        Loading chart...
      </div>
    )
  }

  return <div ref={chartContainerRef} className="relative w-full" />
}
