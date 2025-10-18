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
import { createPositionAndAddLiquidity, addLiquidityToPosition } from '../services/liquidity'
import { StrategyType } from '../types/domain'
import ManageHeader from './manage/ManageHeader'
import AddLiquidityForm from './manage/AddLiquidityForm'
import RemoveLiquidityPanel, { type MeteoraDisplayPosition } from './manage/RemoveLiquidityPanel'

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
  const { signTransaction, sendTransaction } = useWallet()

  const tab: MeteoraManageTab = manageForm?.tab ?? 'add'
  const baseAmountInput = manageForm?.baseAmountInput ?? ''
  const quoteAmountInput = manageForm?.quoteAmountInput ?? ''

  // State for add liquidity
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  // State for remove liquidity
  const [removeError] = useState<string | null>(null)
  const [removeSuccess] = useState<string | null>(null)
  const [removingMint] = useState<string | null>(null)
  const [positionsLoading] = useState(false)
  const [positionsError] = useState<string | null>(null)
  const [positions] = useState<MeteoraDisplayPosition[]>([])

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
          console.log('[Meteora Manage] Initial active bin fetched', {
            binId: activeBin.binId,
            price: activeBin.price,
            pricePerToken: activeBin.pricePerToken,
          })
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
      console.log('[Meteora Manage] Skipping balance fetch - wallet not connected or no pool selected', {
        connected,
        publicKey: publicKey?.toString(),
        poolAddress: pool?.address,
      })
      return
    }

    const mintAddresses = [baseMint, quoteMint].filter((mint): mint is string => Boolean(mint))
    if (mintAddresses.length === 0) {
      console.log('[Meteora Manage] No mint addresses to fetch')
      return
    }

    console.log('[Meteora Manage] Fetching balances for mints', {
      baseMint,
      quoteMint,
      poolAddress: pool.address,
      walletAddress: publicKey.toString(),
    })

    void refreshBalances(connection, publicKey, mintAddresses, { force: true })
  }, [connected, publicKey, pool, baseMint, quoteMint, connection, refreshBalances])

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

  // Log balance state for debugging
  useEffect(() => {
    console.log('[Meteora Manage] Balance state updated', {
      baseMint,
      quoteMint,
      nativeBalanceSol,
      isBaseNativeSOL: baseMint === NATIVE_SOL_MINT,
      isQuoteNativeSOL: quoteMint === NATIVE_SOL_MINT,
      baseTokenBalance: baseTokenBalance ? {
        mint: baseTokenBalance.mint,
        uiAmount: baseTokenBalance.uiAmount,
        uiAmountString: baseTokenBalance.uiAmountString,
        decimals: baseTokenBalance.decimals,
        isNative: baseTokenBalance.isNative,
      } : null,
      quoteTokenBalance: quoteTokenBalance ? {
        mint: quoteTokenBalance.mint,
        uiAmount: quoteTokenBalance.uiAmount,
        uiAmountString: quoteTokenBalance.uiAmountString,
        decimals: quoteTokenBalance.decimals,
        isNative: quoteTokenBalance.isNative,
      } : null,
      isBalanceLoading,
      balancesError,
      baseBalanceLabel,
      quoteBalanceLabel,
      allBalancesInStore: Object.keys(balancesByMint).length,
      allMints: Object.keys(balancesByMint),
    })
  }, [baseMint, quoteMint, nativeBalanceSol, baseTokenBalance, quoteTokenBalance, isBalanceLoading, balancesError, baseBalanceLabel, quoteBalanceLabel, balancesByMint])

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

  const isAddDisabled = !baseAmountInput || !quoteAmountInput || minBinId === null || maxBinId === null

  // Handle range change from bin chart
  const handleRangeChange = (newMinBinId: number, newMaxBinId: number) => {
    updateForm({ minBinId: newMinBinId, maxBinId: newMaxBinId })
    console.log('[Meteora Manage] Bin range changed', {
      minBinId: newMinBinId,
      maxBinId: newMaxBinId,
      numBins: newMaxBinId - newMinBinId + 1,
    })
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

    // Parse amounts
    const baseAmount = parseFloat(baseAmountInput)
    const quoteAmount = parseFloat(quoteAmountInput)

    // Check if amounts are valid numbers
    if (!baseAmountInput || !Number.isFinite(baseAmount) || baseAmount <= 0) {
      errors.push(`Invalid ${baseSymbol} amount`)
    }

    if (!quoteAmountInput || !Number.isFinite(quoteAmount) || quoteAmount <= 0) {
      errors.push(`Invalid ${quoteSymbol} amount`)
    }

    // Check if user has sufficient balance
    if (baseTokenBalance && Number.isFinite(baseAmount) && baseAmount > 0) {
      if (baseAmount > baseTokenBalance.uiAmount) {
        errors.push(`Insufficient ${baseSymbol} balance (available: ${formatAvailable(baseTokenBalance)})`)
      }
    }

    if (quoteTokenBalance && Number.isFinite(quoteAmount) && quoteAmount > 0) {
      if (quoteAmount > quoteTokenBalance.uiAmount) {
        errors.push(`Insufficient ${quoteSymbol} balance (available: ${formatAvailable(quoteTokenBalance)})`)
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

      console.log('[Meteora] 🔵 Min price input → binId', {
        userInput: parsedPrice,
        foundBinId: binId,
        oldMinBinId: minBinId,
        maxBinId,
      })

      updateForm({ minBinId: binId })
      setErrorMessage(null)

      console.log('[Meteora] ✅ Reactive chain triggered - chart, brush, bins will update')
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

      console.log('[Meteora] 🔵 Max price input → binId', {
        userInput: parsedPrice,
        foundBinId: binId,
        minBinId,
        oldMaxBinId: maxBinId,
      })

      updateForm({ maxBinId: binId })
      setErrorMessage(null)

      console.log('[Meteora] ✅ Reactive chain triggered - chart, brush, bins will update')
    } catch (error) {
      console.error('[Meteora Manage] Failed to convert max price to bin ID', error)
      setErrorMessage('Failed to update max price')
    }
  }, [poolAddress, binData, displayMinPrice, updateForm])

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

    // Parse amounts
    const baseAmount = parseFloat(baseAmountInput)
    const quoteAmount = parseFloat(quoteAmountInput)

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
      console.log('[Meteora Manage] Adding liquidity', {
        poolAddress,
        baseAmount,
        quoteAmount,
        baseAmountLamports: baseAmountLamports.toString(),
        quoteAmountLamports: quoteAmountLamports.toString(),
        minBinId,
        maxBinId,
        strategyType,
      })

      // Check if user has existing positions in this bin range
      const userPositions = await getUserPositions(publicKey.toString(), poolAddress)

      // Find if there's an existing position that overlaps with our range
      const existingPosition = userPositions.find(
        (pos) => pos.positionAccount.lowerBinId <= maxBinId && pos.positionAccount.upperBinId >= minBinId
      )

      let transaction
      let positionKeypair

      if (existingPosition) {
        console.log('[Meteora Manage] Adding to existing position', existingPosition.publicKey)
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
        console.log('[Meteora Manage] Creating new position')
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

      // Sign and send transaction
      console.log('[Meteora Manage] Signing transaction')

      if (!signTransaction || !sendTransaction) {
        throw new Error('Wallet does not support transaction signing')
      }

      // Get latest blockhash
      const latestBlockhash = await connection.getLatestBlockhash()
      transaction.recentBlockhash = latestBlockhash.blockhash
      transaction.feePayer = publicKey

      // Partially sign with position keypair if creating new position
      if (positionKeypair) {
        transaction.partialSign(positionKeypair)
      }

      // Sign with wallet
      const signedTransaction = await signTransaction(transaction)

      // Send transaction
      const signature = await sendTransaction(signedTransaction, connection, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

      console.log('[Meteora Manage] Transaction sent', { signature })

      // Wait for confirmation
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      }, 'confirmed')

      console.log('[Meteora Manage] Transaction confirmed')

      setSuccessMessage(`Liquidity added successfully! Signature: ${signature.slice(0, 8)}...`)

      // Clear form
      updateForm({ baseAmountInput: '', quoteAmountInput: '' })

      // Refresh balances
      const mintAddresses = [baseMint, quoteMint].filter((mint): mint is string => Boolean(mint))
      await refreshBalances(connection, publicKey, mintAddresses, { force: true })

    } catch (error) {
      console.error('[Meteora Manage] Add liquidity failed', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to add liquidity'
      setErrorMessage(errorMsg)
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveLiquidity = (position: MeteoraDisplayPosition) => {
    if (!connected || !publicKey) {
      setWalletModalVisible(true)
      return
    }
    console.log('Remove liquidity clicked for position:', position)
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
