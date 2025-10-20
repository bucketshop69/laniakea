/**
 * Utility functions for safe logging in production
 * Masks sensitive data like wallet addresses and public keys
 */

/**
 * Mask a Solana address or public key for safe logging
 * Shows first 4 and last 4 characters
 * 
 * @param address - Full address or public key string
 * @returns Masked address (e.g., "7xKX...9Abc")
 * 
 * @example
 * maskAddress("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU")
 * // Returns: "7xKX...gAsU"
 */
export function maskAddress(address: string | undefined | null): string {
  if (!address) return 'null'
  if (typeof address !== 'string') return String(address)
  if (address.length <= 8) return address
  
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

/**
 * Mask multiple addresses in an object for logging
 * Useful for logging transaction parameters
 * 
 * @param obj - Object containing addresses
 * @returns New object with masked addresses
 * 
 * @example
 * maskAddresses({ user: "7xKX...AsU", pool: "9vMJ...qWZ" })
 */
export function maskAddresses<T extends Record<string, any>>(obj: T): T {
  const masked: any = {}
  
  for (const [key, value] of Object.entries(obj)) {
    // Mask if key name suggests it's an address
    const isAddressKey = /address|pubkey|publickey|mint|owner|user|position/i.test(key)
    
    if (isAddressKey && typeof value === 'string' && value.length > 20) {
      masked[key] = maskAddress(value)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively mask nested objects
      masked[key] = maskAddresses(value)
    } else {
      masked[key] = value
    }
  }
  
  return masked as T
}

/**
 * Safe console.log for development only
 * In production, sensitive data is automatically masked
 */
export const meteoraLogger = {
  /**
   * Log with automatic address masking
   */
  log: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[Meteora] ${message}`, data)
    } else {
      // In production, mask sensitive data
      console.log(`[Meteora] ${message}`, data ? maskAddresses(data) : undefined)
    }
  },
  
  /**
   * Error logging (always enabled)
   */
  error: (message: string, error?: any) => {
    console.error(`[Meteora] ${message}`, error)
  },
  
  /**
   * Warning logging
   */
  warn: (message: string, data?: any) => {
    console.warn(`[Meteora] ${message}`, data)
  },
}
