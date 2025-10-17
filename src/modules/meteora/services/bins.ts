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

/**
 * Fetch bin distribution around the active bin
 * Uses the SDK's efficient getBinsAroundActiveBin method
 * @param params - Bin distribution fetch parameters
 * @returns Array of bin liquidity points
 */
export async function fetchMeteoraBinDistribution(
  params: FetchBinDistributionParams
): Promise<MeteoraBinLiquidityPoint[]> {
  const { poolAddress, activeBin, range = 50 } = params

  const dlmmPool = await getDLMMPool(poolAddress)

  console.log('[Meteora Bins] Fetching bin distribution', {
    poolAddress,
    activeBin,
    range,
  })

  try {
    // Use SDK's efficient method to get bins around active bin
    const result = await dlmmPool.getBinsAroundActiveBin(range, range)

    console.log('[Meteora Bins] Fetched bins from SDK', {
      activeBin: result.activeBin,
      totalBins: result.bins.length,
    })

    // Transform SDK bins to our format
    const bins: MeteoraBinLiquidityPoint[] = result.bins.map((bin: any) => {
      // The bin object from getBinsAroundActiveBin contains:
      // - binId: number
      // - price: string (the price as a lamport value)
      // - pricePerToken: number (the human-readable price)
      // - xAmount: BN
      // - yAmount: BN

      const pricePerToken = bin.pricePerToken || dlmmPool.fromPricePerLamport(Number(bin.price))

      // Convert from BN to numbers with proper decimals
      const tokenXDecimals = dlmmPool.tokenX?.decimal || 9
      const tokenYDecimals = dlmmPool.tokenY?.decimal || 6

      const reserveX = Number(bin.xAmount?.toString() || '0') / Math.pow(10, tokenXDecimals)
      const reserveY = Number(bin.yAmount?.toString() || '0') / Math.pow(10, tokenYDecimals)

      // Calculate total liquidity value in quote token terms
      // reserveX is valued at current bin price, reserveY is already in quote token
      const liquidityValue = (reserveX * pricePerToken) + reserveY

      return {
        binId: bin.binId,
        price: Number(bin.price),
        pricePerToken,
        reserveX,
        reserveY,
        liquidity: liquidityValue,
      }
    })

    // Count bins with each type of liquidity for debugging
    const binsWithX = bins.filter(b => b.reserveX > 0).length
    const binsWithY = bins.filter(b => b.reserveY > 0).length
    const binsWithBoth = bins.filter(b => b.reserveX > 0 && b.reserveY > 0).length

    console.log('[Meteora Bins] Processed bins', {
      totalBins: bins.length,
      minBinId: bins[0]?.binId,
      maxBinId: bins[bins.length - 1]?.binId,
      binsWithX,
      binsWithY,
      binsWithBoth,
      sampleBin: bins[0],
      activeBinSample: bins.find(b => b.binId === activeBin),
    })

    return bins
  } catch (error) {
    console.error('[Meteora Bins] Failed to fetch bin distribution', error)
    throw error
  }
}
