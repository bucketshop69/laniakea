import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { PublicKey } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { getSolanaConnection } from '@/lib/solanaConnection'
import { useWalletBalanceStore, type WalletTokenBalance } from '@/store/walletBalanceStore'
import { useMeteoraStore, useMeteoraDataStore, type MeteoraManageTab } from '../state'
import { useMeteoraBinDistribution } from '../hooks/useFetchBinDistribution'
import { getActiveBin, getBinIdFromPrice, getUserPositions } from '../services/positions'
import {
  createPositionAndAddLiquidity,
  addLiquidityToPosition,
  executeRemoveLiquidity,
  handleRemoveLiquidityError
} from '../services/liquidity'
import { StrategyType } from '../types/domain'
import ManageHeader from './manage/ManageHeader'
import AddLiquidityForm from './manage/AddLiquidityForm'
import RemoveLiquidityPanel, { type MeteoraDisplayPosition } from './manage/RemoveLiquidityPanel'
import { sendViaSanctum } from '@/lib/sanctumGateway'
import { transformPositionsToDisplayFormat } from '../utils/positionTransform'

interface MeteoraManageProps {
  onBack: () => void
}

const MeteoraManage = ({ onBack }: MeteoraManageProps) => {
  const pool = useMeteoraDataStore((state) => state.data.selectedPool)
  const baseMint = pool?.mint_x ?? ''
  const quoteMint = pool?.mint_y ?? ''
  const { publicKey, connected } = useWallet()
  const connection = useMemo(() => getSolanaConnection(), [])
  const { setVisible: setWalletModalVisible } = useWalletModal()

  const poolAddress = pool?.address ?? null
  const manageForm = useMeteoraStore((state) => (poolAddress ? state.manageForms[poolAddress] : undefined))
  const updateManageForm = useMeteoraStore((state) => state.updateManageForm)
  const { signTransaction } = useWallet()

  const tab: MeteoraManageTab = manageForm?.tab ?? 'add'
  const baseAmountInput = manageForm?.baseAmountInput ?? ''
  const quoteAmountInput = manageForm?.quoteAmountInput ?? ''

  // State for add liquidity
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  // State for remove liquidity
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [removeSuccess, setRemoveSuccess] = useState<string | null>(null)
  const [removingMint, setRemovingMint] = useState<string | null>(null)
  const [positionsLoading, setPositionsLoading] = useState(false)
  const [positionsError, setPositionsError] = useState<string | null>(null)
  const [positions, setPositions] = useState<MeteoraDisplayPosition[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Auto-dismiss error message after 30 seconds
  useEffect(() => {
    if (!errorMessage) return

    const timer = setTimeout(() => {
      setErrorMessage(null)
    }, 30000) // 30 seconds

    return () => clearTimeout(timer)
  }, [errorMessage])

  // Auto-dismiss success message after 30 seconds
  useEffect(() => {
    if (!successMessage) return

    const timer = setTimeout(() => {
      setSuccessMessage(null)
    }, 30000) // 30 seconds

    return () => clearTimeout(timer)
  }, [successMessage])

  // Auto-dismiss remove error message after 30 seconds
  useEffect(() => {
    if (!removeError) return

    const timer = setTimeout(() => {
      setRemoveError(null)
    }, 30000)

    return () => clearTimeout(timer)
  }, [removeError])

  // Auto-dismiss remove success message after 30 seconds
  useEffect(() => {
    if (!removeSuccess) return

    const timer = setTimeout(() => {
      setRemoveSuccess(null)
    }, 30000)

    return () => clearTimeout(timer)
  }, [removeSuccess])

  // Wallet balance integration
  const refreshBalances = useWalletBalanceStore((state) => state.refreshBalances)
  const isBalanceLoading = useWalletBalanceStore((state) => state.isLoading)
  const balancesError = useWalletBalanceStore((state) => state.error)
  const nativeBalanceSol = useWalletBalanceStore((state) => state.nativeBalanceSol)
  const nativeBalanceLamports = useWalletBalanceStore((state) => state.nativeBalanceLamports)
  const balancesByMint = useWalletBalanceStore((state) => state.balancesByMint)

  // Native SOL mint address
  const NATIVE_SOL_MINT = 'So11111111111111111111111111111111111111112'

  // Get balances, handling native SOL specially
  const baseTokenBalance = useMemo(() => {
    if (baseMint === NATIVE_SOL_MINT) {
      // Return native SOL as a WalletTokenBalance-like object
      return {
        account: '',
        mint: NATIVE_SOL_MINT,
        owner: publicKey?.toString() ?? '',
        amountRaw: nativeBalanceLamports.toString(),
        decimals: 9,
        uiAmount: nativeBalanceSol,
        uiAmountString: nativeBalanceSol.toString(),
        isNative: true,
      }
    }
    return baseMint ? balancesByMint[baseMint] : undefined
  }, [baseMint, nativeBalanceSol, nativeBalanceLamports, balancesByMint, publicKey])

  const quoteTokenBalance = useMemo(() => {
    if (quoteMint === NATIVE_SOL_MINT) {
      // Return native SOL as a WalletTokenBalance-like object
      return {
        account: '',
        mint: NATIVE_SOL_MINT,
        owner: publicKey?.toString() ?? '',
        amountRaw: nativeBalanceLamports.toString(),
        decimals: 9,
        uiAmount: nativeBalanceSol,
        uiAmountString: nativeBalanceSol.toString(),
        isNative: true,
      }
    }
    return quoteMint ? balancesByMint[quoteMint] : undefined
  }, [quoteMint, nativeBalanceSol, nativeBalanceLamports, balancesByMint, publicKey])

  const updateForm = useCallback((patch: any) => {
    if (!poolAddress) return
    updateManageForm(poolAddress, patch)
  }, [poolAddress, updateManageForm])

  // First fetch active bin for the pool (needed to initialize the bin distribution hook)
  const [initialActiveBinId, setInitialActiveBinId] = useState<number | null>(null)
  useEffect(() => {
    if (!poolAddress) {
      setInitialActiveBinId(null)
      return
    }

    let cancelled = false

    getActiveBin(poolAddress)
      .then((activeBin) => {
        if (!cancelled) {
          setInitialActiveBinId(activeBin.binId)
        }
      })
      .catch((error) => {
        console.error('[Meteora Manage] Failed to fetch initial active bin', error)
        if (!cancelled) {
          setInitialActiveBinId(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [poolAddress])

  // Fetch bin distribution - this returns the active bin from SDK, so we use that instead of a separate call
  const {
    data: binData,
    activeBinId: activeBinFromSDK,
    isLoading: binLoading,
  } = useMeteoraBinDistribution({
    poolAddress: poolAddress ?? undefined,
    activeBin: initialActiveBinId ?? undefined,
    range: 33,
    enabled: Boolean(poolAddress && initialActiveBinId !== null),
  })

  // Use the active bin ID from the SDK response (more efficient than separate call)
  const activeBinId = activeBinFromSDK ?? initialActiveBinId

  // Fetch balances when wallet connects or pool changes
  useEffect(() => {
    if (!connected || !publicKey || !pool) {
      return
    }

    const mintAddresses = [baseMint, quoteMint].filter((mint): mint is string => Boolean(mint))
    if (mintAddresses.length === 0) {
      return
    }



    void refreshBalances(connection, publicKey, mintAddresses, { force: true })
  }, [connected, publicKey, pool, baseMint, quoteMint, connection, refreshBalances])

  // Fetch user positions when on remove tab
  useEffect(() => {
    if (tab !== 'remove' || !connected || !publicKey || !poolAddress) {
      return
    }

    setPositionsLoading(true)
    setPositionsError(null)

    getUserPositions(publicKey.toString(), poolAddress)
      .then((userPositions) => {
        // Convert to display format using utility function
        const displayPositions = transformPositionsToDisplayFormat(
          userPositions,
          pool,
          baseTokenBalance?.decimals ?? 9,
          quoteTokenBalance?.decimals ?? 9
        )

        setPositions(displayPositions)
        setPositionsLoading(false)
      })
      .catch((error) => {
        console.error('[Meteora Manage] Failed to fetch positions', error)
        setPositionsError(error instanceof Error ? error.message : 'Failed to fetch positions')
        setPositionsLoading(false)
      })
  }, [tab, connected, publicKey, poolAddress, pool, baseTokenBalance?.decimals, quoteTokenBalance?.decimals])

  if (!pool) {
    return (
      <Card className="flex h-full items-center justify-center rounded-2xl p-6 text-sm text-muted-foreground">
        Select a Meteora pool from Discover to manage liquidity.
      </Card>
    )
  }

  const shapeOptions = useMemo(
    () => ([
      { id: 'spot', label: 'Spot' },
      { id: 'curve', label: 'Curve' },
      { id: 'bidask', label: 'Bid Ask' },
    ]),
    []
  )

  const label = pool.name
  const priceLabel = `Current Price: $${pool.current_price.toFixed(4)}`
  const priceTone = 'text-[11px] text-muted-foreground'

  // Format balance helpers
  const formatAvailable = useCallback((balance?: WalletTokenBalance) => {
    if (!balance) {
      return '0'
    }

    const amount = balance.uiAmount
    if (!Number.isFinite(amount) || Number.isNaN(amount)) {
      return balance.uiAmountString
    }

    if (amount === 0) {
      return '0'
    }

    if (amount >= 1) {
      return amount.toLocaleString(undefined, { maximumFractionDigits: 4 })
    }

    return amount.toLocaleString(undefined, { maximumSignificantDigits: 4 })
  }, [])

  const renderBalanceLabel = useCallback((balance: WalletTokenBalance | undefined, symbol: string) => {
    if (!connected) {
      return 'Connect wallet to view balance'
    }

    if (isBalanceLoading) {
      return 'Fetching balance…'
    }

    if (balancesError) {
      return 'Balance unavailable'
    }

    return `Available: ${formatAvailable(balance)} ${symbol}`
  }, [balancesError, connected, formatAvailable, isBalanceLoading])

  // Get token symbols from pool name (e.g., "SOL-USDC" -> ["SOL", "USDC"])
  const [baseSymbol, quoteSymbol] = useMemo(() => {
    if (!pool?.name) return ['TOKEN_X', 'TOKEN_Y']

    const tokens = pool.name.split('-').map(t => t.trim())
    if (tokens.length >= 2) {
      return [tokens[0], tokens[1]]
    }

    return ['TOKEN_X', 'TOKEN_Y']
  }, [pool?.name])

  // Balance labels
  const baseBalanceLabel = renderBalanceLabel(baseTokenBalance, baseSymbol)
  const quoteBalanceLabel = renderBalanceLabel(quoteTokenBalance, quoteSymbol)

  // Get min/max bin IDs from form state
  const minBinId = manageForm?.minBinId ?? null
  const maxBinId = manageForm?.maxBinId ?? null
  const activeShape = manageForm?.activeShape ?? 'spot'

  // Initialize default range around active bin
  useEffect(() => {
    if (binData.length === 0 || activeBinId === null) return

    const dataMinBinId = Math.min(...binData.map(b => b.binId))
    const dataMaxBinId = Math.max(...binData.map(b => b.binId))

    // Only initialize if BOTH min and max are null (first load or pool change)
    if (minBinId === null && maxBinId === null) {
      updateForm({ minBinId: dataMinBinId, maxBinId: dataMaxBinId })
      return
    }

    // If bins are set but invalid (pool changed), reset them
    const minBinExists = minBinId !== null && binData.some(b => b.binId === minBinId)
    const maxBinExists = maxBinId !== null && binData.some(b => b.binId === maxBinId)

    if (minBinId !== null && maxBinId !== null && (!minBinExists || !maxBinExists)) {
      updateForm({ minBinId: dataMinBinId, maxBinId: dataMaxBinId })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBinId, binData, poolAddress])

  // Calculate display prices from bin IDs
  const displayMinPrice = useMemo(() => {
    if (minBinId === null || binData.length === 0) {
      return null
    }
    const bin = binData.find(b => b.binId === minBinId)
    return bin?.pricePerToken ?? null
  }, [minBinId, binData])

  const displayMaxPrice = useMemo(() => {
    if (maxBinId === null || binData.length === 0) return null
    const bin = binData.find(b => b.binId === maxBinId)
    return bin?.pricePerToken ?? null
  }, [maxBinId, binData])

  // Calculate percentage difference from active bin price
  const activeBinPrice = useMemo(() => {
    if (activeBinId === null || binData.length === 0) return null
    const bin = binData.find(b => b.binId === activeBinId)
    return bin?.pricePerToken ?? null
  }, [activeBinId, binData])

  const minPricePercent = useMemo(() => {
    if (displayMinPrice === null || activeBinPrice === null || activeBinPrice === 0) return null
    return ((displayMinPrice - activeBinPrice) / activeBinPrice) * 100
  }, [displayMinPrice, activeBinPrice])

  const maxPricePercent = useMemo(() => {
    if (displayMaxPrice === null || activeBinPrice === null || activeBinPrice === 0) return null
    return ((displayMaxPrice - activeBinPrice) / activeBinPrice) * 100
  }, [displayMaxPrice, activeBinPrice])

  const numBins = useMemo(() => {
    if (minBinId === null || maxBinId === null || binData.length === 0) return 0
    // Count actual bins in the selected range (handles non-contiguous bin IDs)
    const binsInRange = binData.filter(b => b.binId >= minBinId && b.binId <= maxBinId)
    return binsInRange.length
  }, [minBinId, maxBinId, binData])

  // Allow submission if at least one token amount is provided (one-sided positions supported)
  const hasAnyAmount = (baseAmountInput && parseFloat(baseAmountInput) > 0) || (quoteAmountInput && parseFloat(quoteAmountInput) > 0)
  const isAddDisabled = !hasAnyAmount || minBinId === null || maxBinId === null

  // Handle range change from bin chart
  const handleRangeChange = (newMinBinId: number, newMaxBinId: number) => {
    updateForm({ minBinId: newMinBinId, maxBinId: newMaxBinId })
  }

  const formatTokenAmount = useCallback((amount: number) => {
    if (!Number.isFinite(amount) || Number.isNaN(amount)) return '—'
    if (amount === 0) return '0'
    if (Math.abs(amount) >= 1) {
      return amount.toLocaleString(undefined, { maximumFractionDigits: 4 })
    }
    return amount.toLocaleString(undefined, { maximumSignificantDigits: 4 })
  }, [])

  const formatInteger = useCallback((value: number) => {
    if (!Number.isFinite(value) || Number.isNaN(value)) return '—'
    return Math.trunc(value).toLocaleString()
  }, [])

  const formatValueAmount = useCallback((value: number | null) => {
    if (value === null || !Number.isFinite(value) || Number.isNaN(value)) return '—'
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }, [])

  // Validate token amounts
  const validateAmounts = useCallback(() => {
    const errors: string[] = []

    // Parse amounts (allow 0 for one-sided positions)
    const baseAmount = baseAmountInput ? parseFloat(baseAmountInput) : 0
    const quoteAmount = quoteAmountInput ? parseFloat(quoteAmountInput) : 0

    // At least one token must have a valid amount > 0 (one-sided positions are allowed)
    const hasBaseAmount = baseAmountInput && Number.isFinite(baseAmount) && baseAmount > 0
    const hasQuoteAmount = quoteAmountInput && Number.isFinite(quoteAmount) && quoteAmount > 0

    if (!hasBaseAmount && !hasQuoteAmount) {
      errors.push(`Enter at least one token amount (one-sided positions are supported)`)
    }

    // Validate individual amounts if provided
    if (baseAmountInput && (!Number.isFinite(baseAmount) || baseAmount < 0)) {
      errors.push(`Invalid ${baseSymbol} amount`)
    }

    if (quoteAmountInput && (!Number.isFinite(quoteAmount) || quoteAmount < 0)) {
      errors.push(`Invalid ${quoteSymbol} amount`)
    }

    // Reserve for rent and transaction fees when using native SOL
    const SOL_RENT_RESERVE = 0.0575 // Reserve 0.0575 SOL for creating position (rent-exempt + fees)

    // Check if user has sufficient balance (only validate if amount is provided)
    if (hasBaseAmount && baseTokenBalance && Number.isFinite(baseAmount) && baseAmount > 0) {
      const isNativeSOL = baseMint === NATIVE_SOL_MINT
      const maxAvailable = isNativeSOL
        ? Math.max(0, baseTokenBalance.uiAmount - SOL_RENT_RESERVE)
        : baseTokenBalance.uiAmount

      if (baseAmount > maxAvailable) {
        if (isNativeSOL) {
          errors.push(
            `Insufficient ${baseSymbol} balance. Reserve ${SOL_RENT_RESERVE} SOL for fees. ` +
            `(available: ${formatAvailable({ ...baseTokenBalance, uiAmount: maxAvailable })})`
          )
        } else {
          errors.push(`Insufficient ${baseSymbol} balance (available: ${formatAvailable(baseTokenBalance)})`)
        }
      }
    }

    if (hasQuoteAmount && quoteTokenBalance && Number.isFinite(quoteAmount) && quoteAmount > 0) {
      const isNativeSOL = quoteMint === NATIVE_SOL_MINT
      const maxAvailable = isNativeSOL
        ? Math.max(0, quoteTokenBalance.uiAmount - SOL_RENT_RESERVE)
        : quoteTokenBalance.uiAmount

      if (quoteAmount > maxAvailable) {
        if (isNativeSOL) {
          errors.push(
            `Insufficient ${quoteSymbol} balance. Reserve ${SOL_RENT_RESERVE} SOL for fees. ` +
            `(available: ${formatAvailable({ ...quoteTokenBalance, uiAmount: maxAvailable })})`
          )
        } else {
          errors.push(`Insufficient ${quoteSymbol} balance (available: ${formatAvailable(quoteTokenBalance)})`)
        }
      }
    }

    // Check if bin range is valid
    if (minBinId === null || maxBinId === null) {
      errors.push('Please select a price range')
    } else if (minBinId > maxBinId) {
      errors.push('Min price cannot exceed max price')
    }

    return errors
  }, [
    baseAmountInput,
    quoteAmountInput,
    baseTokenBalance,
    quoteTokenBalance,
    minBinId,
    maxBinId,
    baseSymbol,
    quoteSymbol,
    formatAvailable,
    baseMint,
    quoteMint,
  ])

  // Handle min price input - only validate and convert on blur (when user finishes typing)
  const handleMinPriceChange = useCallback(async (value: string) => {
    if (!poolAddress || binData.length === 0) return

    // Allow empty input (user might be clearing to retype)
    if (value.trim() === '') {
      return
    }

    const parsedPrice = parseFloat(value)
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      console.warn('[Meteora Manage] Invalid min price input:', value)
      setErrorMessage('Invalid min price')
      return
    }

    // Get the min and max allowed prices from binData
    const minAllowedPrice = Math.min(...binData.map(b => b.pricePerToken))
    const maxAllowedPrice = Math.max(...binData.map(b => b.pricePerToken))

    // Validate the price is within allowed range
    if (parsedPrice < minAllowedPrice) {
      console.warn('[Meteora Manage] Min price cannot be less than lowest bin price', {
        inputPrice: parsedPrice,
        minAllowed: minAllowedPrice,
      })
      setErrorMessage(`Min price cannot be less than ${minAllowedPrice.toFixed(8)}`)
      return
    }

    if (parsedPrice > maxAllowedPrice) {
      console.warn('[Meteora Manage] Min price cannot be greater than highest bin price', {
        inputPrice: parsedPrice,
        maxAllowed: maxAllowedPrice,
      })
      setErrorMessage(`Min price cannot be greater than ${maxAllowedPrice.toFixed(8)}`)
      return
    }

    // Validate against current max price
    if (displayMaxPrice !== null && parsedPrice >= displayMaxPrice) {
      console.warn('[Meteora Manage] Min price must be less than max price', {
        minPrice: parsedPrice,
        maxPrice: displayMaxPrice,
      })
      setErrorMessage(`Min price must be less than max price (${displayMaxPrice.toFixed(8)})`)
      return
    }

    try {
      const binId = await getBinIdFromPrice(poolAddress, parsedPrice, true)

      updateForm({ minBinId: binId })
      setErrorMessage(null)

    } catch (error) {
      console.error('[Meteora Manage] Failed to convert min price to bin ID', error)
      setErrorMessage('Failed to update min price')
    }
  }, [poolAddress, binData, displayMaxPrice, updateForm])

  // Handle max price input - only validate and convert on blur (when user finishes typing)
  const handleMaxPriceChange = useCallback(async (value: string) => {
    if (!poolAddress || binData.length === 0) return

    // Allow empty input (user might be clearing to retype)
    if (value.trim() === '') {
      return
    }

    const parsedPrice = parseFloat(value)
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      console.warn('[Meteora Manage] Invalid max price input:', value)
      setErrorMessage('Invalid max price')
      return
    }

    // Get the min and max allowed prices from binData
    const minAllowedPrice = Math.min(...binData.map(b => b.pricePerToken))
    const maxAllowedPrice = Math.max(...binData.map(b => b.pricePerToken))

    // Validate the price is within allowed range
    if (parsedPrice < minAllowedPrice) {
      console.warn('[Meteora Manage] Max price cannot be less than lowest bin price', {
        inputPrice: parsedPrice,
        minAllowed: minAllowedPrice,
      })
      setErrorMessage(`Max price cannot be less than ${minAllowedPrice.toFixed(8)}`)
      return
    }

    if (parsedPrice > maxAllowedPrice) {
      console.warn('[Meteora Manage] Max price cannot be greater than highest bin price', {
        inputPrice: parsedPrice,
        maxAllowed: maxAllowedPrice,
      })
      setErrorMessage(`Max price cannot be greater than ${maxAllowedPrice.toFixed(8)}`)
      return
    }

    // Validate against current min price
    if (displayMinPrice !== null && parsedPrice <= displayMinPrice) {
      console.warn('[Meteora Manage] Max price must be greater than min price', {
        maxPrice: parsedPrice,
        minPrice: displayMinPrice,
      })
      setErrorMessage(`Max price must be greater than min price (${displayMinPrice.toFixed(8)})`)
      return
    }

    try {
      const binId = await getBinIdFromPrice(poolAddress, parsedPrice, false)


      updateForm({ maxBinId: binId })
      setErrorMessage(null)
    } catch (error) {
      console.error('[Meteora Manage] Failed to convert max price to bin ID', error)
      setErrorMessage('Failed to update max price')
    }
  }, [poolAddress, binData, displayMinPrice, updateForm])

  // Manual refresh handler
  const handleRefresh = async () => {
    if (!connected || !publicKey) return

    setIsRefreshing(true)

    try {
      // Refresh wallet balances
      const mintAddresses = [baseMint, quoteMint].filter((mint): mint is string => Boolean(mint))
      await refreshBalances(connection, publicKey, mintAddresses, { force: true })

      // If on remove tab, also refresh positions
      if (tab === 'remove' && poolAddress) {
        const updatedPositions = await getUserPositions(publicKey.toString(), poolAddress)
        const displayPositions = transformPositionsToDisplayFormat(
          updatedPositions,
          pool,
          baseTokenBalance?.decimals ?? 9,
          quoteTokenBalance?.decimals ?? 9
        )

        setPositions(displayPositions)
      }
    } catch (error) {
      console.error('[Meteora Manage] Manual refresh failed', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleAddLiquidity = async () => {
    if (!connected || !publicKey) {
      setWalletModalVisible(true)
      return
    }

    if (!poolAddress || !pool) {
      setErrorMessage('No pool selected')
      return
    }

    // Clear previous messages
    setErrorMessage(null)
    setSuccessMessage(null)

    // Validate inputs
    const validationErrors = validateAmounts()
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors.join('; '))
      return
    }

    // Parse amounts (allow 0 for one-sided positions)
    const baseAmount = baseAmountInput ? parseFloat(baseAmountInput) : 0
    const quoteAmount = quoteAmountInput ? parseFloat(quoteAmountInput) : 0

    if (minBinId === null || maxBinId === null) {
      setErrorMessage('Invalid price range')
      return
    }

    // Convert to lamports/smallest unit
    const baseDecimals = baseTokenBalance?.decimals ?? 9
    const quoteDecimals = quoteTokenBalance?.decimals ?? 9

    const baseAmountLamports = new BN(Math.floor(baseAmount * Math.pow(10, baseDecimals)))
    const quoteAmountLamports = new BN(Math.floor(quoteAmount * Math.pow(10, quoteDecimals)))

    // Map shape to strategy type
    const strategyTypeMap: Record<string, StrategyType> = {
      spot: StrategyType.Spot,
      curve: StrategyType.Curve,
      bidask: StrategyType.BidAsk,
    }
    const strategyType = strategyTypeMap[activeShape] ?? StrategyType.Spot

    setIsAdding(true)

    try {
      // Check if user has existing positions in this bin range
      const userPositions = await getUserPositions(publicKey.toString(), poolAddress)

      // Find if there's an existing position that overlaps with our range
      const existingPosition = userPositions.find(
        (pos) => pos.positionAccount.lowerBinId <= maxBinId && pos.positionAccount.upperBinId >= minBinId
      )

      let transaction
      let positionKeypair

      if (existingPosition) {
        transaction = await addLiquidityToPosition({
          poolAddress,
          userPublicKey: publicKey,
          totalXAmount: baseAmountLamports,
          totalYAmount: quoteAmountLamports,
          minBinId,
          maxBinId,
          strategyType,
          existingPositionPubKey: new PublicKey(existingPosition.publicKey),
        })
      } else {
        const result = await createPositionAndAddLiquidity({
          poolAddress,
          userPublicKey: publicKey,
          totalXAmount: baseAmountLamports,
          totalYAmount: quoteAmountLamports,
          minBinId,
          maxBinId,
          strategyType,
        })
        transaction = result.transaction
        positionKeypair = result.positionKeypair
      }

      // Pre-sign with position keypair BEFORE sending to Sanctum
      // This ensures the signature survives Sanctum's transaction rebuild
      if (positionKeypair) {
        transaction.partialSign(positionKeypair)
      }

      // Send via Sanctum (builder will handle blockhash/fees/tips and preserve signatures)
      if (!signTransaction) throw new Error('Wallet does not support transaction signing')
      const signature = await sendViaSanctum(
        transaction,
        connection,
        { signTransaction },
        { waitForCommitment: 'confirmed' }
      )

      setSuccessMessage(`Liquidity added! Tx: ${signature}`)

      // Clear form
      updateForm({ baseAmountInput: '', quoteAmountInput: '' })

      // Refresh balances
      const mintAddresses = [baseMint, quoteMint].filter((mint): mint is string => Boolean(mint))
      await refreshBalances(connection, publicKey, mintAddresses, { force: true })

    } catch (error) {
      console.error('[Meteora Manage] Add liquidity failed', error)

      let errorMsg = 'Failed to add liquidity'

      if (error instanceof Error) {
        // Check for common error patterns
        if (error.message.includes('insufficient lamports')) {
          errorMsg = `Insufficient SOL for transaction fees and rent. Please ensure you have at least 0.0575 SOL extra for creating the position.`
        } else if (error.message.includes('User rejected')) {
          errorMsg = 'Transaction was rejected by user'
        } else if (error.message.includes('Transaction simulation failed')) {
          errorMsg = 'Transaction simulation failed. You may need more SOL for fees or the pool parameters are invalid.'
        } else {
          errorMsg = error.message
        }
      }

      setErrorMessage(errorMsg)
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveLiquidity = async (position: MeteoraDisplayPosition) => {
    if (!connected || !publicKey) {
      setWalletModalVisible(true)
      return
    }

    if (!poolAddress || !pool) {
      setRemoveError('No pool selected')
      return
    }

    if (!signTransaction) {
      setRemoveError('Wallet does not support transaction signing')
      return
    }

    setRemoveError(null)
    setRemoveSuccess(null)
    setRemovingMint(position.positionMint)

    try {
      // Execute remove liquidity via service layer
      const signature = await executeRemoveLiquidity({
        poolAddress,
        positionMint: position.positionMint,
        userPublicKey: publicKey,
        connection,
        signTransaction,
      })

      setRemoveSuccess(`Liquidity removed! Tx: ${signature}`)

      // Wait a moment for blockchain state to update
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Refresh balances
      const mintAddresses = [baseMint, quoteMint].filter((mint): mint is string => Boolean(mint))
      await refreshBalances(connection, publicKey, mintAddresses, { force: true })

      // Refresh positions list for this pool
      const updatedPositions = await getUserPositions(publicKey.toString(), poolAddress)
      const displayPositions = transformPositionsToDisplayFormat(
        updatedPositions,
        pool,
        baseTokenBalance?.decimals ?? 9,
        quoteTokenBalance?.decimals ?? 9
      )

      setPositions(displayPositions)

    } catch (error) {
      console.error('[Meteora Manage] Remove liquidity failed', error)
      setRemoveError(handleRemoveLiquidityError(error))
    } finally {
      setRemovingMint(null)
    }
  }

  return (
    <Card className="h-full rounded-2xl p-1">
      <div className="flex h-full flex-col gap-1">
        <ManageHeader
          onBack={onBack}
          label={label}
          priceLabel={priceLabel}
          priceToneClass={priceTone}
          activeTab={tab}
          onTabChange={(nextTab) => updateForm({ tab: nextTab })}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <div className="flex-1 overflow-auto">
          {tab === 'add' ? (
            <AddLiquidityForm
              baseAmountInput={baseAmountInput}
              quoteAmountInput={quoteAmountInput}
              onChangeBaseAmount={(value) => updateForm({ baseAmountInput: value })}
              onChangeQuoteAmount={(value) => updateForm({ quoteAmountInput: value })}
              baseBalanceLabel={baseBalanceLabel}
              quoteBalanceLabel={quoteBalanceLabel}
              shapeOptions={shapeOptions}
              activeShape={activeShape}
              onShapeChange={(shape) => updateForm({ activeShape: shape })}
              baseSymbol={baseSymbol}
              quoteSymbol={quoteSymbol}
              binData={binData}
              binLoading={binLoading}
              activeBinId={activeBinId}
              minBinId={minBinId}
              maxBinId={maxBinId}
              onRangeChange={handleRangeChange}
              displayMinPrice={displayMinPrice}
              displayMaxPrice={displayMaxPrice}
              minPricePercent={minPricePercent}
              maxPricePercent={maxPricePercent}
              numBins={numBins}
              onMinPriceChange={handleMinPriceChange}
              onMaxPriceChange={handleMaxPriceChange}
              errorMessage={errorMessage}
              successMessage={successMessage}
              isConnected={connected}
              onRequestConnect={() => setWalletModalVisible(true)}
              onSubmit={handleAddLiquidity}
              isSubmitting={isAdding}
              isSubmitDisabled={isAddDisabled}
            />
          ) : (
            <RemoveLiquidityPanel
              removeError={removeError}
              removeSuccess={removeSuccess}
              positionsLoading={positionsLoading}
              positionsError={positionsError}
              positions={positions}
              baseSymbol={baseSymbol}
              quoteSymbol={quoteSymbol}
              removingMint={removingMint}
              onRemove={handleRemoveLiquidity}
              formatTokenAmount={formatTokenAmount}
              formatInteger={formatInteger}
              formatValueAmount={formatValueAmount}
            />
          )}
        </div>
      </div>
    </Card>
  )
}

export default MeteoraManage
