import { PublicKey } from '@solana/web3.js'
import DLMM from '@meteora-ag/dlmm'
import { getSolanaConnection } from '@/lib/solanaConnection'
import type {
  MeteoraProfilePoolGroup,
  MeteoraProfilePosition,
  MeteoraPortfolioStats
} from '../types/domain'

/**
 * Get all user positions across all Meteora DLMM pools
 * @param userPublicKey - User's wallet public key
 * @returns Array of pool groups with positions
 */
export async function getAllUserPositions(
  userPublicKey: string
): Promise<MeteoraProfilePoolGroup[]> {
  const connection = getSolanaConnection()
  const userPubKey = new PublicKey(userPublicKey)

  // Fetch all positions across all pools
  const positionsMap = await DLMM.getAllLbPairPositionsByUser(connection, userPubKey)

  const poolGroups: MeteoraProfilePoolGroup[] = []

  // Iterate through each pool
  for (const [poolAddress, positionInfo] of positionsMap.entries()) {
    const { lbPair, tokenX, tokenY, lbPairPositionsData } = positionInfo
    console.log(positionInfo);

    // Skip if no positions
    if (!lbPairPositionsData || lbPairPositionsData.length === 0) {
      continue
    }

    const positions: MeteoraProfilePosition[] = []

    // Map each position to our domain type
    for (const lbPosition of lbPairPositionsData) {
      const positionData = lbPosition.positionData

      // Calculate token amounts (convert from lamports)
      const tokenXAmount = Number(positionData.totalXAmount) / Math.pow(10, tokenX.mint.decimals)
      const tokenYAmount = Number(positionData.totalYAmount) / Math.pow(10, tokenY.mint.decimals)

      // Calculate unclaimed fees
      const unclaimedFeeX = Number(positionData.feeX) / Math.pow(10, tokenX.mint.decimals)
      const unclaimedFeeY = Number(positionData.feeY) / Math.pow(10, tokenY.mint.decimals)

      // Get price range from bin IDs
      const lowerBinId = positionData.lowerBinId
      const upperBinId = positionData.upperBinId
      const totalBins = upperBinId - lowerBinId + 1

      // Get prices directly from positionBinData
      let minPrice: number | null = null
      let maxPrice: number | null = null

      if (positionData.positionBinData && positionData.positionBinData.length > 0) {
        // Min price is at first index (lowest bin)
        minPrice = Number(positionData.positionBinData[0].pricePerToken)
        // Max price is at last index (highest bin)
        maxPrice = Number(positionData.positionBinData[positionData.positionBinData.length - 1].pricePerToken)
      }

      // Calculate price - use bin prices if available, otherwise estimate from reserves
      let currentPrice: number | null = null

      if (minPrice !== null && maxPrice !== null) {
        // Use average of bin prices
        currentPrice = (minPrice + maxPrice) / 2
      } else {
        // Fallback: estimate price from reserve ratio
        try {
          const reserveXAmount = Number(tokenX.amount)
          const reserveYAmount = Number(tokenY.amount)

          if (reserveXAmount > 0 && reserveYAmount > 0) {
            // Price = reserveY / reserveX (adjusted for decimals)
            const decimalsAdjustment = Math.pow(10, tokenY.mint.decimals - tokenX.mint.decimals)
            currentPrice = (reserveYAmount / reserveXAmount) * decimalsAdjustment
          }
        } catch (error) {
          console.warn('Failed to estimate price from reserves:', error)
        }
      }

      // Calculate total value (in terms of quote token Y)
      let totalValue: number | null = null
      if (currentPrice !== null && currentPrice > 0) {
        totalValue = tokenXAmount * currentPrice + tokenYAmount
      }

      // Calculate unclaimed fee values
      let unclaimedFeeXValue: number | null = null
      let unclaimedFeeYValue: number | null = null
      if (currentPrice !== null && currentPrice > 0) {
        unclaimedFeeXValue = unclaimedFeeX * currentPrice
        unclaimedFeeYValue = unclaimedFeeY
      }

      positions.push({
        positionMint: lbPosition.publicKey.toString(),
        poolAddress,
        poolName: `${tokenX.publicKey.toString().slice(0, 4)}-${tokenY.publicKey.toString().slice(0, 4)}`,
        tokenXSymbol: 'Token X', // TODO: Get from token metadata
        tokenYSymbol: 'Token Y', // TODO: Get from token metadata
        tokenXDecimals: tokenX.mint.decimals,
        tokenYDecimals: tokenY.mint.decimals,
        tokenXAmount,
        tokenYAmount,
        lowerBinId,
        upperBinId,
        minPrice,
        maxPrice,
        totalBins,
        unclaimedFeeX,
        unclaimedFeeY,
        unclaimedFeeXValue,
        unclaimedFeeYValue,
        totalValue,
      })
    }

    poolGroups.push({
      poolAddress,
      poolName: `${tokenX.publicKey.toString().slice(0, 4)}-${tokenY.publicKey.toString().slice(0, 4)}`,
      tokenXMint: tokenX.publicKey.toString(),
      tokenYMint: tokenY.publicKey.toString(),
      tokenXSymbol: 'Token X', // TODO: Get from token metadata
      tokenYSymbol: 'Token Y', // TODO: Get from token metadata
      apy: lbPair.rewardInfos[0]?.feeApr ?? 0, // TODO: Calculate proper APY
      tvl: 0, // TODO: Get from API or calculate
      binStep: lbPair.binStep,
      positions,
    })
  }

  return poolGroups
}

/**
 * Calculate portfolio statistics from pool groups
 * @param poolGroups - Array of pool groups with positions
 * @returns Portfolio statistics
 */
export function calculatePortfolioStats(
  poolGroups: MeteoraProfilePoolGroup[]
): MeteoraPortfolioStats {
  let totalValue = 0
  let totalPositions = 0
  let totalUnclaimedFees = 0

  for (const poolGroup of poolGroups) {
    totalPositions += poolGroup.positions.length

    for (const position of poolGroup.positions) {
      if (position.totalValue !== null) {
        totalValue += position.totalValue
      }

      if (position.unclaimedFeeXValue !== null) {
        totalUnclaimedFees += position.unclaimedFeeXValue
      }
      if (position.unclaimedFeeYValue !== null) {
        totalUnclaimedFees += position.unclaimedFeeYValue
      }
    }
  }

  return {
    totalValue,
    totalPositions,
    totalPools: poolGroups.length,
    totalUnclaimedFees,
  }
}
