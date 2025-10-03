import { Connection, clusterApiUrl } from '@solana/web3.js'

export const resolveSolanaEndpoint = () => {
  const envEndpoint = (import.meta.env.VITE_SOLANA_RPC_ENDPOINT ?? import.meta.env.SOLANA_RPC_ENDPOINT ?? '').trim()

  if (envEndpoint.length > 0) {
    return envEndpoint
  }

  console.warn('[Solana] RPC endpoint env not set. Falling back to clusterApiUrl(mainnet-beta).')
  return clusterApiUrl('mainnet-beta')
}

const SOLANA_ENDPOINT = resolveSolanaEndpoint()

let sharedConnection: Connection | null = null

export const getSolanaConnection = () => {
  if (!sharedConnection) {
    sharedConnection = new Connection(SOLANA_ENDPOINT, 'confirmed')
  }

  return sharedConnection
}

export const getSolanaEndpoint = () => SOLANA_ENDPOINT
