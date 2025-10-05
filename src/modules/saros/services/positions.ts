import { PublicKey } from '@solana/web3.js'
import type { GetBinsReserveParams, UserPositionsParams } from '@saros-finance/dlmm-sdk/types/services'
import { getLiquidityBookService } from '../lib/liquidityBook'
import { withRetries } from './shared'

export const getSarosUserPositions = async (payer: string, pairAddress: string) => {
  const service = getLiquidityBookService()
  const params: UserPositionsParams = {
    payer: new PublicKey(payer),
    pair: new PublicKey(pairAddress),
  }

  return withRetries(() => service.getUserPositions(params))
}

export const getSarosBinsReserveInformation = async (params: GetBinsReserveParams) => {
  const service = getLiquidityBookService()
  return withRetries(() => service.getBinsReserveInformation(params))
}
