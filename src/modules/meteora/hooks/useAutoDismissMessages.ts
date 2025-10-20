import { useEffect } from 'react'
import { METEORA_CONFIG } from '../constants'

/**
 * Auto-dismiss messages after a timeout
 * Handles error and success messages with automatic cleanup
 */
export function useAutoDismissMessages({
  errorMessage,
  successMessage,
  removeError,
  removeSuccess,
  onClearError,
  onClearSuccess,
  onClearRemoveError,
  onClearRemoveSuccess,
}: {
  errorMessage: string | null
  successMessage: string | null
  removeError: string | null
  removeSuccess: string | null
  onClearError: (value: null) => void
  onClearSuccess: (value: null) => void
  onClearRemoveError: (value: null) => void
  onClearRemoveSuccess: (value: null) => void
}) {
  // Auto-dismiss error message
  useEffect(() => {
    if (!errorMessage) return

    const timer = setTimeout(() => {
      onClearError(null)
    }, METEORA_CONFIG.MESSAGE_AUTO_DISMISS_MS)

    return () => clearTimeout(timer)
  }, [errorMessage, onClearError])

  // Auto-dismiss success message
  useEffect(() => {
    if (!successMessage) return

    const timer = setTimeout(() => {
      onClearSuccess(null)
    }, METEORA_CONFIG.MESSAGE_AUTO_DISMISS_MS)

    return () => clearTimeout(timer)
  }, [successMessage, onClearSuccess])

  // Auto-dismiss remove error message
  useEffect(() => {
    if (!removeError) return

    const timer = setTimeout(() => {
      onClearRemoveError(null)
    }, METEORA_CONFIG.MESSAGE_AUTO_DISMISS_MS)

    return () => clearTimeout(timer)
  }, [removeError, onClearRemoveError])

  // Auto-dismiss remove success message
  useEffect(() => {
    if (!removeSuccess) return

    const timer = setTimeout(() => {
      onClearRemoveSuccess(null)
    }, METEORA_CONFIG.MESSAGE_AUTO_DISMISS_MS)

    return () => clearTimeout(timer)
  }, [removeSuccess, onClearRemoveSuccess])
}
