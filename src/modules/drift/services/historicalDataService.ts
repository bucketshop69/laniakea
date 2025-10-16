import type { CandleResolution } from '@drift-labs/sdk'
import type { DriftCandlePoint } from '../types'

interface DriftCandleRecord {
  ts: number
  fillOpen?: number
  fillHigh?: number
  fillClose?: number
  fillLow?: number
  oracleOpen?: number
  oracleHigh?: number
  oracleClose?: number
  oracleLow?: number
  quoteVolume?: number
  baseVolume?: number
}

interface DriftCandleResponse {
  success: boolean
  records: DriftCandleRecord[]
}

interface FetchOptions {
  limit?: number
  timeoutMs?: number
  retries?: number
  signal?: AbortSignal
}

interface FetchResult {
  candles: DriftCandlePoint[]
  fromCache: boolean
}

const BASE_URL = 'https://data.api.drift.trade'
const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_RETRIES = 3
const DEFAULT_LIMIT = 500
const CACHE_TTL_MS = 5 * 60 * 1000

const RESOLUTION_TO_INTERVAL: Record<CandleResolution, string> = {
  '1': '1',
  '5': '5',
  '15': '15',
  '60': '60',
  '240': '240',
  D: '1440',
  W: '10080',
  M: '43200',
}

type CacheEntry = {
  ts: number
  data: DriftCandlePoint[]
}

const cache = new Map<string, CacheEntry>()

export class HistoricalDataService {
  static async fetchCandles(
    marketSymbol: string,
    resolution: CandleResolution,
    options: FetchOptions = {}
  ): Promise<FetchResult> {
    const { limit = DEFAULT_LIMIT, timeoutMs = DEFAULT_TIMEOUT_MS, retries = DEFAULT_RETRIES, signal } = options

    const interval = RESOLUTION_TO_INTERVAL[resolution]
    if (!interval) {
      throw new Error(`Unsupported resolution: ${resolution}`)
    }

    const cacheKey = `${marketSymbol}:${interval}:${limit}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      console.log('[Drift Chart] using cached REST candles', {
        market: marketSymbol,
        resolution,
        count: cached.data.length,
      })
      return { candles: cached.data, fromCache: true }
    }

    let attempt = 0
    let lastError: unknown

    while (attempt < retries) {
      attempt += 1
      try {
        const candles = await this.fetchOnce(marketSymbol, interval, limit, timeoutMs, signal)
        cache.set(cacheKey, { ts: Date.now(), data: candles })
        return { candles, fromCache: false }
      } catch (error) {
        lastError = error
        if (attempt >= retries) {
          break
        }
        const backoff = Math.min(1000 * 2 ** (attempt - 1), 10_000)
        await new Promise((resolve) => setTimeout(resolve, backoff))
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Failed to fetch candles from Drift data API')
  }

  static clearCache(): void {
    cache.clear()
  }

  private static async fetchOnce(
    marketSymbol: string,
    interval: string,
    limit: number,
    timeoutMs: number,
    externalSignal?: AbortSignal
  ): Promise<DriftCandlePoint[]> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    const abortHandler = () => controller.abort()
    try {
      if (externalSignal) {
        if (externalSignal.aborted) {
          throw new DOMException('Aborted', 'AbortError')
        }
        externalSignal.addEventListener('abort', abortHandler, { once: true })
      }

      const url = `${BASE_URL}/market/${encodeURIComponent(marketSymbol)}/candles/${interval}?limit=${limit}`
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      })

      if (!response.ok) {
        throw new Error(`Drift data API responded with ${response.status}`)
      }

      const payload = (await response.json()) as DriftCandleResponse

      if (!payload.success || !Array.isArray(payload.records)) {
        throw new Error('Unexpected response shape from Drift data API')
      }

      return this.transformRecords(payload.records)
    } finally {
      clearTimeout(timeout)
      if (externalSignal) {
        externalSignal.removeEventListener('abort', abortHandler)
      }
    }
  }

  private static transformRecords(records: DriftCandleRecord[]): DriftCandlePoint[] {
    if (!records.length) {
      return []
    }

    const candles = records
      .filter((record) => record && typeof record.ts === 'number' && record.ts > 0)
      .map((record) => {
        const open = this.pickValue(record.fillOpen, record.oracleOpen)
        const high = this.pickValue(record.fillHigh, record.oracleHigh)
        const low = this.pickValue(record.fillLow, record.oracleLow)
        const close = this.pickValue(record.fillClose, record.oracleClose)
        const volume = typeof record.baseVolume === 'number' ? record.baseVolume : 0

        return {
          time: record.ts * 1000,
          open,
          high,
          low,
          close,
          volume,
        }
      })
      .filter((candle) =>
        candle.open > 0 && candle.high > 0 && candle.low > 0 && candle.close > 0 && Number.isFinite(candle.volume)
      )

    candles.sort((a, b) => a.time - b.time)
    return candles
  }

  private static pickValue(primary?: number, secondary?: number): number {
    if (typeof primary === 'number' && primary > 0) {
      return primary
    }
    if (typeof secondary === 'number' && secondary > 0) {
      return secondary
    }
    return 0
  }
}
