import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { CandleResolution } from '@drift-labs/sdk'
import { useDriftMarketsStore } from '../state'
import type { DriftCandlePoint } from '../types'
import { dlobWebsocketService, type DlobTradeEvent } from '../services/dlobWebsocketService'
import { HistoricalDataService } from '../services/historicalDataService'

const MAX_CANDLES = 500
const PRICE_PRECISION = 1_000_000

const RESOLUTION_TO_MINUTES: Record<CandleResolution, number> = {
  '1': 1,
  '5': 5,
  '15': 15,
  '60': 60,
  '240': 240,
  D: 1440,
  W: 10_080,
  M: 43_200,
}

type CandleMutator = (map: Map<number, DriftCandlePoint>) => boolean

const getResolutionMinutes = (resolution: CandleResolution): number => {
  return RESOLUTION_TO_MINUTES[resolution] ?? 60
}

const bucketStart = (timestampMs: number, resolutionMinutes: number): number => {
  const intervalMs = resolutionMinutes * 60 * 1000
  return Math.floor(timestampMs / intervalMs) * intervalMs
}

const parseNumeric = (value: unknown): number | undefined => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      return undefined
    }
    const numeric = Number(trimmed)
    return Number.isFinite(numeric) ? numeric : undefined
  }
  return undefined
}

const parsePrice = (value: unknown): number | undefined => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      return undefined
    }
    if (trimmed.includes('.')) {
      const numeric = Number(trimmed)
      return Number.isFinite(numeric) ? numeric : undefined
    }
    const numeric = Number(trimmed)
    if (!Number.isFinite(numeric)) {
      return undefined
    }
    return numeric / PRICE_PRECISION
  }
  return undefined
}

const deriveTradePrice = (payload: DlobTradeEvent['payload']): number | undefined => {
  const oraclePrice = parsePrice((payload as { oraclePrice?: unknown }).oraclePrice)
  if (typeof oraclePrice === 'number' && oraclePrice > 0) {
    return oraclePrice
  }

  const quoteFilled = parseNumeric((payload as { quoteAssetAmountFilled?: unknown }).quoteAssetAmountFilled)
  const baseFilled = parseNumeric((payload as { baseAssetAmountFilled?: unknown }).baseAssetAmountFilled)

  if (baseFilled && Math.abs(baseFilled) > 0 && quoteFilled && Math.abs(quoteFilled) > 0) {
    const ratio = Math.abs(quoteFilled / baseFilled)
    if (Number.isFinite(ratio) && ratio > 0) return ratio
  }

  return undefined
}

