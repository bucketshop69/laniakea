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
