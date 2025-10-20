/**
 * Utility functions for polling blockchain state with exponential backoff
 */

/**
 * Wait for a position to be removed from the blockchain
 * Uses exponential backoff for efficient polling
 * 
 * @param checkFn - Function that returns true when condition is met
 * @param maxAttempts - Maximum number of polling attempts (default: 5)
 * @param initialDelay - Initial delay in milliseconds (default: 500ms)
 * @returns Promise that resolves when condition is met
 * @throws Error if max attempts reached without success
 * 
 * @example
 * await waitForCondition(
 *   async () => {
 *     const positions = await getUserPositions(wallet, pool)
 *     return !positions.some(p => p.publicKey === removedMint)
 *   },
 *   5, // max 5 attempts
 *   500 // start with 500ms delay
 * )
 */
export async function waitForCondition(
  checkFn: () => Promise<boolean>,
  maxAttempts: number = 5,
  initialDelay: number = 500
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const conditionMet = await checkFn()
    
    if (conditionMet) {
      return // Success!
    }
    
    // Don't wait after the last attempt
    if (attempt < maxAttempts - 1) {
      // Exponential backoff: 500ms, 1s, 2s, 4s, 8s
      const delay = initialDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw new Error(`Condition not met after ${maxAttempts} attempts`)
}

/**
 * Wait for a specific position to be removed from a pool
 * 
 * @param getUserPositionsFn - Function to fetch current positions
 * @param positionMint - Position mint address to wait for removal
 * @param maxAttempts - Maximum polling attempts
 * @returns Promise that resolves when position is removed
 */
export async function waitForPositionRemoval(
  getUserPositionsFn: () => Promise<Array<{ publicKey: string }>>,
  positionMint: string,
  maxAttempts: number = 5
): Promise<void> {
  return waitForCondition(
    async () => {
      const positions = await getUserPositionsFn()
      return !positions.some(p => p.publicKey === positionMint)
    },
    maxAttempts
  )
}
