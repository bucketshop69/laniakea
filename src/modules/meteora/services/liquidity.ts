import { PublicKey, Transaction, Keypair, Connection, VersionedTransaction } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import { getDLMMPool } from './dlmmClient'
import { StrategyType } from '../types/domain'
import { getUserPositions } from './positions'
import { sendViaSanctum } from '@/lib/sanctumGateway'

export interface AddLiquidityParams {
  poolAddress: string
  userPublicKey: PublicKey
  totalXAmount: BN
  totalYAmount: BN
  minBinId: number
  maxBinId: number
  strategyType: StrategyType
  slippage?: number // Slippage tolerance in percentage (e.g., 1 = 1%)
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
  console.log(dlmmPool.pubkey.toString());

  // Generate new position keypair
  const positionKeypair = Keypair.generate()
  console.log("[Create position]", {
    positionPubKey: positionKeypair.publicKey,
    user: params.userPublicKey,
    totalXAmount: params.totalXAmount,
    totalYAmount: params.totalYAmount,
    strategy: {
      minBinId: params.minBinId,
      maxBinId: params.maxBinId,
      strategyType: params.strategyType,
    },
    slippage: params.slippage ?? 3, // Default 1% slippage if not provided
  });

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
    slippage: params.slippage ?? 1, // Default 1% slippage if not provided
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
    slippage: params.slippage ?? 1, // Default 1% slippage if not provided
  })

  return transaction
}

/**
 * Remove all liquidity from a position and close it
 * @param params - Remove liquidity parameters
 * @returns Transaction or array of transactions
 */
export async function removeLiquidityAndClose(
  params: RemoveLiquidityParams
): Promise<Transaction | Transaction[]> {
  const dlmmPool = await getDLMMPool(params.poolAddress)

  console.log('[Remove Liquidity]', {
    position: params.positionPublicKey.toString(),
    user: params.userPublicKey.toString(),
    binIdsToRemove: params.binIdsToRemove,
    shouldClaimAndClose: params.shouldClaimAndClose,
  })

  // Remove 100% of liquidity from all bins
  const bps = new BN(100 * 100) // 100% removal in basis points
  
  // Sort bin IDs to get min and max
  const sortedBins = [...params.binIdsToRemove].sort((a, b) => a - b)
  const fromBinId = sortedBins[0]
  const toBinId = sortedBins[sortedBins.length - 1]

  const transaction = await dlmmPool.removeLiquidity({
    position: params.positionPublicKey,
    user: params.userPublicKey,
    fromBinId,
    toBinId,
    bps,
    shouldClaimAndClose: params.shouldClaimAndClose,
  })

  return transaction
}

/**
 * Execute remove liquidity transaction with full flow
 * Handles position fetching, transaction building, and sending via Sanctum
 * @param params - Execution parameters
 * @returns Transaction signature
 */
export async function executeRemoveLiquidity({
  poolAddress,
  positionMint,
  userPublicKey,
  connection,
  signTransaction,
}: {
  poolAddress: string
  positionMint: string
  userPublicKey: PublicKey
  connection: Connection
  signTransaction: (tx: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>
}): Promise<string> {
  // 1. Fetch full position data to get bin IDs
  const userPositions = await getUserPositions(userPublicKey.toString(), poolAddress)
  const fullPosition = userPositions.find((p) => p.publicKey === positionMint)

  if (!fullPosition) {
    throw new Error('Position not found')
  }

  // 2. Extract bin IDs from position data
  const binIds = fullPosition.positionData.positionBinData.map((bin) => bin.binId)

  if (binIds.length === 0) {
    throw new Error('No bins found in position')
  }

  console.log('[Execute Remove Liquidity]', {
    positionMint,
    poolAddress,
    binIds,
  })

  // 3. Build remove liquidity transaction
  const txOrTxs = await removeLiquidityAndClose({
    poolAddress,
    userPublicKey,
    positionPublicKey: new PublicKey(positionMint),
    binIdsToRemove: binIds,
    shouldClaimAndClose: true,
  })

  // 4. Sign and send via Sanctum (handles blockhash, fees, multi-validator delivery)
  const transactions = Array.isArray(txOrTxs) ? txOrTxs : [txOrTxs]
  let lastSignature = ''

  for (const transaction of transactions) {
    const signature = await sendViaSanctum(
      transaction,
      connection,
      { signTransaction },
      { waitForCommitment: 'confirmed' }
    )
    lastSignature = signature
  }

  return lastSignature
}

/**
 * Handle remove liquidity errors with user-friendly messages
 * @param error - The error to handle
 * @returns User-friendly error message
 */
export function handleRemoveLiquidityError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('User rejected')) {
      return 'Transaction was rejected by user'
    } else if (error.message.includes('insufficient lamports')) {
      return 'Insufficient SOL for transaction fees'
    } else if (error.message.includes('Transaction simulation failed')) {
      return 'Transaction simulation failed. Please try again.'
    } else if (error.message.includes('Position not found')) {
      return 'Position not found. It may have already been closed.'
    } else if (error.message.includes('No bins found')) {
      return 'Position has no liquidity to remove'
    }
    return error.message
  }
  return 'Failed to remove liquidity'
}

