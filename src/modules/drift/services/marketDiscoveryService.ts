import {
  BASE_PRECISION,
  FUNDING_RATE_PRECISION,
  PRICE_PRECISION,
  QUOTE_PRECISION,
  PerpMarkets,
  calculateAskPrice,
  calculateBidPrice,
  calculateReservePrice,
  calculateMarketMaxAvailableInsurance,
  convertToNumber,
  type DriftClient,
  type DriftEnv,
  type MMOraclePriceData,
} from '@drift-labs/sdk'
import { BN } from '@coral-xyz/anchor'
import type { DriftMarketIdentity, DriftMarketSnapshot, DriftMarketCategory } from '../types'

const CATEGORY_ALLOW_LIST: Set<DriftMarketCategory> = new Set([
  'L1',
  'L2',
  'Infra',
  'Meme',
  'Exchange',
  'Oracle',
  'Data',
  'Prediction',
  'MEV',
  'Bridge',
  'Lending',
  'Solana',
  'Payments',
  'Dog',
  'IoT',
  'Rollup',
  'Default',
])

const normalizeCategories = (categories?: string[]): DriftMarketCategory[] => {
  if (!categories || categories.length === 0) {
    return ['Default']
  }

  return categories.map((category) => {
    const normalized = category.trim() as DriftMarketCategory
    return CATEGORY_ALLOW_LIST.has(normalized) ? normalized : 'Default'
  })
}

export const getPerpMarketIdentities = (env: DriftEnv): DriftMarketIdentity[] => {
  const configs = PerpMarkets[env] ?? []

  return configs.map((config) => ({
    env,
    marketIndex: config.marketIndex,
    symbol: config.symbol,
    baseAssetSymbol: config.baseAssetSymbol,
    fullName: config.fullName,
    categories: normalizeCategories(config.category),
    oracleAddress: config.oracle.toBase58(),
    oracleSource: Object.keys(config.oracleSource)[0] ?? 'unknown',
  }))
}

const safeConvert = (value: BN | undefined, precision: BN): number | undefined => {
  if (!value) {
    return undefined
  }
  try {
    return convertToNumber(value, precision)
  } catch (error) {
    console.error('[Drift] BN conversion error', error)
    return undefined
  }
}

const toPercent = (value: number | undefined): number | undefined => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return undefined
  }
  return value * 100
}

export const buildPerpMarketSnapshot = (
  client: DriftClient,
  marketIndex: number
): DriftMarketSnapshot | null => {
  const marketAccount = client.getPerpMarketAccount(marketIndex)
  if (!marketAccount) {
    return null
  }

  const oracleData = client.getOracleDataForPerpMarket(marketIndex)
  const mmOracleData: MMOraclePriceData = {
    ...oracleData,
    isMMOracleActive: true,
  }

  const markPrice = safeConvert(calculateReservePrice(marketAccount, mmOracleData), PRICE_PRECISION)
  const bidPrice = safeConvert(calculateBidPrice(marketAccount, mmOracleData), PRICE_PRECISION)
  const askPrice = safeConvert(calculateAskPrice(marketAccount, mmOracleData), PRICE_PRECISION)
  const oraclePrice = safeConvert(oracleData.price, PRICE_PRECISION)

  const twap = safeConvert(marketAccount.amm.lastMarkPriceTwap, PRICE_PRECISION)
  const change24hPct = twap && markPrice ? ((markPrice - twap) / twap) * 100 : undefined

  const fundingRate = safeConvert(marketAccount.amm.last24HAvgFundingRate, FUNDING_RATE_PRECISION)

  const longOi = safeConvert(marketAccount.amm.baseAssetAmountLong.abs(), BASE_PRECISION)
  const shortOi = safeConvert(marketAccount.amm.baseAssetAmountShort.abs(), BASE_PRECISION)
  const openInterest = typeof longOi === 'number' && typeof shortOi === 'number' ? longOi + shortOi : undefined

  const volume24h = safeConvert(marketAccount.amm.volume24H, QUOTE_PRECISION)

  let insuranceAvailable: number | undefined
  try {
    const insuranceBn = calculateMarketMaxAvailableInsurance(
      marketAccount,
      client.getQuoteSpotMarketAccount()
    )
    insuranceAvailable = safeConvert(insuranceBn, QUOTE_PRECISION)
  } catch (error) {
    console.warn('[Drift] Unable to compute insurance pool metrics', error)
  }

  return {
    marketIndex,
    markPrice,
    oraclePrice,
    bidPrice,
    askPrice,
    change24hPct,
    fundingRate24hPct: toPercent(fundingRate),
    openInterest,
    volume24h,
    liquidityBids: undefined,
    liquidityAsks: undefined,
    insuranceAvailable,
    lastUpdatedTs: Date.now(),
  }
}

export const buildAllPerpMarketSnapshots = (
  client: DriftClient,
  marketIndexes: number[]
): DriftMarketSnapshot[] => {
  return marketIndexes
    .map((index) => buildPerpMarketSnapshot(client, index))
    .filter((snapshot): snapshot is DriftMarketSnapshot => snapshot !== null)
}
