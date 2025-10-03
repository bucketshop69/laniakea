import { LiquidityBookServices, MODE, type ILiquidityBookConfig } from '@saros-finance/dlmm-sdk'
import { getSolanaEndpoint } from '@/lib/solanaConnection'

const DEFAULT_RPC_ENDPOINT = getSolanaEndpoint()

const DEFAULT_CONFIG: ILiquidityBookConfig = {
  mode: MODE.MAINNET,
  options: {
    rpcUrl: DEFAULT_RPC_ENDPOINT,
  },
}

let sharedService: LiquidityBookServices | null = null

export const getLiquidityBookService = (config?: ILiquidityBookConfig) => {
  if (config) {
    return new LiquidityBookServices(config)
  }

  if (!sharedService) {
    sharedService = new LiquidityBookServices(DEFAULT_CONFIG)
  }

  return sharedService
}

export const resetLiquidityBookService = () => {
  sharedService = null
}

export const liquidityBookConfig = Object.freeze({
  DEFAULT_RPC_ENDPOINT,
  DEFAULT_CONFIG,
})

export type { LiquidityBookServices }
