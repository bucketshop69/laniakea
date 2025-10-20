/**
 * Meteora DLMM Module Constants
 * Centralized configuration for magic numbers and default values
 */

export const METEORA_CONFIG = {
  /**
   * SOL rent reserve for creating positions
   * Reserve extra SOL for rent-exempt account creation and transaction fees
   */
  SOL_RENT_RESERVE: 0.0575,

  /**
   * Auto-dismiss timeout for success/error messages (milliseconds)
   */
  MESSAGE_AUTO_DISMISS_MS: 30000, // 30 seconds

  /**
   * Default bin range for liquidity distribution visualization
   */
  DEFAULT_BIN_RANGE: 33,

  /**
   * Pool data cache TTL (milliseconds)
   */
  POOL_CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes

  /**
   * Delay after transaction before refreshing positions (milliseconds)
   * Allows blockchain state to update
   */
  POSITION_REFRESH_DELAY_MS: 2000, // 2 seconds

  /**
   * API request timeout (milliseconds)
   */
  API_TIMEOUT_MS: 10000, // 10 seconds
} as const
