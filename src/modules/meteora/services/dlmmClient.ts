import DLMM from '@meteora-ag/dlmm'
import { PublicKey } from '@solana/web3.js'
import { getMeteoraConnection } from '../lib/meteoraConnection'
import type { MeteoraDLMMPoolCache } from '../types/domain'

// Cache DLMM pool instances to avoid recreating them
const poolCache = new Map<string, MeteoraDLMMPoolCache>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get or create a DLMM pool instance
 * @param poolAddress - The pool's public key address
 * @returns DLMM instance
 */
export async function getDLMMPool(poolAddress: string): Promise<any> {
  const connection = getMeteoraConnection()

  // Check cache
  const cached = poolCache.get(poolAddress)
  if (cached && Date.now() - cached.createdAt < CACHE_TTL) {
    return cached.instance
  }

  // Create new instance
  const poolPublicKey = new PublicKey(poolAddress)
  const dlmmPool = await DLMM.create(connection, poolPublicKey)

  // Store in cache
  poolCache.set(poolAddress, {
    address: poolAddress,
    instance: dlmmPool,
    createdAt: Date.now(),
  })

  return dlmmPool
}

/**
 * Clear the cache for a specific pool or all pools
 * @param poolAddress - Optional pool address to clear, if not provided clears all
 */
export function clearDLMMCache(poolAddress?: string) {
  if (poolAddress) {
    poolCache.delete(poolAddress)
  } else {
    poolCache.clear()
  }
}

/**
 * Refresh pool state before performing operations
 * @param poolAddress - The pool's public key address
 */
export async function refreshDLMMPoolState(poolAddress: string): Promise<void> {
  const dlmmPool = await getDLMMPool(poolAddress)
  await dlmmPool.refetchStates()
}
