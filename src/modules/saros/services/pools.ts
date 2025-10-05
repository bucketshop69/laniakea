import { PublicKey } from '@solana/web3.js'
import type { PoolMetadata } from '@saros-finance/dlmm-sdk/types/config'
import type { GetTokenOutputResponse, GetBinArrayParams, GetBinsArrayInfoParams } from '@saros-finance/dlmm-sdk/types/services'
import { BIN_ARRAY_SIZE } from '@saros-finance/dlmm-sdk/constants'
import { getLiquidityBookService } from '../lib/liquidityBook'
import {
  type SarosBinLiquidityPoint,
  type SarosOverviewChartPoint,
  type SarosPoolMetadataSnapshot,
} from '../types/domain'
import { getPriceFromBinId } from '../utils'
import { withRetries } from './shared'

const SAROS_OVERVIEW_CHART_ENDPOINT = 'https://api.saros.xyz/api/dex-v3/pool/overview/chart'
const OVERVIEW_CHART_CACHE_TTL = 60_000
const DEFAULT_CHART_DAYS = 30

const metadataCache = new Map<string, { timestamp: number; value: SarosPoolMetadataSnapshot }>()
const overviewChartCache = new Map<string, { timestamp: number; value: SarosOverviewChartPoint[] }>()

const buildSnapshot = (metadata: PoolMetadata): SarosPoolMetadataSnapshot => {
  const baseDecimals = Number(metadata.extra?.tokenBaseDecimal ?? 0)
  const quoteDecimals = Number(metadata.extra?.tokenQuoteDecimal ?? 0)

  const baseReserveRaw = Number(metadata.baseReserve ?? 0)
  const quoteReserveRaw = Number(metadata.quoteReserve ?? 0)

  const baseReserve = baseReserveRaw / Math.pow(10, baseDecimals)
  const quoteReserve = quoteReserveRaw / Math.pow(10, quoteDecimals)

  const price = baseReserve > 0 ? quoteReserve / baseReserve : null
  const totalValueQuote = price != null ? baseReserve * price + quoteReserve : null

  return {
    raw: metadata,
    poolAddress: metadata.poolAddress,
    price,
    baseReserve,
    quoteReserve,
    totalValueQuote,
    baseDecimals,
    quoteDecimals,
  }
}

export const fetchSarosPoolMetadata = async (pairAddress: string): Promise<SarosPoolMetadataSnapshot> => {
  const now = Date.now()
  const cached = metadataCache.get(pairAddress)

  if (cached && now - cached.timestamp < 30_000) {
    return cached.value
  }

  const service = getLiquidityBookService()
  const metadata = await withRetries(() => service.fetchPoolMetadata(pairAddress))
  const snapshot = buildSnapshot(metadata)

  metadataCache.set(pairAddress, { timestamp: Date.now(), value: snapshot })
  return snapshot
}

export const fetchSarosOverviewChart = async (params?: { days?: number }): Promise<SarosOverviewChartPoint[]> => {
  const days = params?.days ?? DEFAULT_CHART_DAYS

  const targetStart = new Date()
  targetStart.setUTCHours(0, 0, 0, 0)
  targetStart.setUTCDate(targetStart.getUTCDate() - days)
  const startTime = targetStart.getTime()
  const cacheKey = `${startTime}`
  const now = Date.now()

  const cached = overviewChartCache.get(cacheKey)
  if (cached && now - cached.timestamp < OVERVIEW_CHART_CACHE_TTL) {
    return cached.value
  }

  const searchParams = new URLSearchParams()
  searchParams.set('startTime', cacheKey)

  const payload = await withRetries(async () => {
    const response = await fetch(`${SAROS_OVERVIEW_CHART_ENDPOINT}?${searchParams.toString()}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch Saros overview chart: ${response.status}`)
    }
    return response.json() as Promise<{ data?: unknown }>
  })

  const entries = Array.isArray(payload?.data) ? (payload.data as any[]) : []

  const data = entries.reduce<SarosOverviewChartPoint[]>((acc, entry) => {
    const date = typeof entry?.date === 'string' ? entry.date : null
    const liquidity = Number.parseFloat(entry?.liquidity)
    const volume = Number.parseFloat(entry?.volume)
    const cumulativeVolume = Number.parseFloat(entry?.cumulativeVolume)

    if (!date || Number.isNaN(liquidity) || Number.isNaN(volume) || Number.isNaN(cumulativeVolume)) {
      return acc
    }

    acc.push({ date, liquidity, volume, cumulativeVolume })
    return acc
  }, [])

  overviewChartCache.set(cacheKey, { timestamp: Date.now(), value: data })
  return data
}

