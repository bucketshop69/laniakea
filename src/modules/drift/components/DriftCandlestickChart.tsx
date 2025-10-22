import { useEffect, useRef, useState, useMemo } from 'react'
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  CandlestickSeries,
  type CandlestickData,
  type Time,
} from 'lightweight-charts'
import { useWallet } from '@solana/wallet-adapter-react'
import { Pin } from 'lucide-react'
import { useAnnotationStore } from '@/modules/feed/state/annotationStore'
import type { DriftCandlePoint } from '../types'

const MIN_BARS = 30
const RIGHT_GAP_BARS = 8

const CANDLE_UP = '#16c47f'
const CANDLE_DOWN = '#f85149'

const candlestickColors = {
  grid: 'var(--border)',
  border: 'var(--border)',
  axisText: 'var(--primary)',
  crosshair: 'var(--primary)',
  crosshairLabel: 'var(--card)',
  up: CANDLE_UP,
  down: CANDLE_DOWN,
  wickUp: CANDLE_UP,
  wickDown: CANDLE_DOWN,
  markerTooltipBg: 'var(--card)',
  markerTooltipBorder: 'var(--border)',
}

interface DriftCandlestickChartProps {
  data: DriftCandlePoint[]
  isLoading: boolean
  marketSymbol?: string // e.g., "BTC-PERP", "SOL-PERP"
}

