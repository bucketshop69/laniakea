export type SarosToken = {
  address: string
  chain: string
  cgkId: string
  image: string
  name: string
  symbol: string
  current_price: string
  decimals: number
  marketInfo?: {
    current_price: string
  }
}

type SarosTokenListResponse = {
  status: number
  success: boolean
  data: SarosToken[]
}

export type ExistingPoolToken = {
  address: string
  mintAddress: string
  name: string
  symbol: string
  decimals: number
  image: string
}

export type ExistingPool = {
  _id: string
  pair: string
  binStep: number
  binStepConfig: string
  tokenX: ExistingPoolToken
  tokenY: ExistingPoolToken
}

type CheckPoolExistsResponse = {
  status: number
  success: boolean
  data: ExistingPool[]
}

const SAROS_TOKEN_LIST_ENDPOINT = 'https://api.saros.xyz/api/dex-v3/token/list'
const SAROS_POOL_CHECK_ENDPOINT = 'https://api.saros.xyz/api/dex-v3/swap/pools'

// Request deduplication only - no caching due to large payload (1989 KB)
let activeTokenListRequest: Promise<SarosToken[]> | null = null

export const fetchSarosTokenList = async (): Promise<SarosToken[]> => {
  // If there's already an active request, return that promise to avoid duplicate API calls
  if (activeTokenListRequest) {
    return activeTokenListRequest
  }

  // Create new request
  activeTokenListRequest = fetch(SAROS_TOKEN_LIST_ENDPOINT)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch Saros token list: ${response.status}`)
      }
      const payload = await response.json() as SarosTokenListResponse

      if (!payload.success || !Array.isArray(payload.data)) {
        throw new Error('Invalid response format from Saros token API')
      }

      // Clear active request
      activeTokenListRequest = null

      return payload.data
    })
    .catch((error) => {
      // Clear active request on error
      activeTokenListRequest = null
      throw error
    })

  return activeTokenListRequest
}

export const checkPoolExists = async (
  fromTokenMint: string,
  toTokenMint: string
): Promise<ExistingPool[]> => {
  const params = new URLSearchParams({
    fromTokenMint,
    toTokenMint,
  })

  const response = await fetch(`${SAROS_POOL_CHECK_ENDPOINT}?${params.toString()}`)

  if (!response.ok) {
    throw new Error(`Failed to check pool existence: ${response.status}`)
  }

  const payload = await response.json() as CheckPoolExistsResponse

  if (!payload.success) {
    throw new Error('Invalid response from pool check API')
  }

  return Array.isArray(payload.data) ? payload.data : []
}
