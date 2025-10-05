import { useEffect, useRef, useState } from 'react'
import { fetchSarosOverviewChart } from '../services/pools'
import type { SarosOverviewChartPoint } from '../types/domain'

interface Options {
  enabled?: boolean
  days?: number
}

interface OverviewChartResult {
  data: SarosOverviewChartPoint[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<SarosOverviewChartPoint[] | null>
}

export const useSarosOverviewChart = ({ enabled = true, days }: Options = {}): OverviewChartResult => {
  const [data, setData] = useState<SarosOverviewChartPoint[]>([])
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    if (!enabled) {
      setData([])
      setLoading(false)
      setError(null)
      return () => {
        mountedRef.current = false
      }
    }

    setLoading(true)
    setError(null)

    void fetchSarosOverviewChart({ days })
      .then((data) => {
        if (mountedRef.current) {
          setData(data)
          setError(null)
        }
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Failed to load Saros chart data'
        if (mountedRef.current) {
          setData([])
          setError(message)
        }
      })
      .finally(() => {
        if (mountedRef.current) {
          setLoading(false)
        }
      })

    return () => {
      mountedRef.current = false
    }
  }, [enabled, days])

  const refetch = async () => {
    if (!enabled) {
      setData([])
      return null
    }

    try {
      setLoading(true)
      setError(null)
      const result = await fetchSarosOverviewChart({ days })
      setData(result)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load Saros chart data'
      setError(message)
      setData([])
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    data,
    isLoading,
    error,
    refetch,
  }
}

export default useSarosOverviewChart