export const DriftCandlestickChart = ({ data, isLoading, marketSymbol }: DriftCandlestickChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const rangeSetRef = useRef(false)
  const [markerElements, setMarkerElements] = useState<{
    id: string
    x: number
    y: number
    note: string
    timestamp: string
    feedItemId: string | null
  }[]>([])
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null)
  const [feedItemDetails, setFeedItemDetails] = useState<Record<string, { title: string; description: string | null }>>({})

  // Annotation support
  const { publicKey } = useWallet()
  const annotations = useAnnotationStore((state) => state.annotations)
  const loadAnnotations = useAnnotationStore((state) => state.loadAnnotations)

  // Ensure client-side only rendering
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Extract asset from market symbol (e.g., "BTC-PERP" -> "BTC", "SOL-PERP" -> "SOL")
  const asset = useMemo(() => {
    if (!marketSymbol) return null
    // Extract base asset from market symbol (handles "BTC-PERP", "SOL-PERP", etc.)
    const match = marketSymbol.match(/^([A-Z]+)/)
    return match ? match[1] : null
  }, [marketSymbol])

  // Load annotations when wallet connects - now dynamic based on market
  useEffect(() => {
    console.log('[Chart] Wallet check:', {
      hasPublicKey: !!publicKey,
      publicKey: publicKey?.toString(),
      isInitialized,
      marketSymbol,
      asset
    })

    if (publicKey && isInitialized && asset) {
      console.log('[Chart] Loading annotations for', asset, 'wallet:', publicKey.toString())
      loadAnnotations(publicKey.toString(), asset)
    } else {
      console.log('[Chart] Skipping annotation load - wallet not connected, chart not ready, or no asset')
    }
  }, [publicKey, isInitialized, loadAnnotations, asset])

  // Load feed item details for tooltips
  useEffect(() => {
    const loadFeedItemDetails = async () => {
      const uniqueFeedItemIds = [...new Set(annotations.map(a => a.feed_item_id).filter(Boolean))] as string[]

      if (uniqueFeedItemIds.length === 0) return

      try {
        const { supabase } = await import('@/lib/supabase')
        const { data, error } = await supabase
          .from('feed_items')
          .select('id, title, description')
          .in('id', uniqueFeedItemIds)

        if (error) throw error

        const details: Record<string, { title: string; description: string | null }> = {}
        data?.forEach(item => {
          details[item.id] = { title: item.title, description: item.description }
        })

        setFeedItemDetails(details)
      } catch (error) {
        console.error('[Chart] Failed to load feed item details:', error)
      }
    }

    loadFeedItemDetails()
  }, [annotations])

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
            textColor: candlestickColors.axisText,
          },
          grid: {
            vertLines: { color: candlestickColors.grid },
            horzLines: { color: candlestickColors.grid },
          },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
            borderColor: candlestickColors.border,
            rightOffset: 12,
            barSpacing: 8,
          },
          rightPriceScale: {
            borderColor: candlestickColors.border,
            textColor: candlestickColors.axisText,
            scaleMargins: {
              top: 0.1,
              bottom: 0.1,
            },
          },
          crosshair: {
            horzLine: {
              color: candlestickColors.crosshair,
              labelBackgroundColor: candlestickColors.crosshairLabel,
            },
            vertLine: {
              color: candlestickColors.crosshair,
              labelBackgroundColor: candlestickColors.crosshairLabel,
            },
          },
        })

        const series = chart.addSeries(CandlestickSeries, {
          upColor: candlestickColors.up,
          downColor: candlestickColors.down,
          borderVisible: true,
          borderUpColor: candlestickColors.up,
          borderDownColor: candlestickColors.down,
          wickUpColor: candlestickColors.wickUp,
          wickDownColor: candlestickColors.wickDown,
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
      } catch { }
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

  // Update marker positions with both time (X) and price (Y) coordinates
  const updateMarkerPositions = () => {
    if (!chartRef.current || !seriesRef.current || annotations.length === 0 || data.length === 0) {
      setMarkerElements([])
      return
    }

    try {
      const timeScale = chartRef.current.timeScale()
      const series = seriesRef.current
      const markers: typeof markerElements = []

      // Get chart dimensions for bounds checking
      const chartWidth = chartRef.current.chartElement().clientWidth
      const chartHeight = chartRef.current.chartElement().clientHeight

      annotations.forEach((ann) => {
        const timestamp = Math.floor(new Date(ann.timestamp).getTime() / 1000) as Time

        // Get X coordinate from time
        const xCoord = timeScale.timeToCoordinate(timestamp)

        // Skip if timestamp is outside visible time range (returns null or negative)
        if (xCoord === null || xCoord < 0 || xCoord > chartWidth) {
          return
        }

        // Find the closest candle to get price
        const timestampMs = (timestamp as number) * 1000
        const candle = data.find(d => d.time === timestampMs) ||
          data.reduce((prev, curr) => {
            return Math.abs(curr.time - timestampMs) < Math.abs(prev.time - timestampMs)
              ? curr
              : prev
          })

        if (!candle) {
          console.warn('[Chart] No candle found for annotation:', ann.note)
          return
        }

        // Use the candle's high price to position marker above the candle
        const price = candle.high

        // Get Y coordinate from price
        const yCoord = series.priceToCoordinate(price)

        // Skip if price is outside visible range
        if (yCoord === null || yCoord < 0 || yCoord > chartHeight) {
          return
        }

        markers.push({
          id: ann.id,
          x: xCoord,
          y: yCoord,
          note: ann.note,
          timestamp: ann.timestamp,
          feedItemId: ann.feed_item_id,
        })
      })

      setMarkerElements(markers)
    } catch (error) {
      console.error('[Chart] Failed to update marker positions:', error)
    }
  }

  // Add annotation markers to chart (using DOM overlay) - fully responsive
  useEffect(() => {
    if (!isInitialized || !chartRef.current || !seriesRef.current || !chartContainerRef.current) return

    updateMarkerPositions()

    // Update markers when chart scrolls/zooms/changes timeframe
    const timeScale = chartRef.current.timeScale()

    // Debounce to prevent excessive updates
    let debounceTimer: NodeJS.Timeout | null = null
    const debouncedUpdate = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(updateMarkerPositions, 50)
    }

    timeScale.subscribeVisibleLogicalRangeChange(debouncedUpdate)

    // Workaround for price scale changes (no direct API in lightweight-charts v5)
    // Only listen for mouseup (after drag/interaction completes)
    const chartContainer = chartContainerRef.current
    chartContainer.addEventListener('mouseup', debouncedUpdate)

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      timeScale.unsubscribeVisibleLogicalRangeChange(debouncedUpdate)
      chartContainer.removeEventListener('mouseup', debouncedUpdate)
    }
  }, [annotations, isInitialized, data])

  return (
    <div ref={chartContainerRef} className="relative w-full min-h-[520px]">
      {(!isMounted || isLoading || data.length < MIN_BARS) && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-dashed border-border/40 bg-transparent text-sm text-muted-foreground">
          {isLoading ? 'Loading chart...' : 'Initializing...'}
        </div>
      )}

      {/* Annotation Markers Overlay - TradingView Style */}
      {markerElements.map((marker) => {
        const isHovered = hoveredMarkerId === marker.id
        const feedItem = marker.feedItemId ? feedItemDetails[marker.feedItemId] : null

        return (
          <div
            key={marker.id}
            className="absolute z-50 -translate-x-1/2 -translate-y-full cursor-pointer pointer-events-auto"
            style={{
              left: `${marker.x}px`,
              top: `${marker.y}px`,
            }}
            onMouseEnter={() => setHoveredMarkerId(marker.id)}
            onMouseLeave={() => setHoveredMarkerId(null)}
          >
            {/* Marker Pin */}
            <div className="relative">
              <div
                className={`
                  relative w-5 h-5 rounded-full flex items-center justify-center
                  transition-all duration-200 shadow-md
                  bg-muted text-primary
                  ${isHovered ? 'bg-muted/80 scale-110' : ''}
                `}
              >
                <Pin size={12} className="fill-current rotate-24" />
              </div>

              {/* Vertical line to candle */}
              <div className="absolute left-1/2 top-5 w-px h-2 bg-muted -translate-x-1/2" />
            </div>

            {/* Tooltip */}
            {isHovered && (
              <div
                className="absolute left-1/2 bottom-full mb-2 w-56 -translate-x-1/2 rounded border border-border bg-card p-2 shadow-xl z-[100] pointer-events-none"
              >
                <div className="mb-1 text-xs font-semibold text-primary">
                  {feedItem?.title || marker.note}
                </div>
                {feedItem?.description && (
                  <div className="text-[10px] text-secondary-foreground line-clamp-2">
                    {feedItem.description}
                  </div>
                )}
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(marker.timestamp).toLocaleString()}
                </div>

                {/* Tooltip arrow */}
                <div className="absolute left-1/2 bottom-0 h-0 w-0 -translate-x-1/2 translate-y-full border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-[var(--card)]" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
