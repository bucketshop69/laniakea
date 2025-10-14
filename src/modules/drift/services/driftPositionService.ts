import type { PublicKey } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import {
  BASE_PRECISION,
  PRICE_PRECISION,
  QUOTE_PRECISION,
  MarketType,
  OrderType,
  PositionDirection,
  PostOnlyParams,
  convertToNumber,
  type OptionalOrderParams,
  type User,
} from '@drift-labs/sdk'
import { getDriftClient, getDriftEnv } from './driftClientService'
import { SpotMarkets } from '@drift-labs/sdk/lib/browser/constants/spotMarkets'
let userOrderCounter = 1
const nextUserOrderId = () => {
  userOrderCounter = (userOrderCounter % 250) + 1 // keep within u8 range (1..251)
  return userOrderCounter
}

export const checkUserExists = async (
  authority?: PublicKey,
  subAccountId?: number
): Promise<{ exists: boolean; userAccount?: PublicKey }> => {
  const client = await getDriftClient()
  const exists = client.hasUser(subAccountId, authority)
  if (!exists) return { exists }
  const userAccount = await client.getUserAccountPublicKey(subAccountId, authority)
  return { exists: true, userAccount }
}

export const initializeUserAccount = async (
  name?: string,
  subAccountId?: number
): Promise<{ txSig: string; userAccount: PublicKey }> => {
  const client = await getDriftClient()
  const [txSig, userAccount] = await client.initializeUserAccount(subAccountId, name)
  return { txSig, userAccount }
}

export const getAccountMetrics = async (marketIndex?: number) => {
  const client = await getDriftClient()
  if (!client.hasUser()) {
    return { usdcBalance: 0, freeCollateral: 0, buyingPower: null as number | null, leverage: 0 }
  }
  const user = client.getUser()

  const usdcBn = client.getQuoteAssetTokenAmount()
  const freeBn = user.getFreeCollateral()
  const levBn = user.getLeverage()

  const usdcBalance = convertToNumber(usdcBn, QUOTE_PRECISION)
  const freeCollateral = convertToNumber(freeBn, QUOTE_PRECISION)
  const leverage = levBn.toNumber() / 10_000

  let buyingPower: number | null = null
  if (typeof marketIndex === 'number') {
    const bpBn = user.getPerpBuyingPower(marketIndex)
    buyingPower = convertToNumber(bpBn, QUOTE_PRECISION)
  }

  return { usdcBalance, freeCollateral, buyingPower, leverage }
}

const toPrecisionBn = (value: number, precision: BN): BN => {
  const multiplier = precision.toNumber()
  const scaled = Math.round(value * multiplier)
  return new BN(scaled)
}

export type TradeSizeMode = 'asset' | 'usdc'
export type TradeOrderType = 'market' | 'limit'
export type TradeDirection = 'long' | 'short'

export interface TradePreviewInput {
  marketIndex: number
  direction: TradeDirection
  orderType: TradeOrderType
  size: number
  sizeMode: TradeSizeMode
  markPrice: number
  limitPrice?: number
  slippageBps?: number
}

export interface TradePreviewResult {
  params: OptionalOrderParams
  baseAssetAmount: number
  quoteAmount: number
  executionPrice: number
  limitPrice: number | null
  feeEstimate: number
  marginRequired: number
  leverageAfter: number | null
  liquidationPrice: number | null
  maxTradeSize: number | null
  warnings: string[]
}

const mapDirection = (direction: TradeDirection) =>
  direction === 'long' ? PositionDirection.LONG : PositionDirection.SHORT

const resolveTradeSize = (size: number, sizeMode: TradeSizeMode, price: number): number => {
  if (!Number.isFinite(size) || size <= 0) {
    throw new Error('Invalid trade size')
  }
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('Invalid price for trade conversion')
  }
  return sizeMode === 'asset' ? size : size / price
}

const applySlippage = (price: number, slippageBps: number, direction: TradeDirection): number => {
  const multiplier = slippageBps / 10_000
  if (direction === 'long') {
    return price * (1 + multiplier)
  }
  return price * (1 - multiplier)
}

