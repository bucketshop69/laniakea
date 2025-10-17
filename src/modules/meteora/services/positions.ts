import { PublicKey } from '@solana/web3.js'
import { getDLMMPool } from './dlmmClient'
import type { MeteoraUserPosition, MeteoraActiveBin } from '../types/domain'

/**
 * Get active bin information for a pool
 * @param poolAddress - The pool's public key address
 * @returns Active bin data
 */
export async function getActiveBin(poolAddress: string): Promise<MeteoraActiveBin> {
  const dlmmPool = await getDLMMPool(poolAddress)
  const activeBin = await dlmmPool.getActiveBin()

  return {
    binId: activeBin.binId,
    price: activeBin.price,
    pricePerToken: dlmmPool.fromPricePerLamport(Number(activeBin.price)),
  }
}

/**
 * Get all user positions for a specific pool
 * @param userPublicKey - User's wallet public key
 * @param poolAddress - The pool's public key address
 * @returns Array of user positions
 */
export async function getUserPositions(
  userPublicKey: string,
  poolAddress: string
): Promise<MeteoraUserPosition[]> {
  const dlmmPool = await getDLMMPool(poolAddress)
  const userPubKey = new PublicKey(userPublicKey)

  const { userPositions } = await dlmmPool.getPositionsByUserAndLbPair(userPubKey)

  if (!userPositions || userPositions.length === 0) {
    return []
  }

  // Map SDK positions to our domain types
  return userPositions.map((position: any) => ({
    publicKey: position.publicKey.toString(),
    positionAccount: {
      lowerBinId: position.positionData.lowerBinId || 0,
      upperBinId: position.positionData.upperBinId || 0,
      lastUpdatedAt: position.positionData.lastUpdatedAt || 0,
      totalClaimedFeeXAmount: position.positionData.totalClaimedFeeXAmount?.toString() || '0',
      totalClaimedFeeYAmount: position.positionData.totalClaimedFeeYAmount?.toString() || '0',
      totalClaimedRewardXAmount: '0',
      totalClaimedRewardYAmount: '0',
    },
    positionData: {
      positionBinData: position.positionData.positionBinData || [],
      totalXAmount: position.positionData.totalXAmount?.toString() || '0',
      totalYAmount: position.positionData.totalYAmount?.toString() || '0',
      feeX: position.positionData.feeX?.toString() || '0',
      feeY: position.positionData.feeY?.toString() || '0',
      rewardOne: '0',
      rewardTwo: '0',
    },
  }))
}

/**
 * Get price from bin ID
 * @param poolAddress - The pool's public key address
 * @param binId - The bin ID
 * @returns Price as number
 */
export async function getPriceFromBinId(
  poolAddress: string,
  binId: number
): Promise<number> {
  const dlmmPool = await getDLMMPool(poolAddress)
  const price = dlmmPool.getPriceOfBinByBinId(binId)
  return dlmmPool.fromPricePerLamport(Number(price))
}

/**
 * Get bin ID from price
 * @param poolAddress - The pool's public key address
 * @param price - The price
 * @param roundDown - Whether to round down
 * @returns Bin ID
 */
export async function getBinIdFromPrice(
  poolAddress: string,
  price: number,
  roundDown: boolean = true
): Promise<number> {
  const dlmmPool = await getDLMMPool(poolAddress)
  return dlmmPool.getBinIdFromPrice(price, roundDown)
}
