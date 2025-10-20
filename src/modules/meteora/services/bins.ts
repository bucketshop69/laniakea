import { getDLMMPool } from './dlmmClient'

export interface MeteoraBinLiquidityPoint {
  binId: number
  price: number
  pricePerToken: number
  reserveX: number
  reserveY: number
  liquidity: number
}

export interface FetchBinDistributionParams {
  poolAddress: string
  activeBin: number
  range?: number
}

export interface BinDistributionResult {
  bins: MeteoraBinLiquidityPoint[]
  activeBinId: number
}

/**
 * Fetch bin distribution around the active bin
 * Uses the SDK's efficient getBinsAroundActiveBin method
 * @param params - Bin distribution fetch parameters
 * @returns Array of bin liquidity points
 */
export async function fetchMeteoraBinDistribution(
  params: FetchBinDistributionParams
): Promise<BinDistributionResult> {
  const { poolAddress, activeBin, range = 33 } = params

  const dlmmPool = await getDLMMPool(poolAddress)

  try {

    // Use the range parameter passed from the hook (default 33)
    const result = await dlmmPool.getBinsAroundActiveBin(range, range)




    // Transform SDK bins to our format
    const bins: MeteoraBinLiquidityPoint[] = result.bins.map((bin: any, index: number) => {
      const pricePerToken = Number(bin.pricePerToken)

      // Convert from BN to numbers with proper decimals
      const tokenXDecimals = dlmmPool.tokenX?.mint?.decimals
      const tokenYDecimals = dlmmPool.tokenY?.mint?.decimals

      const reserveX = Number(bin.xAmount?.toString() || '0') / Math.pow(10, tokenXDecimals ?? 9)
      const reserveY = Number(bin.yAmount?.toString() || '0') / Math.pow(10, tokenYDecimals ?? 9)

      // Calculate total liquidity value in quote token terms
      // reserveX is valued at current bin price, reserveY is already in quote token
      const liquidityValue = (reserveX * pricePerToken) + reserveY

      const processedBin = {
        binId: bin.binId,
        price: Number(bin.price),
        pricePerToken,
        reserveX,
        reserveY,
        liquidity: liquidityValue,
      }

      return processedBin
    })

    return {
      bins,
      activeBinId: result.activeBin, // Return the active bin from SDK
    }
  } catch (error) {
    console.error('[Meteora Bins] Failed to fetch bin distribution', error)
    throw error
  }
}