export const previewTrade = async (input: TradePreviewInput): Promise<TradePreviewResult> => {
  const {
    marketIndex,
    direction,
    orderType,
    size,
    sizeMode,
    markPrice,
    limitPrice,
    slippageBps = 50,
  } = input

  const client = await getDriftClient()
  if (!client.hasUser()) {
    throw new Error('No Drift user account. Initialize your Drift account first.')
  }
  const user = client.getUser()

  const entryPrice = orderType === 'limit' ? limitPrice ?? markPrice : markPrice
  const baseSize = resolveTradeSize(size, sizeMode, entryPrice)
  const directionEnum = mapDirection(direction)

  const slippagePrice = orderType === 'market'
    ? applySlippage(markPrice, slippageBps, direction)
    : entryPrice

  if (!Number.isFinite(slippagePrice) || slippagePrice <= 0) {
    throw new Error('Computed price is invalid')
  }

  const baseBn = toPrecisionBn(baseSize, BASE_PRECISION)
  const executionPrice = orderType === 'market' ? slippagePrice : entryPrice
  const priceBn = toPrecisionBn(executionPrice, PRICE_PRECISION)
  const limitPriceBn = toPrecisionBn(entryPrice, PRICE_PRECISION)
  const quoteAmount = baseSize * executionPrice
  const quoteBn = toPrecisionBn(quoteAmount, QUOTE_PRECISION)

  const params: OptionalOrderParams = {
    orderType: orderType === 'market' ? OrderType.MARKET : OrderType.LIMIT,
    marketType: MarketType.PERP,
    userOrderId: nextUserOrderId(),
    direction: directionEnum,
    baseAssetAmount: baseBn,
    // For market orders, use slippage-capped execution price as protection cap
    price: orderType === 'market' ? priceBn : limitPriceBn,
    marketIndex,
    reduceOnly: false,
    postOnly: PostOnlyParams.NONE,
    bitFlags: 0,
    triggerPrice: null,
    triggerCondition: undefined,
    oraclePriceOffset: null,
    auctionDuration: null,
    maxTs: null,
    auctionStartPrice: null,
    auctionEndPrice: null,
  }

  const marginBn = user.getMarginUSDCRequiredForTrade(marketIndex, baseBn, priceBn)
  const feeBn = user.calculateFeeForQuoteAmount(quoteBn, marketIndex)
  const leverageAfterBn = user.accountLeverageRatioAfterTrade(marketIndex, MarketType.PERP, quoteBn, directionEnum)
  let liquidationPrice: number | null = null
  try {
    const liquidationBn = user.liquidationPrice(
      marketIndex,
      direction === 'long' ? baseBn : baseBn.mul(new BN(-1)),
      priceBn,
    )
    liquidationPrice = liquidationBn ? convertToNumber(liquidationBn, PRICE_PRECISION) : null
  } catch {
    liquidationPrice = null
  }

  const maxTradeResult = user.getMaxTradeSizeUSDCForPerp(marketIndex, directionEnum)
  const maxTradeSize = convertToNumber(maxTradeResult.tradeSize, QUOTE_PRECISION)

  const marginRequired = convertToNumber(marginBn, QUOTE_PRECISION)
  const feeEstimate = convertToNumber(feeBn, QUOTE_PRECISION)
  const leverageAfter = leverageAfterBn ? leverageAfterBn.toNumber() / 10_000 : null

  const freeCollateral = convertToNumber(user.getFreeCollateral(), QUOTE_PRECISION)

  const warnings: string[] = []
  if (marginRequired > freeCollateral) {
    warnings.push('Insufficient free collateral for this trade size')
  }
  if (maxTradeSize && quoteAmount > maxTradeSize) {
    warnings.push('Trade exceeds maximum allowed size for leverage constraints')
  }

  return {
    params,
    baseAssetAmount: baseSize,
    quoteAmount,
    executionPrice,
    limitPrice: orderType === 'limit' ? entryPrice : null,
    feeEstimate,
    marginRequired,
    leverageAfter,
    liquidationPrice,
    maxTradeSize,
    warnings,
  }
}

export const executeMarketPerpOrder = async (params: OptionalOrderParams) => {
  const client = await getDriftClient()
  const txSig = await client.placeAndTakePerpOrder(params)
  return txSig
}

