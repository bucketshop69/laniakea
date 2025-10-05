import { useEffect, useMemo, useState } from 'react'
import type { PoolMetadata } from '@saros-finance/dlmm-sdk/types/config'
import { fetchSarosPoolMetadata } from '../services/pools'
import type { SarosPoolMetadataSnapshot } from '../types/domain'
import { useSarosStore } from '../state'

interface Options {
  enabled?: boolean
  poolAddress?: string
}

interface PoolMetadataResult {
  metadata: PoolMetadata | null
  snapshot: SarosPoolMetadataSnapshot | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<SarosPoolMetadataSnapshot | null>
}

export const useSarosPoolMetadata = ({ poolAddress, enabled = true }: Options = {}): PoolMetadataResult => {
  const cachedSnapshot = useSarosStore((state) => (poolAddress ? state.metadataByPool[poolAddress] ?? null : null))
  const upsertPoolMetadata = useSarosStore((state) => state.upsertPoolMetadata)
  const [snapshot, setSnapshot] = useState<SarosPoolMetadataSnapshot | null>(cachedSnapshot ?? null)
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cachedSnapshot) {
      setSnapshot(cachedSnapshot)
    }
  }, [cachedSnapshot])

  useEffect(() => {
    if (!enabled || !poolAddress) {
      setSnapshot(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchSarosPoolMetadata(poolAddress)
        if (!cancelled) {
          setSnapshot(result)
          upsertPoolMetadata(result)
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load pool metadata'
          setError(message)
          setSnapshot(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [poolAddress, enabled, upsertPoolMetadata])

  const refetch = async () => {
    if (!poolAddress || !enabled) {
      setSnapshot(null)
      return null
    }

    try {
      setLoading(true)
      setError(null)
      const result = await fetchSarosPoolMetadata(poolAddress)
      setSnapshot(result)
      upsertPoolMetadata(result)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load pool metadata'
      setError(message)
      setSnapshot(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  const metadata = useMemo(() => snapshot?.raw ?? null, [snapshot])

  return {
    metadata,
    snapshot,
    isLoading,
    error,
    refetch,
  }
}

export default useSarosPoolMetadata
