import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  CandlestickSeries,
  type CandlestickData,
  type Time,
} from 'lightweight-charts'
import type { DriftCandlePoint } from '../types'

const MIN_BARS = 30
const RIGHT_GAP_BARS = 8

interface DriftCandlestickChartProps {
  data: DriftCandlePoint[]
  isLoading: boolean
}

export const DriftCandlestickChart = ({ data, isLoading }: DriftCandlestickChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const rangeSetRef = useRef(false)

  // Ensure client-side only rendering
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Initialize chart engine when mounted - separate from data updates
  useEffect(() => {
    if (!isMounted || !chartContainerRef.current || chartRef.current) return

    const initializeChart = () => {
      try {
        const container = chartContainerRef.current
        if (!container) return

        const { clientWidth, clientHeight } = container
        const width = clientWidth || 800
        const height = clientHeight || 520

        console.log('[Chart] Initializing with dimensions:', { width, height })

        const chart = createChart(container, {
          width,
          height,
          layout: {
            background: { type: ColorType.Solid, color: 'transparent' },
            textColor: '#94a3b8',
          },
          grid: {
            vertLines: { color: '#334155' },
            horzLines: { color: '#334155' },
          },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
            borderColor: '#334155',
            rightOffset: 12,
            barSpacing: 8,
          },
          rightPriceScale: {
            borderColor: '#334155',
            scaleMargins: {
              top: 0.1,
              bottom: 0.1,
            },
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

        const series = chart.addSeries(CandlestickSeries, {
          upColor: '#10b981',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
        })

        chartRef.current = chart
        seriesRef.current = series
        setIsInitialized(true)

        console.log('[Chart] Initialized successfully')
      } catch (error) {
        console.error('[Chart] Initialization failed:', error)
      }
    }

    initializeChart()

    // Proper cleanup on unmount to avoid duplicate instances (StrictMode-safe)
    return () => {
      console.log('[Chart] Cleanup: destroying chart')
      try {
        chartRef.current?.remove()
      } catch {}
      chartRef.current = null
      seriesRef.current = null
      rangeSetRef.current = false
    }
  }, [isMounted])

  // ResizeObserver for dynamic sizing
  useEffect(() => {
    if (!chartContainerRef.current || !isInitialized) return

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry || !chartRef.current) return

      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) {
        chartRef.current.applyOptions({ width, height })
      }
    })

    resizeObserver.observe(chartContainerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [isInitialized])

  // Update chart data when candles change
  useEffect(() => {
    if (!isInitialized || !seriesRef.current || data.length === 0) return

    try {
      const chartData: CandlestickData[] = data
        .map((candle) => ({
          time: Math.floor(candle.time / 1000) as Time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }))
        .sort((a, b) => (a.time as number) - (b.time as number))

      // Hold initial paint until we have a minimum number of bars to avoid flashing 1-2 candles
      if (chartData.length < MIN_BARS) {
        return
      }

      seriesRef.current.setData(chartData)

      // Set initial view only when we have enough data; otherwise fit content, but wait to lock view
      if (chartRef.current && !rangeSetRef.current) {
        setTimeout(() => {
          if (!chartRef.current) return
          const ts = chartRef.current.timeScale()

          try {
            if (chartData.length < 50) {
              ts.fitContent()
              // Don't lock the range yet; wait until we have a substantial history
              return
            }

            const total = chartData.length
            const visible = Math.min(100, total)
            const from = Math.max(0, total - visible)
            // Use logical range and extend 'to' to create a right-side gap for the last bar
            ts.setVisibleLogicalRange({ from, to: total + RIGHT_GAP_BARS })
            rangeSetRef.current = true
            console.log('[Chart] Initial view set (logical range with right gap)')
          } catch (e) {
            ts.fitContent()
          }
        }, 50)
      }
    } catch (error) {
      console.error('[Chart] Failed to update data:', error)
    }
  }, [data, isInitialized])

  return (
    <div ref={chartContainerRef} className="relative w-full" style={{ minHeight: '520px' }}>
      {(!isMounted || isLoading || data.length < MIN_BARS) && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-dashed border-border/40 bg-transparent text-sm text-muted-foreground">
          {isLoading ? 'Loading chart...' : 'Initializing...'}
        </div>
      )}
    </div>
  )
}
