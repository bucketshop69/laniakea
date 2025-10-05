import type {
  AddLiquidityIntoPositionParams,
  RemoveMultipleLiquidityParams,
  SwapParams,
  CreatePositionParams as SDKCreatePositionParams,
} from '@saros-finance/dlmm-sdk/types/services'
import { getLiquidityBookService } from '../lib/liquidityBook'
import type { SarosCreatePoolRequest } from '../types/domain'

export const addLiquidityToSarosPosition = async (params: AddLiquidityIntoPositionParams) => {
  const service = getLiquidityBookService()
  return service.addLiquidityIntoPosition(params)
}

export const removeSarosLiquidity = async (params: RemoveMultipleLiquidityParams) => {
  const service = getLiquidityBookService()
  return service.removeMultipleLiquidity(params)
}

export const swapSaros = async (params: SwapParams) => {
  const service = getLiquidityBookService()
  return service.swap(params)
}

export const createSarosPool = async (params: SarosCreatePoolRequest) => {
  const service = getLiquidityBookService()
  return service.createPairWithConfig({
    tokenBase: {
      mintAddress: params.tokenBaseMint,
      decimal: params.tokenBaseDecimals,
    },
    tokenQuote: {
      mintAddress: params.tokenQuoteMint,
      decimal: params.tokenQuoteDecimals,
    },
    ratePrice: params.ratePrice,
    binStep: params.binStep,
    payer: params.payer,
  })
}

export const createSarosPosition = async (params: SDKCreatePositionParams) => {
  const service = getLiquidityBookService()
  return service.createPosition(params)
}
