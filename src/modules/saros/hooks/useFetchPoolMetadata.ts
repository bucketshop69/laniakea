import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LiquidityBookServices, MODE } from '@saros-finance/dlmm-sdk'
import type { PoolMetadata } from '@saros-finance/dlmm-sdk/types/config'
import type { GetTokenOutputResponse } from '@saros-finance/dlmm-sdk/types/services'

type FetchState = {
  metadata: PoolMetadata | null
  quote: GetTokenOutputResponse | null
  price: string | null
  isLoading: boolean
  error: string | null
}

let cachedService: LiquidityBookServices | null = null

const getService = () => {
  if (!cachedService) {
    const SOLANA_RPC_ENDPOINT = "https://mainnet.helius-rpc.com/?api-key=dbf616dd-1870-4cdb-a0d2-754ae58a64f0"
    cachedService = new LiquidityBookServices({
      mode: MODE.MAINNET,
      options: { rpcUrl: SOLANA_RPC_ENDPOINT }
    })
  }
  return cachedService
}

export const useFetchPoolMetadata = (poolAddress?: string) => {
  const [state, setState] = useState<FetchState>({ metadata: null, quote: null, price: null, isLoading: false, error: null })
  const mountedRef = useRef(true)

  const service = useMemo(() => getService(), [])

  const fetchMetadata = useCallback(
    async (address?: string) => {
      const target = address ?? poolAddress
      if (!target) {
        if (!mountedRef.current) {
          return null
        }
        setState({ metadata: null, quote: null, price: null, isLoading: false, error: null })
        return null
      }

      if (mountedRef.current) {
        setState((prev) => ({ ...prev, isLoading: true, error: null }))
      }

      try {
        const response = await service.fetchPoolMetadata(target)
        let quote: GetTokenOutputResponse | null = null
        let price: string | null = null
        let errorMessage: string | null = null

        try {
          const amount = Math.pow(10, response.extra.tokenBaseDecimal)
          quote = await service.quote({
            amount,
            metadata: response,
            optional: {
              isExactInput: true,
              swapForY: true,
              slippage: 0,
            },
          })

          const amountOut = Number(quote.amountOut)
          const denominator = Math.pow(10, response.extra.tokenQuoteDecimal)
          price = (amountOut / denominator).toString()
        } catch (quoteError) {
          errorMessage = quoteError instanceof Error ? quoteError.message : 'Failed to compute quote'
          console.warn('Failed to compute Saros quote', quoteError)
        }

        if (mountedRef.current) {
          setState({ metadata: response, quote, price, isLoading: false, error: errorMessage })
        }
        return response
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load pool metadata'
        if (mountedRef.current) {
          setState({ metadata: null, quote: null, price: null, isLoading: false, error: message })
        }
        return null
      }
    },
    [poolAddress, service]
  )

  useEffect(() => {
    mountedRef.current = true
    if (!poolAddress) {
      setState({ metadata: null, quote: null, price: null, isLoading: false, error: null })
    } else {
      void fetchMetadata(poolAddress)
    }

    return () => {
      mountedRef.current = false
    }
  }, [poolAddress, fetchMetadata])

  return {
    metadata: state.metadata,
    quote: state.quote,
    price: state.price,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchMetadata,
  }
}

export default useFetchPoolMetadata
