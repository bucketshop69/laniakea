import { PublicKey } from '@solana/web3.js'
import type { PoolMetadata } from '@saros-finance/dlmm-sdk/types/config'
import type {
  AddLiquidityIntoPositionParams,
  GetBinArrayParams,
  GetBinsArrayInfoParams,
  GetBinsReserveParams,
  GetTokenOutputResponse,
  RemoveMultipleLiquidityParams,
  SwapParams,
} from '@saros-finance/dlmm-sdk/types/services'
import { BIN_ARRAY_SIZE } from '@saros-finance/dlmm-sdk/constants'
import { getPriceFromId } from '@saros-finance/dlmm-sdk/utils/price'
import { getLiquidityBookService } from '../lib/liquidityBook'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const withRetries = async <T>(fn: () => Promise<T>, retries = 2, delay = 500): Promise<T> => {
  try {
    return await fn()
  } catch (error) {
    if (retries <= 0) {
      throw error
    }
    await sleep(delay)
    return withRetries(fn, retries - 1, delay * 2)
  }
}

const metadataCache = new Map<string, { timestamp: number; promise: Promise<PoolMetadata> }>()
const METADATA_CACHE_TTL = 30_000

export type SarosOverviewChartPoint = {
  date: string
  liquidity: number
  volume: number
  cumulativeVolume: number
}

export type SarosBinLiquidityPoint = {
  binId: number
  price: number
  reserveBase: number
  reserveQuote: number
  totalSupply: number
}

const SAROS_OVERVIEW_CHART_ENDPOINT = 'https://api.saros.xyz/api/dex-v3/pool/overview/chart'
const overviewChartCache = new Map<string, { timestamp: number; promise: Promise<SarosOverviewChartPoint[]> }>()
const OVERVIEW_CHART_CACHE_TTL = 60_000
const DEFAULT_CHART_DAYS = 30

export const fetchSarosPoolMetadata = async (pairAddress: string) => {
  const service = getLiquidityBookService()
  const now = Date.now()
  const cached = metadataCache.get(pairAddress)
  if (cached && now - cached.timestamp < METADATA_CACHE_TTL) {
    return cached.promise
  }

  const pending = withRetries(() => service.fetchPoolMetadata(pairAddress)).then((result) => {
    metadataCache.set(pairAddress, { timestamp: Date.now(), promise: Promise.resolve(result) })
    return result
  })

  metadataCache.set(pairAddress, { timestamp: now, promise: pending })
  return pending
}

export const fetchSarosOverviewChart = async (params?: { days?: number }) => {
  const days = params?.days ?? DEFAULT_CHART_DAYS
  const targetStart = new Date()
  targetStart.setUTCHours(0, 0, 0, 0)
  targetStart.setUTCDate(targetStart.getUTCDate() - days)
  const startTime = targetStart.getTime()
  const key = `${startTime}`
  const now = Date.now()
  const cached = overviewChartCache.get(key)
  if (cached && now - cached.timestamp < OVERVIEW_CHART_CACHE_TTL) {
    return cached.promise
  }

  const searchParams = new URLSearchParams()
  searchParams.set('startTime', key)

  const pending = withRetries(async () => {
    const response = await fetch(`${SAROS_OVERVIEW_CHART_ENDPOINT}?${searchParams.toString()}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch Saros overview chart: ${response.status}`)
    }
    const payload = await response.json() as { data?: unknown }
    const entries = Array.isArray(payload?.data) ? payload.data : []
    const toNumber = (value: unknown) => {
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : Number.NaN
      }
      if (typeof value === 'string') {
        const parsed = Number.parseFloat(value)
        return Number.isFinite(parsed) ? parsed : Number.NaN
      }
      return Number.NaN
    }
    return (entries as any[]).reduce<SarosOverviewChartPoint[]>((acc, entry) => {
      const date = typeof entry?.date === 'string' ? entry.date : null
      const liquidity = toNumber(entry?.liquidity)
      const volume = toNumber(entry?.volume)
      const cumulativeVolume = toNumber(entry?.cumulativeVolume)
      if (!date || Number.isNaN(liquidity) || Number.isNaN(volume) || Number.isNaN(cumulativeVolume)) {
        return acc
      }
      acc.push({
        date,
        liquidity,
        volume,
        cumulativeVolume,
      })
      return acc
    }, [])
  }).then((result) => {
    overviewChartCache.set(key, { timestamp: Date.now(), promise: Promise.resolve(result) })
    return result
  })

  overviewChartCache.set(key, { timestamp: now, promise: pending })
  return pending
}

