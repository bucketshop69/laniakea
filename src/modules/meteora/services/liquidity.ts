import { PublicKey, Transaction, Keypair } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import { getDLMMPool } from './dlmmClient'
import { StrategyType } from '../types/domain'

export interface AddLiquidityParams {
  poolAddress: string
  userPublicKey: PublicKey
  totalXAmount: BN
  totalYAmount: BN
  minBinId: number
  maxBinId: number
  strategyType: StrategyType
  existingPositionPubKey?: PublicKey
}

export interface RemoveLiquidityParams {
  poolAddress: string
  userPublicKey: PublicKey
  positionPublicKey: PublicKey
  binIdsToRemove: number[]
  shouldClaimAndClose: boolean
}

/**
 * Create a new position and add liquidity
 * @param params - Add liquidity parameters
 * @returns Transaction and position keypair
 */
export async function createPositionAndAddLiquidity(
  params: AddLiquidityParams
): Promise<{ transaction: Transaction; positionKeypair: Keypair }> {
  const dlmmPool = await getDLMMPool(params.poolAddress)

  // Generate new position keypair
  const positionKeypair = Keypair.generate()

  // Create transaction
  const transaction = await dlmmPool.initializePositionAndAddLiquidityByStrategy({
    positionPubKey: positionKeypair.publicKey,
    user: params.userPublicKey,
    totalXAmount: params.totalXAmount,
    totalYAmount: params.totalYAmount,
    strategy: {
      minBinId: params.minBinId,
      maxBinId: params.maxBinId,
      strategyType: params.strategyType,
    },
  })

  return { transaction, positionKeypair }
}

/**
 * Add liquidity to an existing position
 * @param params - Add liquidity parameters
 * @returns Transaction
 */
export async function addLiquidityToPosition(
  params: AddLiquidityParams
): Promise<Transaction> {
  if (!params.existingPositionPubKey) {
    throw new Error('Existing position public key is required')
  }

  const dlmmPool = await getDLMMPool(params.poolAddress)

  const transaction = await dlmmPool.addLiquidityByStrategy({
    positionPubKey: params.existingPositionPubKey,
    user: params.userPublicKey,
    totalXAmount: params.totalXAmount,
    totalYAmount: params.totalYAmount,
    strategy: {
      minBinId: params.minBinId,
      maxBinId: params.maxBinId,
      strategyType: params.strategyType,
    },
  })

  return transaction
}

/**
 * Remove liquidity from a position
 * @param params - Remove liquidity parameters
 * @returns Transaction or array of transactions
 */
export async function removeLiquidity(
  params: RemoveLiquidityParams
): Promise<Transaction | Transaction[]> {
  const dlmmPool = await getDLMMPool(params.poolAddress)

  const liquiditiesBpsToRemove = new Array(params.binIdsToRemove.length).fill(
    new BN(100 * 100) // 100% removal in basis points
  )

  const transaction = await dlmmPool.removeLiquidity({
    position: params.positionPublicKey,
    user: params.userPublicKey,
    fromBinId: params.binIdsToRemove[0],
    toBinId: params.binIdsToRemove[params.binIdsToRemove.length - 1],
    liquiditiesBpsToRemove,
    shouldClaimAndClose: params.shouldClaimAndClose,
  })

  return transaction
}

/**
 * Close a position
 * @param poolAddress - The pool's public key address
 * @param userPublicKey - User's public key
 * @param positionPublicKey - Position's public key
 * @returns Transaction
 */
export async function closePosition(
  poolAddress: string,
  userPublicKey: PublicKey,
  positionPublicKey: PublicKey
): Promise<Transaction> {
  const dlmmPool = await getDLMMPool(poolAddress)

  const transaction = await dlmmPool.closePosition({
    owner: userPublicKey,
    position: positionPublicKey,
  })

  return transaction
}

/**
 * Claim swap fees for a single position
 * @param poolAddress - The pool's public key address
 * @param userPublicKey - User's public key
 * @param positionPublicKey - Position's public key
 * @returns Transaction
 */
export async function claimSwapFee(
  poolAddress: string,
  userPublicKey: PublicKey,
  positionPublicKey: PublicKey
): Promise<Transaction> {
  const dlmmPool = await getDLMMPool(poolAddress)

  const transaction = await dlmmPool.claimSwapFee({
    owner: userPublicKey,
    position: positionPublicKey,
  })

  return transaction
}

/**
 * Claim all swap fees for multiple positions
 * @param poolAddress - The pool's public key address
 * @param userPublicKey - User's public key
 * @param positions - Array of position objects with publicKey
 * @returns Array of transactions
 */
export async function claimAllSwapFees(
  poolAddress: string,
  userPublicKey: PublicKey,
  positions: Array<{ publicKey: string }>
): Promise<Transaction[]> {
  const dlmmPool = await getDLMMPool(poolAddress)

  const transactions = await dlmmPool.claimAllSwapFee({
    owner: userPublicKey,
    positions,
  })

  return Array.isArray(transactions) ? transactions : [transactions]
}

/**
 * Claim liquidity mining rewards for a single position
 * @param poolAddress - The pool's public key address
 * @param userPublicKey - User's public key
 * @param positionPublicKey - Position's public key
 * @returns Transaction
 */
export async function claimLMReward(
  poolAddress: string,
  userPublicKey: PublicKey,
  positionPublicKey: PublicKey
): Promise<Transaction> {
  const dlmmPool = await getDLMMPool(poolAddress)

  const transaction = await dlmmPool.claimLMReward({
    owner: userPublicKey,
    position: positionPublicKey,
  })

  return transaction
}

/**
 * Claim all liquidity mining rewards for multiple positions
 * @param poolAddress - The pool's public key address
 * @param userPublicKey - User's public key
 * @param positions - Array of position objects with publicKey
 * @returns Array of transactions
 */
export async function claimAllLMRewards(
  poolAddress: string,
  userPublicKey: PublicKey,
  positions: Array<{ publicKey: string }>
): Promise<Transaction[]> {
  const dlmmPool = await getDLMMPool(poolAddress)

  const transactions = await dlmmPool.claimAllLMRewards({
    owner: userPublicKey,
    positions,
  })

  return Array.isArray(transactions) ? transactions : [transactions]
}

/**
 * Claim all rewards (swap fees + LM rewards) for multiple positions
 * @param poolAddress - The pool's public key address
 * @param userPublicKey - User's public key
 * @param positions - Array of position objects with publicKey
 * @returns Array of transactions
 */
export async function claimAllRewards(
  poolAddress: string,
  userPublicKey: PublicKey,
  positions: Array<{ publicKey: string }>
): Promise<Transaction[]> {
  const dlmmPool = await getDLMMPool(poolAddress)

  const transactions = await dlmmPool.claimAllRewards({
    owner: userPublicKey,
    positions,
  })

  return Array.isArray(transactions) ? transactions : [transactions]
}
