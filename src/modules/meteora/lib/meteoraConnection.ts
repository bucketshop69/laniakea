import { getSolanaConnection } from '@/lib/solanaConnection'

/**
 * Get the shared Solana connection for Meteora operations
 * Reuses the global connection singleton
 */
export const getMeteoraConnection = () => {
  return getSolanaConnection()
}
