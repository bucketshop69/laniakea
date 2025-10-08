import { useEffect, useRef, useCallback } from 'react'
import type { CandleResolution } from '@drift-labs/sdk'
import { useDriftMarketsStore } from '../state'
import type { DriftCandlePoint } from '../types'
import { getDriftClient } from '../services/driftClientService'

const CANDLE_UPDATE_MS = 1_000 // Update current candle every second

const resolutionToMinutes = (resolution: CandleResolution): number => {
  switch (resolution) {
    case '1':
      return 1
    case '5':
      return 5
    case '15':
      return 15
    case '60':
      return 60
    case 'D':
      return 1440 // 24 hours * 60 minutes
    default:
      return 60
  }
}

const generateHistoricalCandles = (currentPrice: number, count: number, intervalMinutes: number): DriftCandlePoint[] => {
  const now = Date.now()
  const intervalMs = intervalMinutes * 60 * 1000
  const candles: DriftCandlePoint[] = []
  let price = currentPrice * 0.98 // Start 2% lower
  
  for (let i = count - 1; i >= 1; i--) { // Leave last candle for live updates
    const time = now - (i * intervalMs)
    const volatility = price * 0.015 // 1.5% volatility per candle
    const trend = (Math.random() - 0.5) * volatility * 0.3
    
    const open = price
    const close = price + trend
    
    // Ensure high is the highest price and low is the lowest
    const wickUpRange = Math.max(open, close) * Math.random() * 0.01
    const wickDownRange = Math.min(open, close) * Math.random() * 0.01
    
    const high = Math.max(open, close) + wickUpRange
    const low = Math.min(open, close) - wickDownRange
    const volume = (Math.random() * 500000) + 250000
    
    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume,
    })
    
    price = close
  }
  
  return candles
}

export const useDriftMarketChart = () => {
  const selectedMarketIndex = useDriftMarketsStore((state) => state.selectedMarketIndex)
  const getSnapshots = useDriftMarketsStore((state) => state.snapshots)
  const resolution = useDriftMarketsStore((state) => state.chart.resolution)
  const setChartData = useDriftMarketsStore((state) => state.setChartData)
  const setChartLoading = useDriftMarketsStore((state) => state.setChartLoading)
  const setChartError = useDriftMarketsStore((state) => state.setChartError)

  const updateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentCandleRef = useRef<DriftCandlePoint | null>(null)
  const historicalCandlesRef = useRef<DriftCandlePoint[]>([])
  const candleStartTimeRef = useRef<number>(0)
  const snapshotsRef = useRef(getSnapshots)

  // Keep snapshots ref updated without causing re-renders
  useEffect(() => {
    snapshotsRef.current = getSnapshots
  }, [getSnapshots])

  const getCandleStartTime = useCallback((timestamp: number, intervalMinutes: number) => {
    const intervalMs = intervalMinutes * 60 * 1000
    return Math.floor(timestamp / intervalMs) * intervalMs
  }, [])

  const updateCurrentCandle = useCallback(() => {
    if (selectedMarketIndex === null) return

    const snapshot = snapshotsRef.current[selectedMarketIndex]
    const currentPrice = snapshot?.markPrice

    if (!currentPrice || !currentCandleRef.current) return

    const now = Date.now()
    const intervalMinutes = resolutionToMinutes(resolution)
    const currentCandleStart = getCandleStartTime(now, intervalMinutes)

    // Check if we need to start a new candle
    if (currentCandleStart !== candleStartTimeRef.current) {
      // Close previous candle
      if (currentCandleRef.current) {
        historicalCandlesRef.current = [
          ...historicalCandlesRef.current.slice(-99), // Keep last 99
          currentCandleRef.current,
        ]
      }

      // Start new candle
      candleStartTimeRef.current = currentCandleStart
      currentCandleRef.current = {
        time: currentCandleStart,
        open: currentPrice,
        high: currentPrice,
        low: currentPrice,
        close: currentPrice,
        volume: 0,
      }
    } else {
      // Update current candle - ensure high is max and low is min of all prices
      const newHigh = Math.max(currentCandleRef.current.high, currentPrice)
      const newLow = Math.min(currentCandleRef.current.low, currentPrice)
      
      currentCandleRef.current = {
        ...currentCandleRef.current,
        high: newHigh,
        low: newLow,
        close: currentPrice,
        volume: currentCandleRef.current.volume + Math.random() * 10000, // Simulated volume
      }
    }

    // Update chart with historical + current candle
    const allCandles = [...historicalCandlesRef.current, currentCandleRef.current]
    setChartData(allCandles, Date.now())
  }, [selectedMarketIndex, resolution, getCandleStartTime, setChartData])

  useEffect(() => {
    const tearDown = () => {
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current)
        updateTimerRef.current = null
      }
    }

    if (selectedMarketIndex === null) {
      tearDown()
      setChartData([], Date.now())
      historicalCandlesRef.current = []
      currentCandleRef.current = null
      return
    }

    const initializeChart = async () => {
      try {
        setChartLoading(true)
        setChartError(null)

        const snapshot = snapshotsRef.current[selectedMarketIndex]
        const currentPrice = snapshot?.markPrice ?? 100

        const intervalMinutes = resolutionToMinutes(resolution)
        const candleCount = resolution === 'D' ? 30 : 100

        console.log('[Drift Chart] Initializing live chart:', {
          marketIndex: selectedMarketIndex,
          currentPrice,
          resolution,
          intervalMinutes,
        })

        // Generate historical candles
        historicalCandlesRef.current = generateHistoricalCandles(currentPrice, candleCount, intervalMinutes)

        // Initialize current candle
        const now = Date.now()
        const currentCandleStart = getCandleStartTime(now, intervalMinutes)
        candleStartTimeRef.current = currentCandleStart

        currentCandleRef.current = {
          time: currentCandleStart,
          open: currentPrice,
          high: currentPrice,
          low: currentPrice,
          close: currentPrice,
          volume: 0,
        }

        // Set initial data
        const allCandles = [...historicalCandlesRef.current, currentCandleRef.current]
        setChartData(allCandles, Date.now())
        setChartLoading(false)

        // Start live updates
        tearDown()
        updateTimerRef.current = setInterval(updateCurrentCandle, CANDLE_UPDATE_MS)

        console.log('[Drift Chart] Live chart initialized, updating every second')
      } catch (error) {
        console.error('[Drift Chart] Failed to initialize chart:', error)
        const message = error instanceof Error ? error.message : 'Unknown error'
        setChartError(message)
        setChartLoading(false)
      }
    }

    void initializeChart()

    return () => {
      tearDown()
    }
  }, [selectedMarketIndex, resolution, getCandleStartTime, updateCurrentCandle, setChartData, setChartLoading, setChartError])
}
