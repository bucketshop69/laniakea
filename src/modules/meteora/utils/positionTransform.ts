import { BN } from '@coral-xyz/anchor'
import type { MeteoraUserPosition, MeteoraPool } from '../types/domain'
import type { MeteoraDisplayPosition } from '../components/manage/RemoveLiquidityPanel'
import { lamportsToAmount } from './tokenConversion'

/**
 * Transform raw Meteora positions to display format
 * Extracts position data, calculates amounts, and formats for UI
 */
export function transformPositionsToDisplayFormat(
  positions: MeteoraUserPosition[],
  pool: MeteoraPool | null,
  baseTokenDecimals: number,
  quoteTokenDecimals: number
): MeteoraDisplayPosition[] {
  return positions.map((pos) => {
    const baseAmount = lamportsToAmount(new BN(pos.positionData.totalXAmount), baseTokenDecimals)
    const quoteAmount = lamportsToAmount(new BN(pos.positionData.totalYAmount), quoteTokenDecimals)

    // Estimate total value in quote token
    const totalValue = pool?.current_price
      ? baseAmount * pool.current_price + quoteAmount
      : null

    // Get bin IDs and prices for the position
    const lowerBinId = pos.positionAccount.lowerBinId
    const upperBinId = pos.positionAccount.upperBinId
    const totalBins = pos.positionData.positionBinData.length

    // Find min and max prices from bin data
    const minPrice = pos.positionData.positionBinData.length > 0
      ? Math.min(...pos.positionData.positionBinData.map((bin: any) => bin.pricePerToken))
      : null
    const maxPrice = pos.positionData.positionBinData.length > 0
      ? Math.max(...pos.positionData.positionBinData.map((bin: any) => bin.pricePerToken))
      : null

    return {
      positionMint: pos.publicKey,
      position: pos.publicKey,
      lowerBinId,
      upperBinId,
      minPrice,
      maxPrice,
      totalBins,
      baseAmount,
      quoteAmount,
      totalValue,
    }
  })
}
