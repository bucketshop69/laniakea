import { useEffect, useState } from 'react'
import { getActiveBin } from '../services/positions'
import { useMeteoraBinDistribution } from './useFetchBinDistribution'
import { METEORA_CONFIG } from '../constants'

/**
 * Hook to fetch and manage active bin and bin distribution data
 * Fetches initial active bin, then uses it to initialize bin distribution hook
 */
export function useActiveBin(poolAddress: string | null) {
  // First fetch active bin for the pool (needed to initialize the bin distribution hook)
  const [initialActiveBinId, setInitialActiveBinId] = useState<number | null>(null)
  
  useEffect(() => {
    if (!poolAddress) {
      setInitialActiveBinId(null)
      return
    }

    let cancelled = false

    getActiveBin(poolAddress)
      .then((activeBin) => {
        if (!cancelled) {
          setInitialActiveBinId(activeBin.binId)
        }
      })
      .catch((error) => {
        console.error('[Meteora Manage] Failed to fetch initial active bin', error)
        if (!cancelled) {
          setInitialActiveBinId(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [poolAddress])

  // Fetch bin distribution - this returns the active bin from SDK, so we use that instead of a separate call
  const {
    data: binData,
    activeBinId: activeBinFromSDK,
    isLoading: binLoading,
  } = useMeteoraBinDistribution({
    poolAddress: poolAddress ?? undefined,
    activeBin: initialActiveBinId ?? undefined,
    range: METEORA_CONFIG.DEFAULT_BIN_RANGE,
    enabled: Boolean(poolAddress && initialActiveBinId !== null),
  })

  // Use the active bin ID from the SDK response (more efficient than separate call)
  const activeBinId = activeBinFromSDK ?? initialActiveBinId

  return {
    initialActiveBinId,
    activeBinId,
    binData,
    binLoading,
  }
}
