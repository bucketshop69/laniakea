import { LiquidityBookServices, MODE, type ILiquidityBookConfig } from '@saros-finance/dlmm-sdk'
import { getSolanaEndpoint } from '@/lib/solanaConnection'

const DEFAULT_RPC_ENDPOINT = getSolanaEndpoint()

const DEFAULT_CONFIG: ILiquidityBookConfig = {
  mode: MODE.MAINNET,
  options: {
    rpcUrl: DEFAULT_RPC_ENDPOINT,
  },
}

let sharedClient: LiquidityBookServices | null = null

export const getSdkClient = (config?: ILiquidityBookConfig) => {
  if (config) {
    return new LiquidityBookServices(config)
  }

  if (!sharedClient) {
    sharedClient = new LiquidityBookServices(DEFAULT_CONFIG)
  }

  return sharedClient
}

export const resetSdkClient = () => {
  sharedClient = null
}

export const sdkClientConfig = Object.freeze({
  DEFAULT_RPC_ENDPOINT,
  DEFAULT_CONFIG,
})
