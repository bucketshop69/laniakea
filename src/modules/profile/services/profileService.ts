import type {
  VybeAccountBalanceResponse,
  ProfileOverview,
} from '../types'

const VYBE_API_BASE = 'https://api.vybenetwork.xyz'
const VYBE_API_KEY = import.meta.env.VITE_VYBE_API_KEY

// Fetch wallet token balance from Vybe API
export const fetchWalletBalance = async (
  walletAddress: string
): Promise<VybeAccountBalanceResponse> => {
  const url = `${VYBE_API_BASE}/account/token-balance/${walletAddress}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-API-KEY': VYBE_API_KEY,
      'accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch wallet balance: ${response.statusText}`)
  }

  return response.json()
}

// Transform Vybe response to our simplified format
const transformVybeResponse = (
  vybeData: VybeAccountBalanceResponse
): ProfileOverview => {
  const totalValue = parseFloat(vybeData.totalTokenValueUsd)
  const change24h = parseFloat(vybeData.totalTokenValueUsd1dChange)

  // Calculate percentage change
  const changePercent24h = totalValue > 0
    ? (change24h / (totalValue - change24h)) * 100
    : 0

  return {
    totalValue,
    change24h,
    changePercent24h,
    tokenCount: vybeData.totalTokenCount,
    walletAddress: vybeData.ownerAddress,
  }
}

// Main function to get profile overview
export const getProfileOverview = async (
  walletAddress: string
): Promise<ProfileOverview> => {
  try {

    const vybeData = await fetchWalletBalance(walletAddress)
    const overview = transformVybeResponse(vybeData)

    return overview
  } catch (error) {
    console.error('[ProfileService] Failed to fetch profile overview:', error)
    throw error
  }
}