export const useDriftMarketChart = () => {
  const markets = useDriftMarketsStore((state) => state.markets)
  const selectedMarketIndex = useDriftMarketsStore((state) => state.selectedMarketIndex)
  const snapshots = useDriftMarketsStore((state) => state.snapshots)
  const resolution = useDriftMarketsStore((state) => state.chart.resolution)
  const setChartData = useDriftMarketsStore((state) => state.setChartData)
  const setChartLoading = useDriftMarketsStore((state) => state.setChartLoading)
  const setChartError = useDriftMarketsStore((state) => state.setChartError)
  const chartLoading = useDriftMarketsStore((state) => state.chart.loading)

  const candlesRef = useRef<Map<number, DriftCandlePoint>>(new Map())
  const fetchAbortRef = useRef<AbortController | null>(null)

  const selectedMarket = useMemo(
    () =>
      selectedMarketIndex === null
        ? undefined
        : markets.find((market) => market.marketIndex === selectedMarketIndex),
    [markets, selectedMarketIndex]
  )

  const marketSymbol = selectedMarket?.symbol
  const intervalMinutes = useMemo(() => getResolutionMinutes(resolution), [resolution])

  const updateCandles = useCallback(
    (mutator: CandleMutator) => {
      const working = new Map(candlesRef.current)
      const mutated = mutator(working)

      if (!mutated) {
        return
      }

      const sortedEntries = Array.from(working.entries()).sort((a, b) => a[0] - b[0])
      const trimmedEntries = sortedEntries.slice(-MAX_CANDLES)
      const nextMap = new Map(trimmedEntries)
      candlesRef.current = nextMap

      const values = trimmedEntries.map(([, candle]) => candle)
      setChartData(values, Date.now())
    },
    [setChartData]
  )

  const handleTrade = useCallback(
    (event: DlobTradeEvent) => {
      if (chartLoading && candlesRef.current.size === 0) {
        return
      }
      if (!intervalMinutes) {
        return
      }

      const tradeTs = typeof event.payload?.ts === 'number' ? event.payload.ts * 1000 : event.receivedTs
      const price = deriveTradePrice(event.payload)
      if (!price || !Number.isFinite(price) || price <= 0) {
        return
      }

      const rawVolume = parseNumeric((event.payload as { baseAssetAmountFilled?: unknown }).baseAssetAmountFilled) ?? 0
      const volume = Math.abs(rawVolume)
      const bucketTs = bucketStart(tradeTs, intervalMinutes)

      updateCandles((map) => {
        const current = map.get(bucketTs)
        if (!current) {
          map.set(bucketTs, {
            time: bucketTs,
            open: price,
            high: price,
            low: price,
            close: price,
            volume,
          })
          console.log('[Drift Chart] seeded trade bucket', {
            market: event.market,
            bucketTs,
            price,
            volume,
          })
          return true
        }

        const nextHigh = Math.max(current.high, price)
        const nextLow = Math.min(current.low, price)
        const nextVolume = current.volume + volume

        if (
          nextHigh === current.high &&
          nextLow === current.low &&
          price === current.close &&
          nextVolume === current.volume
        ) {
          return false
        }

        map.set(bucketTs, {
          time: bucketTs,
          open: current.open,
          high: nextHigh,
          low: nextLow,
          close: price,
          volume: nextVolume,
        })

        console.log('[Drift Chart] updated trade bucket', {
          market: event.market,
          bucketTs,
          price,
          volume: nextVolume,
        })

        return true
      })
    },
    [intervalMinutes, updateCandles, chartLoading]
  )

  useEffect(() => {
    if (!marketSymbol) {
      return
    }

    const unsubscribe = dlobWebsocketService.subscribeTrades({
      market: marketSymbol,
      marketType: 'perp',
      handler: handleTrade,
    })

    return () => {
      unsubscribe()
    }
  }, [handleTrade, marketSymbol])

  useEffect(() => {
    if (selectedMarketIndex === null || !marketSymbol) {
      fetchAbortRef.current?.abort()
      candlesRef.current = new Map()
      setChartData([], Date.now())
      setChartLoading(false)
      return
    }

    const controller = new AbortController()
    fetchAbortRef.current?.abort()
    fetchAbortRef.current = controller

    // Clear current candles immediately on market change to avoid cross-asset artifacts
    candlesRef.current = new Map()
    setChartData([], Date.now())

    setChartLoading(true)
    setChartError(null)

    console.log('[Drift Chart] requesting REST candles', {
      market: marketSymbol,
      resolution,
      limit: MAX_CANDLES,
    })

    HistoricalDataService.fetchCandles(marketSymbol, resolution, {
      limit: MAX_CANDLES,
      signal: controller.signal,
    })
      .then(({ candles }) => {
        if (controller.signal.aborted) {
          return
        }

        console.log('[Drift Chart] REST candles fetched', {
          market: marketSymbol,
          resolution,
          count: candles.length,
          first: candles[0]?.time,
          last: candles[candles.length - 1]?.time,
        })

        const sorted = candles.slice(-MAX_CANDLES)
        candlesRef.current = new Map(sorted.map((candle) => [candle.time, candle]))
        setChartData(sorted, Date.now())
        setChartLoading(false)
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return
        }
        const message = error instanceof Error ? error.message : 'Failed to load historical candles'
        console.error('[Drift Chart] historical fetch failed', error)
        candlesRef.current = new Map()
        setChartData([], Date.now())
        setChartError(message)
        setChartLoading(false)
      })

    return () => {
      controller.abort()
    }
  }, [marketSymbol, resolution, selectedMarketIndex, setChartData, setChartError, setChartLoading])

  useEffect(() => {
    if (selectedMarketIndex === null || !marketSymbol) {
      return
    }

    const snapshot = snapshots[selectedMarketIndex]
    if (!snapshot || typeof snapshot.markPrice !== 'number' || Number.isNaN(snapshot.markPrice)) {
      return
    }

    if (!intervalMinutes) {
      return
    }

    // Avoid seeding a lone candle while bootstrapping to prevent scale glitches
    if (chartLoading && candlesRef.current.size === 0) {
      return
    }

    const bucketTs = bucketStart(Date.now(), intervalMinutes)
    const markPrice = snapshot.markPrice as number
    if (!Number.isFinite(markPrice)) {
      return
    }

    updateCandles((map) => {
      const candle = map.get(bucketTs)
      if (!candle) {
        map.set(bucketTs, {
          time: bucketTs,
          open: markPrice,
          high: markPrice,
          low: markPrice,
          close: markPrice,
          volume: 0,
        })
        return true
      }
      const nextHigh = Math.max(candle.high, markPrice)
      const nextLow = Math.min(candle.low, markPrice)

      if (nextHigh === candle.high && nextLow === candle.low && markPrice === candle.close) {
        return false
      }

      map.set(bucketTs, {
        ...candle,
        high: nextHigh,
        low: nextLow,
        close: markPrice,
      })
      return true
    })
  }, [intervalMinutes, marketSymbol, selectedMarketIndex, snapshots, updateCandles, chartLoading])
}