/**
 * Close a position (must have zero liquidity)
 * Note: Use removeLiquidityAndClose with shouldClaimAndClose=true instead.
 * This function requires the full position object from the SDK.
 * @param poolAddress - The pool's public key address
 * @param userPublicKey - User's public key
 * @param position - Full position object from getUserPositions
 * @returns Transaction
 */
// export async function closePosition(
//   poolAddress: string,
//   userPublicKey: PublicKey,
//   position: any
// ): Promise<Transaction> {
//   const dlmmPool = await getDLMMPool(poolAddress)

//   const transaction = await dlmmPool.closePosition({
//     owner: userPublicKey,
//     position,
//   })

//   return transaction
// }

/**
 * Execute claim fees transaction with full flow
 * Handles position fetching, transaction building, and sending via Sanctum
 * @param params - Execution parameters
 * @returns Transaction signature
 */
export async function executeClaimFees({
  poolAddress,
  positionMint,
  userPublicKey,
  connection,
  signTransaction,
}: {
  poolAddress: string
  positionMint: string
  userPublicKey: PublicKey
  connection: Connection
  signTransaction: (tx: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>
}): Promise<string> {
  console.log('[Execute Claim Fees]', {
    positionMint,
    poolAddress,
  })

  // Fetch DLMM pool to access claim method
  const dlmmPool = await getDLMMPool(poolAddress)
  
  // Fetch position directly by public key (more efficient than fetching all positions)
  const position = await dlmmPool.getPosition(new PublicKey(positionMint))

  // Build claim fees transaction
  const txOrTxs = await dlmmPool.claimSwapFee({
    owner: userPublicKey,
    position,
  })

  // Handle single or array of transactions
  const transactions = Array.isArray(txOrTxs) ? txOrTxs : [txOrTxs]
  let lastSignature = ''

  for (const transaction of transactions) {
    const signature = await sendViaSanctum(
      transaction,
      connection,
      { signTransaction },
      { waitForCommitment: 'confirmed' }
    )
    lastSignature = signature
  }

  return lastSignature
}

/**
 * Handle claim fees errors with user-friendly messages
 * @param error - The error to handle
 * @returns User-friendly error message
 */
export function handleClaimFeesError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('User rejected')) {
      return 'Transaction was rejected by user'
    } else if (error.message.includes('insufficient lamports')) {
      return 'Insufficient SOL for transaction fees'
    } else if (error.message.includes('Transaction simulation failed')) {
      return 'Transaction simulation failed. Please try again.'
    } else if (error.message.includes('Position not found')) {
      return 'Position not found. It may have already been closed.'
    }
    return error.message
  }
  return 'Failed to claim fees'
}

/**
 * Claim all swap fees for multiple positions
 * @param poolAddress - The pool's public key address
 * @param userPublicKey - User's public key
 * @param positions - Array of position objects with publicKey
 * @returns Array of transactions
 */
// export async function claimAllSwapFees(
//   poolAddress: string,
//   userPublicKey: PublicKey,
//   positions: Array<{ publicKey: string }>
// ): Promise<Transaction[]> {
//   const dlmmPool = await getDLMMPool(poolAddress)

//   const transactions = await dlmmPool.claimAllSwapFee({
//     owner: userPublicKey,
//     positions,
//   })

//   return Array.isArray(transactions) ? transactions : [transactions]
// }

/**
 * Claim liquidity mining rewards for a single position
 * @param poolAddress - The pool's public key address
 * @param userPublicKey - User's public key
 * @param positionPublicKey - Position's public key
 * @returns Transaction
 */
// export async function claimLMReward(
//   poolAddress: string,
//   userPublicKey: PublicKey,
//   positionPublicKey: PublicKey
// ): Promise<Transaction> {
//   const dlmmPool = await getDLMMPool(poolAddress)

//   const transaction = await dlmmPool.claimLMReward({
//     owner: userPublicKey,
//     position: positionPublicKey,
//   })

//   return transaction
// }

/**
 * Claim all liquidity mining rewards for multiple positions
 * @param poolAddress - The pool's public key address
 * @param userPublicKey - User's public key
 * @param positions - Array of position objects with publicKey
 * @returns Array of transactions
 */
// export async function claimAllLMRewards(
//   poolAddress: string,
//   userPublicKey: PublicKey,
//   positions: Array<{ publicKey: string }>
// ): Promise<Transaction[]> {
//   const dlmmPool = await getDLMMPool(poolAddress)

//   const transactions = await dlmmPool.claimAllLMRewards({
//     owner: userPublicKey,
//     positions,
//   })

//   return Array.isArray(transactions) ? transactions : [transactions]
// }

/**
 * Claim all rewards (swap fees + LM rewards) for multiple positions
 * @param poolAddress - The pool's public key address
 * @param userPublicKey - User's public key
 * @param positions - Array of position objects with publicKey
 * @returns Array of transactions
 */
// export async function claimAllRewards(
//   poolAddress: string,
//   userPublicKey: PublicKey,
//   positions: Array<{ publicKey: string }>
// ): Promise<Transaction[]> {
//   const dlmmPool = await getDLMMPool(poolAddress)

//   const transactions = await dlmmPool.claimAllRewards({
//     owner: userPublicKey,
//     positions,
//   })

//   return Array.isArray(transactions) ? transactions : [transactions]
// }
