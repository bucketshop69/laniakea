import { BN } from '@coral-xyz/anchor'

/**
 * Safely convert a token amount to lamports/smallest unit
 * Avoids JavaScript floating point precision issues by using string manipulation
 * 
 * @param amount - The token amount as a number or string (e.g., 1.5 or "1.5")
 * @param decimals - Number of decimals for the token (e.g., 9 for SOL)
 * @returns BN representing the amount in smallest unit (lamports)
 * 
 * @example
 * // Convert 1.23456789 SOL to lamports (9 decimals)
 * safeToLamports(1.23456789, 9) // Returns BN(123456789)
 * 
 * @example
 * // Convert 100.5 USDC to smallest unit (6 decimals)
 * safeToLamports(100.5, 6) // Returns BN(100500000)
 */
export function safeToLamports(amount: number | string, decimals: number): BN {
  // Handle zero
  if (amount === 0 || amount === '0') {
    return new BN(0)
  }

  // Convert to string if number
  const amountStr = typeof amount === 'number' ? amount.toString() : amount

  // Remove any leading/trailing whitespace
  const trimmed = amountStr.trim()

  // Validate input
  if (!/^[0-9]*\.?[0-9]*$/.test(trimmed)) {
    throw new Error(`Invalid amount format: ${amountStr}`)
  }

  // Split into integer and fractional parts
  const [integerPart = '0', fractionalPart = ''] = trimmed.split('.')

  // Pad or truncate fractional part to match decimals
  let fraction = fractionalPart.padEnd(decimals, '0')
  
  if (fraction.length > decimals) {
    // Truncate if fractional part is longer than decimals
    fraction = fraction.slice(0, decimals)
  }

  // Concatenate integer and fractional parts
  const lamportsStr = integerPart + fraction

  // Remove leading zeros (but keep at least one digit)
  const normalized = lamportsStr.replace(/^0+/, '') || '0'

  return new BN(normalized)
}

/**
 * Convert lamports/smallest unit back to human-readable token amount
 * 
 * @param lamports - BN representing amount in smallest unit
 * @param decimals - Number of decimals for the token
 * @returns Number representing the token amount
 * 
 * @example
 * lamportsToAmount(new BN(123456789), 9) // Returns 0.123456789
 */
export function lamportsToAmount(lamports: BN, decimals: number): number {
  const str = lamports.toString()
  
  if (str === '0') {
    return 0
  }

  // Pad with leading zeros if necessary
  const padded = str.padStart(decimals + 1, '0')
  
  // Insert decimal point
  const integerPart = padded.slice(0, -decimals) || '0'
  const fractionalPart = padded.slice(-decimals)
  
  return parseFloat(`${integerPart}.${fractionalPart}`)
}