export const quoteSarosPool = async (
  metadata: PoolMetadata,
  amount: number,
  optional: { isExactInput: boolean; swapForY: boolean; slippage: number }
): Promise<GetTokenOutputResponse> => {
  const service = getLiquidityBookService()
  return withRetries(() => service.quote({
    amount,
    metadata,
    optional,
  }))
}

export const getSarosPairAccount = async (pairAddress: string) => {
  const service = getLiquidityBookService()
  return service.getPairAccount(new PublicKey(pairAddress))
}

export const getSarosUserPositions = async (payer: string, pairAddress: string) => {
  const service = getLiquidityBookService()
  return service.getUserPositions({ payer: new PublicKey(payer), pair: new PublicKey(pairAddress) })
}

export const getSarosBinsReserveInformation = async (params: GetBinsReserveParams) => {
  const service = getLiquidityBookService()
  return service.getBinsReserveInformation(params)
}

export const getSarosBinArrayInfo = async (params: GetBinsArrayInfoParams) => {
  const service = getLiquidityBookService()
  return service.getBinArrayInfo(params)
}

export const getSarosBinArray = async (params: GetBinArrayParams) => {
  const service = getLiquidityBookService()
  return service.getBinArray(params)
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
  const sanitizedRange = Math.max(1, range)
  const lowerBin = Math.max(0, activeBin - sanitizedRange)
  const upperBin = activeBin + sanitizedRange

  const lowerIndex = Math.floor(lowerBin / BIN_ARRAY_SIZE)
  const upperIndex = Math.floor(upperBin / BIN_ARRAY_SIZE)

  const binArrayIndices = Array.from({ length: upperIndex - lowerIndex + 1 }, (_, index) => lowerIndex + index)

  const binArrays = await Promise.all(
    binArrayIndices.map((binArrayIndex) => withRetries(() => getSarosBinArrayInfo({
      binArrayIndex,
      pair: pairKey,
      payer: DUMMY_PAYER,
    }) as Promise<{ bins: RawBin[]; resultIndex: number }>))
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
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0
    }
    if (typeof value === 'bigint') {
      return Number(value)
    }
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
        price: getPriceFromId(binStep, binId, baseDecimals, quoteDecimals),
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
      price: getPriceFromId(binStep, binId, baseDecimals, quoteDecimals),
      reserveBase: rawReserveX / baseScale,
      reserveQuote: rawReserveY / quoteScale,
      totalSupply: rawTotalSupply,
    })
  }

  return points
}

export const addLiquidityToSarosPosition = async (params: AddLiquidityIntoPositionParams) => {
  const service = getLiquidityBookService()
  return service.addLiquidityIntoPosition(params)
}

export const removeSarosLiquidity = async (params: RemoveMultipleLiquidityParams) => {
  const service = getLiquidityBookService()
  return service.removeMultipleLiquidity(params)
}

export const swapSaros = async (params: SwapParams) => {
  const service = getLiquidityBookService()
  return service.swap(params)
}

export type CreatePoolParams = {
  tokenBaseMint: string
  tokenBaseDecimals: number
  tokenQuoteMint: string
  tokenQuoteDecimals: number
  ratePrice: number
  binStep: number
  payer: PublicKey
}

export const createSarosPool = async (params: CreatePoolParams) => {
  const service = getLiquidityBookService()
  return service.createPairWithConfig({
    tokenBase: {
      mintAddress: params.tokenBaseMint,
      decimal: params.tokenBaseDecimals,
    },
    tokenQuote: {
      mintAddress: params.tokenQuoteMint,
      decimal: params.tokenQuoteDecimals,
    },
    ratePrice: params.ratePrice,
    binStep: params.binStep,
    payer: params.payer,
  })
}
