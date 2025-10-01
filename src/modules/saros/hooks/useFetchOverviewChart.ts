import { useEffect, useRef, useState } from 'react'
import { fetchSarosOverviewChart, type SarosOverviewChartPoint } from '../services/poolService'

type ChartState = {
  data: SarosOverviewChartPoint[]
  isLoading: boolean
  error: string | null
}

interface Options {
  enabled?: boolean
  days?: number
}

export const useFetchOverviewChart = ({ enabled = true, days }: Options = {}) => {
  const [state, setState] = useState<ChartState>({ data: [], isLoading: false, error: null })
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    if (!enabled) {
      setState({ data: [], isLoading: false, error: null })
      return () => {
        mountedRef.current = false
      }
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    void fetchSarosOverviewChart({ days })
      .then((data) => {
        if (mountedRef.current) {
          setState({ data, isLoading: false, error: null })
        }
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Failed to load Saros chart data'
        if (mountedRef.current) {
          setState({ data: [], isLoading: false, error: message })
        }
      })

    return () => {
      mountedRef.current = false
    }
  }, [enabled, days])

  return state
}

export default useFetchOverviewChart