export const executeLimitPerpOrder = async (params: OptionalOrderParams) => {
  const client = await getDriftClient()
  const txSig = await client.placePerpOrder(params)
  return txSig
}

export const closePerpPosition = async (
  marketIndex: number,
  direction: TradeDirection,
  size: number,
  executionPrice: number
) => {
  const client = await getDriftClient()
  const directionEnum = mapDirection(direction)
  const baseBn = toPrecisionBn(size, BASE_PRECISION)
  const priceBn = toPrecisionBn(executionPrice, PRICE_PRECISION)

  const params: OptionalOrderParams = {
    orderType: OrderType.MARKET,
    marketType: MarketType.PERP,
    userOrderId: nextUserOrderId(),
    direction: directionEnum,
    baseAssetAmount: baseBn,
    price: priceBn,
    marketIndex,
    reduceOnly: true,
    postOnly: PostOnlyParams.NONE,
    bitFlags: 0,
    triggerPrice: null,
    oraclePriceOffset: null,
    auctionDuration: null,
    maxTs: null,
    auctionStartPrice: null,
    auctionEndPrice: null,
  }

  return client.placeAndTakePerpOrder(params)
}

export const buildPerpOrderParams = previewTrade

export type SpotAsset = {
  symbol: string
  marketIndex: number
  mint: string
}

export const getSpotAssets = async (): Promise<SpotAsset[]> => {
  const env = getDriftEnv()
  const list = SpotMarkets[env] ?? []
  return list.map((m) => ({ symbol: m.symbol, marketIndex: m.marketIndex, mint: m.mint.toBase58() }))
}

export const depositCollateral = async (amount: number, spotMarketIndex = 0): Promise<string> => {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Invalid deposit amount')
  const client = await getDriftClient()
  const ata = await client.getAssociatedTokenAccount(spotMarketIndex)
  const amountBn = client.convertToSpotPrecision(spotMarketIndex, amount)
  const txSig = await client.deposit(amountBn, spotMarketIndex, ata)
  return txSig
}

export type PerpPositionSummary = {
  marketIndex: number
  side: 'long' | 'short'
  baseSize: number
}

export const getActivePerpPositionsSummary = async (): Promise<PerpPositionSummary[]> => {
  const client = await getDriftClient()
  if (!client.hasUser()) {
    return []
  }
  const user = client.getUser()
  const positions = user.getActivePerpPositions?.() ?? []
  return positions.map((p: any) => {
    const base = new BN(p.baseAssetAmount ?? 0)
    const baseSize = Math.abs(convertToNumber(base, BASE_PRECISION))
    const side: 'long' | 'short' = base.gt(new BN(0)) ? 'long' : 'short'
    return {
      marketIndex: p.marketIndex as number,
      side,
      baseSize,
    }
  })
}


export type SpotBalanceInfo = {
  marketIndex: number
  symbol: string
  mint: string
  decimals: number
  amount: number
}

export const getAllSpotBalances = async (): Promise<SpotBalanceInfo[]> => {
  const client = await getDriftClient()
  if (!client.hasUser()) return []
  const user = client.getUser()

  const env = getDriftEnv()
  const spotConfigs = SpotMarkets[env] ?? []
  const byIndex = new Map<number, { symbol: string; mint: string; decimals: number }>()
  spotConfigs.forEach((c) => byIndex.set(c.marketIndex,
    { symbol: c.symbol, mint: c.mint.toBase58(), decimals: c.decimals }))

  const markets = client.getSpotMarketAccounts?.() ?? []
  const result: SpotBalanceInfo[] = []
  for (const m of markets) {
    if (!m) continue
    const idx = m.marketIndex as number
    const cfg = byIndex.get(idx)
    try {
      const amtBn = user.getTokenAmount(idx)
      const precision = new BN(10).pow(new BN(m.decimals))
      const amount = convertToNumber(amtBn, precision)
      result.push({
        marketIndex: idx,
        symbol: cfg?.symbol ?? `spot#${idx}`,
        mint: cfg?.mint ?? m.mint?.toBase58?.() ?? 'unknown',
        decimals: cfg?.decimals ?? m.decimals ?? 0,
        amount,
      })
    } catch (e) {
      console.warn('[SpotDebug] failed reading balance for market', idx, e)
    }
  }
  return result
}
