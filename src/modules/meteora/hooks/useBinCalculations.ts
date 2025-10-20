import { useCallback, useEffect, useMemo } from 'react'
import type { MeteoraBinLiquidityPoint } from '../services/bins'
import { getBinIdFromPrice } from '../services/positions'
import { METEORA_CONFIG } from '../constants'

/**
 * Hook to calculate bin prices, percentages, and handle bin range changes
 * Manages all bin-related calculations and initialization logic
 */
export function useBinCalculations({
  minBinId,
  maxBinId,
  binData,
  activeBinId,
  poolAddress,
  updateForm,
}: {
  minBinId: number | null
  maxBinId: number | null
  binData: MeteoraBinLiquidityPoint[]
  activeBinId: number | null
  poolAddress: string | null
  updateForm: (patch: any) => void
}) {
  // Initialize default range around active bin
  useEffect(() => {
    if (binData.length === 0 || activeBinId === null) return

    const dataMinBinId = Math.min(...binData.map(b => b.binId))
    const dataMaxBinId = Math.max(...binData.map(b => b.binId))

    // Only initialize if BOTH min and max are null (first load or pool change)
    if (minBinId === null && maxBinId === null) {
      updateForm({ minBinId: dataMinBinId, maxBinId: dataMaxBinId })
      return
    }

    // If bins are set but invalid (pool changed), reset them
    if (minBinId !== null && (minBinId < dataMinBinId || minBinId > dataMaxBinId)) {
      updateForm({ minBinId: dataMinBinId, maxBinId: dataMaxBinId })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [binData, activeBinId, minBinId, maxBinId])

  // Calculate display prices from bin IDs
  const displayMinPrice = useMemo(() => {
    if (minBinId === null || binData.length === 0) return null
    const bin = binData.find(b => b.binId === minBinId)
    return bin ? bin.pricePerToken : null
  }, [minBinId, binData])

  const displayMaxPrice = useMemo(() => {
    if (maxBinId === null || binData.length === 0) return null
    const bin = binData.find(b => b.binId === maxBinId)
    return bin ? bin.pricePerToken : null
  }, [maxBinId, binData])

  const activeBinPrice = useMemo(() => {
    if (activeBinId === null || binData.length === 0) return null
    const bin = binData.find(b => b.binId === activeBinId)
    return bin ? bin.pricePerToken : null
  }, [activeBinId, binData])

  // Calculate percentage difference from active bin price
  const minPricePercent = useMemo(() => {
    if (displayMinPrice === null || activeBinPrice === null || activeBinPrice === 0) return null
    return ((displayMinPrice - activeBinPrice) / activeBinPrice) * 100
  }, [displayMinPrice, activeBinPrice])

  const maxPricePercent = useMemo(() => {
    if (displayMaxPrice === null || activeBinPrice === null || activeBinPrice === 0) return null
    return ((displayMaxPrice - activeBinPrice) / activeBinPrice) * 100
  }, [displayMaxPrice, activeBinPrice])

  const numBins = useMemo(() => {
    if (minBinId === null || maxBinId === null || binData.length === 0) {
      return METEORA_CONFIG.DEFAULT_BIN_RANGE * 2 + 1
    }

    // Count actual bins in the selected range (handles non-contiguous bin IDs)
    return binData.filter(b => b.binId >= minBinId && b.binId <= maxBinId).length
  }, [minBinId, maxBinId, binData])

  // Handle range change from bin chart
  const handleRangeChange = useCallback((newMin: number, newMax: number) => {
    updateForm({ minBinId: newMin, maxBinId: newMax })
  }, [updateForm])

  return {
    displayMinPrice,
    displayMaxPrice,
    activeBinPrice,
    minPricePercent,
    maxPricePercent,
    numBins,
    handleRangeChange,
  }
}