export const quoteSarosPool = async (
  metadata: PoolMetadata,
  amount: number,
  optional: { isExactInput: boolean; swapForY: boolean; slippage: number },
): Promise<GetTokenOutputResponse> => {
  const service = getLiquidityBookService()
  return withRetries(() => service.quote({ amount, metadata, optional }))
}

const DUMMY_PAYER = new PublicKey('11111111111111111111111111111111')

type BinDistributionParams = {
  pairAddress: string
  activeBin: number
  binStep: number
  baseDecimals: number
  quoteDecimals: number
  range: number
}

type RawBin = {
  reserveX: unknown
  reserveY: unknown
  totalSupply: unknown
}

export const fetchSarosBinDistribution = async ({
  pairAddress,
  activeBin,
  binStep,
  baseDecimals,
  quoteDecimals,
  range,
}: BinDistributionParams): Promise<SarosBinLiquidityPoint[]> => {
  const pairKey = new PublicKey(pairAddress)
  const service = getLiquidityBookService()

  const sanitizedRange = Math.max(1, range)
  const lowerBin = Math.max(0, activeBin - sanitizedRange)
  const upperBin = activeBin + sanitizedRange

  const lowerIndex = Math.floor(lowerBin / BIN_ARRAY_SIZE)
  const upperIndex = Math.floor(upperBin / BIN_ARRAY_SIZE)

  const binArrayIndices = Array.from({ length: upperIndex - lowerIndex + 1 }, (_, idx) => lowerIndex + idx)

  const binArrays = await Promise.all(
    binArrayIndices.map((binArrayIndex) => withRetries(() => service.getBinArrayInfo({
      binArrayIndex,
      pair: pairKey,
      payer: DUMMY_PAYER,
    }) as Promise<{ bins: RawBin[]; resultIndex: number }>)),
  )

  const binMap = new Map<number, RawBin>()

  binArrays.forEach(({ bins, resultIndex }) => {
    bins.forEach((bin: RawBin, idx: number) => {
      const absoluteId = resultIndex * BIN_ARRAY_SIZE + idx
      if (absoluteId >= lowerBin && absoluteId <= upperBin && !binMap.has(absoluteId)) {
        binMap.set(absoluteId, bin)
      }
    })
  })

  const toNumber = (value: unknown) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0
    if (typeof value === 'bigint') return Number(value)
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value)
      return Number.isFinite(parsed) ? parsed : 0
    }
    if (value && typeof value === 'object' && 'toString' in value) {
      const parsed = Number.parseFloat((value as { toString(): string }).toString())
      return Number.isFinite(parsed) ? parsed : 0
    }
    return 0
  }

  const points: SarosBinLiquidityPoint[] = []

  for (let binId = lowerBin; binId <= upperBin; binId += 1) {
    const bucket = binMap.get(binId)
    if (!bucket) {
      points.push({
        binId,
        price: getPriceFromBinId(binId, binStep, baseDecimals, quoteDecimals),
        reserveBase: 0,
        reserveQuote: 0,
        totalSupply: 0,
      })
      continue
    }

    const rawReserveX = toNumber(bucket.reserveX)
    const rawReserveY = toNumber(bucket.reserveY)
    const rawTotalSupply = toNumber(bucket.totalSupply)

    const baseScale = Math.pow(10, baseDecimals)
    const quoteScale = Math.pow(10, quoteDecimals)

    points.push({
      binId,
      price: getPriceFromBinId(binId, binStep, baseDecimals, quoteDecimals),
      reserveBase: rawReserveX / baseScale,
      reserveQuote: rawReserveY / quoteScale,
      totalSupply: rawTotalSupply,
    })
  }

  return points
}

export const getSarosPairAccount = async (pairAddress: string) => {
  const service = getLiquidityBookService()
  return service.getPairAccount(new PublicKey(pairAddress))
}

export const getSarosBinArrayInfo = async (params: GetBinsArrayInfoParams) => {
  const service = getLiquidityBookService()
  return service.getBinArrayInfo(params)
}

export const getSarosBinArray = async (params: GetBinArrayParams) => {
  const service = getLiquidityBookService()
  return service.getBinArray(params)
}
