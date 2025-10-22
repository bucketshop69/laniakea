import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { useSarosPoolMetadata } from '../hooks/useFetchPoolMetadata'
import { useSarosBinDistribution } from '../hooks/useFetchBinDistribution'
import { LiquidityShape, RemoveLiquidityType } from '@saros-finance/dlmm-sdk/types/services'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { PublicKey, Transaction as Web3Transaction, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { sendManyViaSanctum, sendViaSanctum } from '@/lib/sanctumGateway'
import { createUniformDistribution, getMaxBinArray } from '@saros-finance/dlmm-sdk/utils'
import { getIdFromPrice, getPriceFromId } from '@saros-finance/dlmm-sdk/utils/price'
import { BIN_ARRAY_SIZE } from '@saros-finance/dlmm-sdk/constants'
import { addLiquidityToSarosPosition, createSarosPosition, removeSarosLiquidity } from '../services/liquidity'
import { getSarosUserPositions, getSarosBinsReserveInformation } from '../services/positions'
import { getSarosPairAccount } from '../services/pools'
import { getLiquidityBookService } from '../lib/liquidityBook'
import { useWalletBalanceStore, type WalletTokenBalance } from '@/store/walletBalanceStore'
import { getSolanaConnection } from '@/lib/solanaConnection'
import { useSarosStore, useSarosDataStore, type SarosManageFormState, type SarosManageTab } from '../state'
import ManageHeader from './manage/ManageHeader'
import AddLiquidityForm from './manage/AddLiquidityForm'
import RemoveLiquidityPanel, { type SarosDisplayPosition } from './manage/RemoveLiquidityPanel'

interface SarosManageProps {
  onBack: () => void
}

const SarosManage = ({ onBack }: SarosManageProps) => {
  const pool = useSarosDataStore((state) => state.data.selectedPool)
  const baseMint = pool?.tokenX.mintAddress ?? ''
  const quoteMint = pool?.tokenY.mintAddress ?? ''
  const { publicKey, connected, signTransaction, signAllTransactions } = useWallet()
  const connection = useMemo(() => getSolanaConnection(), [])
  const { setVisible: setWalletModalVisible } = useWalletModal()
  const [isAdding, setIsAdding] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [removeSuccess, setRemoveSuccess] = useState<string | null>(null)
  const [removingMint, setRemovingMint] = useState<string | null>(null)
  const [positionsLoading, setPositionsLoading] = useState(false)
  const [positionsError, setPositionsError] = useState<string | null>(null)
  type SarosPosition = {
    positionMint: string
    position: string
    lowerBinId: number
    upperBinId: number
    totalBins: number
    baseAmount: number
    quoteAmount: number
  }

  const [positions, setPositions] = useState<SarosPosition[]>([])
  const [positionsRefreshNonce, setPositionsRefreshNonce] = useState(0)
  const refreshBalances = useWalletBalanceStore((state) => state.refreshBalances)
  const isBalanceLoading = useWalletBalanceStore((state) => state.isLoading)
  const balancesError = useWalletBalanceStore((state) => state.error)
  const baseTokenBalance = useWalletBalanceStore((state) => (
    baseMint ? state.balancesByMint[baseMint] : undefined
  ))
  const quoteTokenBalance = useWalletBalanceStore((state) => (
    quoteMint ? state.balancesByMint[quoteMint] : undefined
  ))

  const poolAddress = pool?.pairs[0]?.pair ?? null
  const manageForm = useSarosStore((state) => (poolAddress ? state.manageForms[poolAddress] : undefined))
  const updateManageForm = useSarosStore((state) => state.updateManageForm)
  const setActiveView = useSarosStore((state) => state.setActiveView)
  const setSelectedPoolAddress = useSarosStore((state) => state.setSelectedPoolAddress)

  const tab: SarosManageTab = manageForm?.tab ?? 'add'
  const activeShape = manageForm?.activeShape ?? LiquidityShape.Spot
  const baseAmountInput = manageForm?.baseAmountInput ?? ''
  const quoteAmountInput = manageForm?.quoteAmountInput ?? ''
  const minBinId = manageForm?.minBinId ?? null
  const maxBinId = manageForm?.maxBinId ?? null

  const updateForm = useCallback((patch: Partial<SarosManageFormState>) => {
    if (!poolAddress) {
      return
    }
    updateManageForm(poolAddress, patch)
  }, [poolAddress, updateManageForm])
  const primaryPair = pool?.pairs[0]
  const {
    metadata,
    snapshot,
    isLoading,
    error,
  } = useSarosPoolMetadata({ poolAddress: poolAddress ?? undefined, enabled: Boolean(poolAddress) })

  const price = snapshot?.price ?? null
  const baseAmount = snapshot?.baseReserve ?? null
  const quoteAmount = snapshot?.quoteReserve ?? null
  const totalValueQuote = snapshot?.totalValueQuote ?? null

  const binDistributionParams = useMemo(() => {
    if (!primaryPair || !pool) return undefined
    return {
      pairAddress: primaryPair.pair,
      activeBin: primaryPair.activeBin,
      binStep: primaryPair.binStep,
      baseDecimals: pool.tokenX.decimals,
      quoteDecimals: pool.tokenY.decimals,
      range: 50,
    }
  }, [primaryPair, pool])

  const binDistributionConfig = useMemo(() => {
    if (!binDistributionParams) {
      return { enabled: false } as const
    }
    return { ...binDistributionParams, enabled: true } as const
  }, [binDistributionParams])

  const {
    data: binDistribution,
    isLoading: binLoading,
  } = useSarosBinDistribution(binDistributionConfig)

  useEffect(() => {
    setActiveView('manage')
  }, [setActiveView])

  useEffect(() => {
    if (poolAddress) {
      setSelectedPoolAddress(poolAddress)
    } else {
      setSelectedPoolAddress(null)
    }
  }, [poolAddress, setSelectedPoolAddress])

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

  useEffect(() => {
    if (binDistribution.length > 0 && minBinId === null && maxBinId === null && primaryPair) {
      const activeBin = primaryPair.activeBin
      updateForm({ minBinId: activeBin - 10, maxBinId: activeBin + 10 })
    }
  }, [binDistribution, minBinId, maxBinId, primaryPair, updateForm])

  const handleRangeChange = (newMinBinId: number, newMaxBinId: number) => {
    const numBins = newMaxBinId - newMinBinId + 1
    if (numBins > 63) {
      setErrorMessage('Range cannot exceed 63 bins')
      return
    }
    setErrorMessage(null)
    updateForm({ minBinId: newMinBinId, maxBinId: newMaxBinId })
  }

  const handleMinPriceChange = (value: string) => {
    if (!primaryPair || !pool) return
    const priceNum = parseFloat(value)
    if (!priceNum || priceNum <= 0) return

    const newMinBinId = getIdFromPrice(
      primaryPair.binStep,
      priceNum,
      pool.tokenX.decimals,
      pool.tokenY.decimals
    )

    if (maxBinId && newMinBinId >= maxBinId) {
      setErrorMessage('Min price must be less than max price')
      return
    }

    if (maxBinId && maxBinId - newMinBinId + 1 > 63) {
      setErrorMessage('Range cannot exceed 63 bins')
      return
    }

    setErrorMessage(null)
    updateForm({ minBinId: newMinBinId })
  }

  const handleMaxPriceChange = (value: string) => {
    if (!primaryPair || !pool) return
    const priceNum = parseFloat(value)
    if (!priceNum || priceNum <= 0) return

    const newMaxBinId = getIdFromPrice(
      primaryPair.binStep,
      priceNum,
      pool.tokenX.decimals,
      pool.tokenY.decimals
    )

    if (minBinId && newMaxBinId <= minBinId) {
      setErrorMessage('Max price must be greater than min price')
      return
    }

    if (minBinId && newMaxBinId - minBinId + 1 > 63) {
      setErrorMessage('Range cannot exceed 63 bins')
      return
    }

    setErrorMessage(null)
    updateForm({ maxBinId: newMaxBinId })
  }

  useEffect(() => {
    if (!metadata || !pool || baseAmount == null || quoteAmount == null) {
      return
    }

    console.log('[Saros SDK] Normalized reserves', {
      baseToken: pool.tokenX.symbol,
      baseAmount,
      quoteToken: pool.tokenY.symbol,
      quoteAmount,
      totalValueQuote,
      rawMetadata: metadata,
    })
  }, [metadata, pool, baseAmount, quoteAmount, totalValueQuote])

  if (!pool) {
    return (
      <Card className="flex h-full items-center justify-center rounded-2xl p-6 text-sm text-muted-foreground">
        Select a Saros pool from Discover to manage liquidity.
      </Card>
    )
  }

  const shapeOptions = useMemo(
    () => (
      [
        { id: LiquidityShape.Spot, label: 'Spot' },
        { id: LiquidityShape.Curve, label: 'Curve' },
        { id: LiquidityShape.BidAsk, label: 'Bid Ask' },
      ]
    ),
    []
  )

  const baseBalanceLabel = renderBalanceLabel(baseTokenBalance, pool.tokenX.symbol)
  const quoteBalanceLabel = renderBalanceLabel(quoteTokenBalance, pool.tokenY.symbol)
  const activeBinId = primaryPair?.activeBin ?? null
  const isAddDisabled = !baseAmountInput || !quoteAmountInput || minBinId === null || maxBinId === null

  const displayMinPrice = useMemo(() => {
    if (!primaryPair || !pool || minBinId === null) return null
    return getPriceFromId(primaryPair.binStep, minBinId, pool.tokenX.decimals, pool.tokenY.decimals)
  }, [primaryPair, pool, minBinId])

  const displayMaxPrice = useMemo(() => {
    if (!primaryPair || !pool || maxBinId === null) return null
    return getPriceFromId(primaryPair.binStep, maxBinId, pool.tokenX.decimals, pool.tokenY.decimals)
  }, [primaryPair, pool, maxBinId])

  const displayActiveBinPrice = useMemo(() => {
    if (!primaryPair || !pool) return null
    return getPriceFromId(primaryPair.binStep, primaryPair.activeBin, pool.tokenX.decimals, pool.tokenY.decimals)
  }, [primaryPair, pool])

  const label = `${pool.tokenX.symbol}/${pool.tokenY.symbol}`
  let priceTone = 'text-[11px] text-muted-foreground'
  let priceLabel = '—'
  if (isLoading) {
    priceLabel = 'Loading…'
  } else if (error) {
    priceTone = 'text-[11px] text-destructive'
    priceLabel = error
  } else if (metadata) {
    const effectivePrice = displayActiveBinPrice ?? price
    priceLabel = effectivePrice != null
      ? `1 ${pool.tokenX.symbol} ≈ ${effectivePrice.toFixed(6)} ${pool.tokenY.symbol}`
      : `Reserves: ${metadata.baseReserve} / ${metadata.quoteReserve}`
  }

  const minPricePercent = useMemo(() => {
    if (displayMinPrice === null || displayActiveBinPrice === null || displayActiveBinPrice === 0) return null
    return ((displayMinPrice - displayActiveBinPrice) / displayActiveBinPrice) * 100
  }, [displayMinPrice, displayActiveBinPrice])

  const maxPricePercent = useMemo(() => {
    if (displayMaxPrice === null || displayActiveBinPrice === null || displayActiveBinPrice === 0) return null
    return ((displayMaxPrice - displayActiveBinPrice) / displayActiveBinPrice) * 100
  }, [displayMaxPrice, displayActiveBinPrice])

  const numBins = useMemo(() => {
    if (minBinId === null || maxBinId === null) return 0
    return maxBinId - minBinId + 1
  }, [minBinId, maxBinId])

  const sanitizedPrice = useMemo(() => {
    if (price == null || Number.isNaN(price) || !Number.isFinite(price)) {
      return null
    }
    return price
  }, [price])

  const formatTokenAmount = useCallback((amount: number) => {
    if (!Number.isFinite(amount) || Number.isNaN(amount)) {
      return '—'
    }
    if (amount === 0) {
      return '0'
    }
    if (Math.abs(amount) >= 1) {
      return amount.toLocaleString(undefined, { maximumFractionDigits: 4 })
    }
    return amount.toLocaleString(undefined, { maximumSignificantDigits: 4 })
  }, [])

  const formatInteger = useCallback((value: number) => {
    if (!Number.isFinite(value) || Number.isNaN(value)) {
      return '—'
    }
    return Math.trunc(value).toLocaleString()
  }, [])

  const formatValueAmount = useCallback((value: number | null) => {
    if (value === null || !Number.isFinite(value) || Number.isNaN(value)) {
      return '—'
    }
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }, [])

  useEffect(() => {
    if (!successMessage) {
      return
    }

    const timeoutId = setTimeout(() => {
      setSuccessMessage(null)
    }, 30000)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [successMessage])

  const toBigIntSafe = useCallback((value: unknown): bigint => {
    if (typeof value === 'bigint') return value
    if (typeof value === 'number' && Number.isFinite(value)) {
      return BigInt(Math.floor(value))
    }
    if (typeof value === 'string') {
      try {
        return BigInt(value)
      } catch {
        return 0n
      }
    }
    if (value && typeof value === 'object' && 'toString' in value) {
      try {
        return BigInt((value as { toString(): string }).toString())
      } catch {
        return 0n
      }
    }
    return 0n
  }, [])

  useEffect(() => {
    if (!connected || !publicKey || !pool || !poolAddress) {
      setPositions([])
      setPositionsError(null)
      return
    }

    let cancelled = false
    setPositionsLoading(true)
    setPositionsError(null)

    const pairKey = new PublicKey(poolAddress)
    const baseDecimals = pool.tokenX.decimals
    const quoteDecimals = pool.tokenY.decimals

    const fetchPositions = async () => {
      try {
        const userPositions = await getSarosUserPositions(publicKey.toString(), poolAddress)
        if (userPositions.length === 0) {
          if (!cancelled) {
            setPositions([])
          }
          return
        }

        const enriched: SarosPosition[] = []
        for (const position of userPositions) {
          if (cancelled) break
          try {
            const reserves = await getSarosBinsReserveInformation({
              position: new PublicKey(position.position),
              pair: pairKey,
              payer: publicKey,
            })

            const baseRaw = reserves.reduce((acc, bin) => acc + toBigIntSafe(bin.reserveX), 0n)
            const quoteRaw = reserves.reduce((acc, bin) => acc + toBigIntSafe(bin.reserveY), 0n)

            enriched.push({
              positionMint: position.positionMint,
              position: position.position,
              lowerBinId: position.lowerBinId,
              upperBinId: position.upperBinId,
              totalBins: position.upperBinId - position.lowerBinId + 1,
              baseAmount: Number(baseRaw) / Math.pow(10, baseDecimals),
              quoteAmount: Number(quoteRaw) / Math.pow(10, quoteDecimals),
            })
          } catch (err) {
            console.error('Failed to fetch reserves for position', position.positionMint, err)
            enriched.push({
              positionMint: position.positionMint,
              position: position.position,
              lowerBinId: position.lowerBinId,
              upperBinId: position.upperBinId,
              totalBins: position.upperBinId - position.lowerBinId + 1,
              baseAmount: 0,
              quoteAmount: 0,
            })
          }
        }

        const sorted = enriched.sort((a, b) => a.lowerBinId - b.lowerBinId)

        if (!cancelled) {
          setPositions(sorted)
        }
      } catch (err) {
        console.error('Failed to load Saros positions', err)
        if (!cancelled) {
          setPositions([])
          setPositionsError(err instanceof Error ? err.message : 'Failed to load positions')
        }
      } finally {
        if (!cancelled) {
          setPositionsLoading(false)
        }
      }
    }

    void fetchPositions()

    return () => {
      cancelled = true
    }
  }, [connected, publicKey, pool, poolAddress, toBigIntSafe, positionsRefreshNonce])

  const displayPositions = useMemo<SarosDisplayPosition[]>(() => {
    return positions.map((position) => {
      const totalValue = sanitizedPrice != null
        ? position.baseAmount * sanitizedPrice + position.quoteAmount
        : null
      return {
        ...position,
        totalValue,
      }
    })
  }, [positions, sanitizedPrice])

  const handleAddLiquidity = async () => {
    if (!connected || !publicKey) {
      setWalletModalVisible(true)
      return
    }

    if (!pool || !poolAddress) {
      setErrorMessage('No pool selected')
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)

    const baseAmount = parseFloat(baseAmountInput)
    const quoteAmount = parseFloat(quoteAmountInput)

    if (!baseAmount || !quoteAmount || baseAmount <= 0 || quoteAmount <= 0) {
      setErrorMessage('Please enter valid amounts')
      return
    }

    if (minBinId === null || maxBinId === null) {
      setErrorMessage('Please select a price range on the chart')
      return
    }

    if (minBinId >= maxBinId) {
      setErrorMessage('Min bin must be less than max bin')
      return
    }

    setIsAdding(true)

    try {
      const service = getLiquidityBookService()
      const lbConnection = service.connection

      const pairKey = new PublicKey(poolAddress)
      const pairAccount = await getSarosPairAccount(poolAddress)

      const activeBinId = pairAccount.activeId

      const relativeBinRange: [number, number] = [
        minBinId - activeBinId,
        maxBinId - activeBinId,
      ]

      const liquidityDistribution = createUniformDistribution({
        shape: activeShape,
        binRange: relativeBinRange,
      })

      const binArrays = getMaxBinArray(relativeBinRange, activeBinId)
      const binArray = binArrays[0]
      if (!binArray) {
        throw new Error('Failed to calculate bin arrays')
      }

      const binArrayLowerIndex = binArray.binArrayLowerIndex
      const binArrayUpperIndex = binArray.binArrayUpperIndex

      const binArrayLower = PublicKey.findProgramAddressSync(
        [
          Buffer.from('bin_array', 'utf8'),
          pairKey.toBuffer(),
          new Uint8Array(new Int32Array([binArrayLowerIndex]).buffer),
        ],
        service.lbProgram.programId
      )[0]

      const binArrayUpper = PublicKey.findProgramAddressSync(
        [
          Buffer.from('bin_array', 'utf8'),
          pairKey.toBuffer(),
          new Uint8Array(new Int32Array([binArrayUpperIndex]).buffer),
        ],
        service.lbProgram.programId
      )[0]

      const userPositions = await getSarosUserPositions(
        publicKey.toString(),
        poolAddress
      )

      const existingPosition = userPositions.find(
        (p) =>
          p.lowerBinId <= minBinId &&
          p.upperBinId >= maxBinId
      )

      let positionMintKey: PublicKey
      let positionMintKeypair: Keypair | null = null
      const transactions: Web3Transaction[] = []

      if (!existingPosition) {
        const createPositionTx = new Web3Transaction()
        const positionMint = Keypair.generate()
        positionMintKey = positionMint.publicKey
        positionMintKeypair = positionMint

        await createSarosPosition({
          pair: pairKey,
          payer: publicKey,
          relativeBinIdLeft: relativeBinRange[0],
          relativeBinIdRight: relativeBinRange[1],
          binArrayIndex: binArrayLowerIndex,
          positionMint: positionMintKey,
          transaction: createPositionTx as any,
        })

        const { blockhash, lastValidBlockHeight } = await lbConnection.getLatestBlockhash('confirmed')
        createPositionTx.recentBlockhash = blockhash
        createPositionTx.feePayer = publicKey
        createPositionTx.partialSign(positionMint)

        transactions.push(createPositionTx)
      } else {
        positionMintKey = new PublicKey(existingPosition.positionMint)
      }

      const addLiquidityTx = new Web3Transaction()

      const baseAmountWei = Math.floor(baseAmount * Math.pow(10, pool.tokenX.decimals))
      const quoteAmountWei = Math.floor(quoteAmount * Math.pow(10, pool.tokenY.decimals))

      console.log('[Saros Manage] Add liquidity params', {
        positionMint: positionMintKey.toString(),
        payer: publicKey.toString(),
        pair: pairKey.toString(),
        liquidityDistribution,
        amountX: baseAmountWei,
        amountY: quoteAmountWei,
        binArrayLower: binArrayLower.toString(),
        binArrayUpper: binArrayUpper.toString(),
        minBinId,
        maxBinId,
        activeBinId,
        relativeBinRange,
        shape: activeShape,
      })

      await addLiquidityToSarosPosition({
        positionMint: positionMintKey,
        payer: publicKey,
        pair: pairKey,
        transaction: addLiquidityTx as any,
        liquidityDistribution,
        amountX: baseAmountWei,
        amountY: quoteAmountWei,
        binArrayLower,
        binArrayUpper,
      })

      const { blockhash, lastValidBlockHeight } = await lbConnection.getLatestBlockhash('confirmed')
      addLiquidityTx.recentBlockhash = blockhash
      addLiquidityTx.feePayer = publicKey
      if (positionMintKeypair) {
        const needsPositionSignature = addLiquidityTx.signatures.some((entry) => entry.publicKey.equals(positionMintKeypair.publicKey))
        if (needsPositionSignature) {
          addLiquidityTx.partialSign(positionMintKeypair)
        }
      }

      transactions.push(addLiquidityTx)

      const signatures: string[] = []
      for (const tx of transactions) {
        const sig = await sendViaSanctum(
          tx,
          lbConnection,
          { signTransaction: signTransaction! },
          { additionalSigners: positionMintKeypair ? [positionMintKeypair] : undefined, waitForCommitment: 'finalized' }
        )
        signatures.push(sig)
      }

      setSuccessMessage(`Liquidity added successfully! Signature: ${signatures[signatures.length - 1]}`)
      updateForm({ baseAmountInput: '', quoteAmountInput: '' })
      setPositionsRefreshNonce((nonce) => nonce + 1)

      const mintAddresses = [baseMint, quoteMint].filter((mint): mint is string => Boolean(mint))
      if (mintAddresses.length > 0) {
        void refreshBalances(connection, publicKey, mintAddresses, { force: true })
      }
    } catch (err) {
      console.error('Add liquidity error:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add liquidity')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveLiquidity = useCallback(async (position: SarosDisplayPosition) => {
    if (!connected || !publicKey) {
      setWalletModalVisible(true)
      return
    }

    if (!pool || !poolAddress) {
      setRemoveError('No pool selected')
      return
    }

    if (!pool.tokenX?.mintAddress || !pool.tokenY?.mintAddress) {
      setRemoveError('Pool token information unavailable')
      return
    }

    setRemoveError(null)
    setRemoveSuccess(null)
    setRemovingMint(position.positionMint)

    const service = getLiquidityBookService()
    const serviceConnection = service.connection

    try {
      const pairKey = new PublicKey(poolAddress)
      const pairAccount = await getSarosPairAccount(poolAddress)

      const removeResult = await removeSarosLiquidity({
        maxPositionList: [
          {
            position: position.position,
            start: position.lowerBinId,
            end: position.upperBinId,
            positionMint: position.positionMint,
          },
        ],
        payer: publicKey,
        type: RemoveLiquidityType.Both,
        pair: pairKey,
        tokenMintX: new PublicKey(pool.tokenX.mintAddress),
        tokenMintY: new PublicKey(pool.tokenY.mintAddress),
        activeId: pairAccount.activeId,
      })

      const rawTransactions: unknown[] = []
      if (removeResult.txCreateAccount) {
        rawTransactions.push(removeResult.txCreateAccount)
      }
      rawTransactions.push(...removeResult.txs)
      if (removeResult.txCloseAccount) {
        rawTransactions.push(removeResult.txCloseAccount)
      }

      if (rawTransactions.length === 0) {
        setRemoveError('No transactions generated for removal')
        return
      }

      const { blockhash, lastValidBlockHeight } = await serviceConnection.getLatestBlockhash('confirmed')

      const normalizeTransaction = (tx: unknown): Web3Transaction => {
        if (tx instanceof Web3Transaction) {
          tx.recentBlockhash = blockhash
          tx.lastValidBlockHeight = lastValidBlockHeight
          tx.feePayer = publicKey
          return tx
        }

        if (tx && typeof tx === 'object') {
          const candidate = tx as { serialize?: (options?: any) => Uint8Array | Buffer; feePayer?: PublicKey; recentBlockhash?: string; lastValidBlockHeight?: number }

          if (typeof candidate.serialize === 'function') {
            candidate.recentBlockhash = blockhash
            candidate.lastValidBlockHeight = lastValidBlockHeight
            if (!candidate.feePayer) {
              candidate.feePayer = publicKey
            }

            return Web3Transaction.from(
              candidate.serialize({ requireAllSignatures: false, verifySignatures: false })
            )
          }
        }

        if (tx instanceof Uint8Array) {
          const transaction = Web3Transaction.from(tx)
          transaction.recentBlockhash = blockhash
          transaction.lastValidBlockHeight = lastValidBlockHeight
          transaction.feePayer = publicKey
          return transaction
        }

        if (typeof ArrayBuffer !== 'undefined' && tx instanceof ArrayBuffer) {
          const transaction = Web3Transaction.from(new Uint8Array(tx))
          transaction.recentBlockhash = blockhash
          transaction.lastValidBlockHeight = lastValidBlockHeight
          transaction.feePayer = publicKey
          return transaction
        }

        if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(tx as ArrayBufferView)) {
          const view = tx as ArrayBufferView
          const buffer = new Uint8Array(view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength))
          const transaction = Web3Transaction.from(buffer)
          transaction.recentBlockhash = blockhash
          transaction.lastValidBlockHeight = lastValidBlockHeight
          transaction.feePayer = publicKey
          return transaction
        }

        throw new Error('Unsupported transaction format received from Saros SDK')
      }

      const transactions = rawTransactions.map(normalizeTransaction)

      for (const tx of transactions) {
        tx.recentBlockhash = blockhash
        tx.lastValidBlockHeight = lastValidBlockHeight
        tx.feePayer = publicKey
      }

      try {
        const feePromises = transactions.map(async (tx) => {
          const message = tx.compileMessage()
          const fee = await serviceConnection.getFeeForMessage(message as any, 'confirmed')
          return fee?.value ?? 0
        })
        const feesLamports = await Promise.all(feePromises)
        const totalLamports = feesLamports.reduce((acc, fee) => acc + fee, 0)
        console.log('[Saros Manage] Estimated remove liquidity network fee', {
          totalLamports,
          totalSol: totalLamports / LAMPORTS_PER_SOL,
          feesLamports,
        })
      } catch (feeError) {
        console.warn('[Saros Manage] Unable to estimate remove liquidity fee', feeError)
      }

      const signatures: string[] = []
      for (const tx of transactions) {
        const sig = await sendViaSanctum(
          tx,
          serviceConnection,
          { signTransaction: signTransaction! },
          { waitForCommitment: 'finalized' }
        )
        signatures.push(sig)
      }

      setRemoveSuccess(`Liquidity removed successfully! Signature: ${signatures[signatures.length - 1]}`)
      setPositionsRefreshNonce((nonce) => nonce + 1)

      const mintAddresses = [baseMint, quoteMint].filter((mint): mint is string => Boolean(mint))
      if (mintAddresses.length > 0) {
        void refreshBalances(connection, publicKey, mintAddresses, { force: true })
      }
    } catch (err) {
      console.error('Remove liquidity error:', err)
      setRemoveError(err instanceof Error ? err.message : 'Failed to remove liquidity')
    } finally {
      setRemovingMint(null)
    }
  }, [
    connected,
    publicKey,
    pool,
    poolAddress,
    baseMint,
    quoteMint,
    signAllTransactions,
    signTransaction,
    refreshBalances,
    connection,
    setWalletModalVisible,
  ])

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
              binData={binDistribution}
              binLoading={binLoading}
              activeBinId={activeBinId}
              minBinId={minBinId}
              maxBinId={maxBinId}
              onRangeChange={handleRangeChange}
              baseSymbol={pool.tokenX.symbol}
              quoteSymbol={pool.tokenY.symbol}
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
              positions={displayPositions}
              baseSymbol={pool.tokenX.symbol}
              quoteSymbol={pool.tokenY.symbol}
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

export default SarosManage
