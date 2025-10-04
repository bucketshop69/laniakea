import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, MinusCircle, PlusCircle, Loader2, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useDappStore } from '@/store/dappStore'
import { useFetchPoolMetadata } from '../hooks/useFetchPoolMetadata'
import { useFetchBinDistribution } from '../hooks/useFetchBinDistribution'
import { LiquidityShape, RemoveLiquidityType } from '@saros-finance/dlmm-sdk/types/services'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { PublicKey, Transaction, Keypair } from '@solana/web3.js'
import { createUniformDistribution, getMaxBinArray } from '@saros-finance/dlmm-sdk/utils'
import { getIdFromPrice, getPriceFromId } from '@saros-finance/dlmm-sdk/utils/price'
import { BIN_ARRAY_SIZE } from '@saros-finance/dlmm-sdk/constants'
import {
  addLiquidityToSarosPosition,
  createSarosPosition,
  getSarosUserPositions,
  getSarosPairAccount,
  getSarosBinsReserveInformation,
  removeSarosLiquidity,
} from '../services/poolService'
import { getLiquidityBookService } from '../lib/liquidityBook'
import { useWalletBalanceStore, type WalletTokenBalance } from '@/store/walletBalanceStore'
import { getSolanaConnection } from '@/lib/solanaConnection'
import BinChart from './BinChart'

type ManageTab = 'add' | 'remove'

interface SarosManageProps {
  onBack: () => void
}

const SarosManage = ({ onBack }: SarosManageProps) => {
  const pool = useDappStore((state) => state.saros.selectedPool)
  const baseMint = pool?.tokenX.mintAddress ?? ''
  const quoteMint = pool?.tokenY.mintAddress ?? ''
  const { publicKey, connected, signTransaction, signAllTransactions } = useWallet()
  const connection = useMemo(() => getSolanaConnection(), [])
  const { setVisible: setWalletModalVisible } = useWalletModal()
  const [tab, setTab] = useState<ManageTab>('add')
  const [activeShape, setActiveShape] = useState<LiquidityShape>(LiquidityShape.Spot)
  const [baseAmountInput, setBaseAmountInput] = useState('')
  const [quoteAmountInput, setQuoteAmountInput] = useState('')
  const [minBinId, setMinBinId] = useState<number | null>(null)
  const [maxBinId, setMaxBinId] = useState<number | null>(null)
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

  const poolAddress = pool?.pairs[0]?.pair
  const primaryPair = pool?.pairs[0]
  const {
    metadata,
    price,
    baseAmount,
    quoteAmount,
    totalValueQuote,
    isLoading,
    error,
  } = useFetchPoolMetadata(poolAddress)

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

  const { data: binDistribution, isLoading: binLoading } = useFetchBinDistribution(binDistributionParams)

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
      setMinBinId(activeBin - 10)
      setMaxBinId(activeBin + 10)
    }
  }, [binDistribution, minBinId, maxBinId, primaryPair])

  const handleRangeChange = (newMinBinId: number, newMaxBinId: number) => {
    const numBins = newMaxBinId - newMinBinId + 1
    if (numBins > 63) {
      setErrorMessage('Range cannot exceed 63 bins')
      return
    }
    setErrorMessage(null)
    setMinBinId(newMinBinId)
    setMaxBinId(newMaxBinId)
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
    setMinBinId(newMinBinId)
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
    setMaxBinId(newMaxBinId)
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

  const label = `${pool.tokenX.symbol}/${pool.tokenY.symbol}`
  let priceTone = 'text-[11px] text-muted-foreground'
  let priceLabel = '—'
  if (isLoading) {
    priceLabel = 'Loading…'
  } else if (error) {
    priceTone = 'text-[11px] text-red-400'
    priceLabel = error
  } else if (metadata) {
    priceLabel = price
      ? `1 ${pool.tokenX.symbol} ≈ ${Number(price).toFixed(6)} ${pool.tokenY.symbol}`
      : `Reserves: ${metadata.baseReserve} / ${metadata.quoteReserve}`
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
    if (price == null) return null
    const priceNumber = Number(price)
    return Number.isFinite(priceNumber) ? priceNumber : null
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

  const displayPositions = useMemo(() => {
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
      const connection = service.connection

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
      const transactions: Transaction[] = []

      if (!existingPosition) {
        const createPositionTx = new Transaction()
        const positionMint = Keypair.generate()
        positionMintKey = positionMint.publicKey

        await createSarosPosition({
          pair: pairKey,
          payer: publicKey,
          relativeBinIdLeft: relativeBinRange[0],
          relativeBinIdRight: relativeBinRange[1],
          binArrayIndex: binArrayLowerIndex,
          positionMint: positionMintKey,
          transaction: createPositionTx as any,
        })

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
        createPositionTx.recentBlockhash = blockhash
        createPositionTx.feePayer = publicKey
        createPositionTx.partialSign(positionMint)
        
        transactions.push(createPositionTx)
      } else {
        positionMintKey = new PublicKey(existingPosition.positionMint)
      }

      const addLiquidityTx = new Transaction()

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

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
      addLiquidityTx.recentBlockhash = blockhash
      addLiquidityTx.feePayer = publicKey
      
      transactions.push(addLiquidityTx)

      let signedTxs: Transaction[]
      if (signAllTransactions) {
        signedTxs = await signAllTransactions(transactions)
      } else if (signTransaction) {
        signedTxs = []
        for (const tx of transactions) {
          signedTxs.push(await signTransaction(tx))
        }
      } else {
        throw new Error('Connected wallet does not support transaction signing')
      }

      const signatures: string[] = []
      for (const signedTx of signedTxs) {
        const signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        })
        signatures.push(signature)

        await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          'finalized'
        )
      }

      setSuccessMessage(`Liquidity added successfully! Signature: ${signatures[signatures.length - 1]}`)
      setBaseAmountInput('')
      setQuoteAmountInput('')
      setPositionsRefreshNonce((nonce) => nonce + 1)
    } catch (err) {
      console.error('Add liquidity error:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add liquidity')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveLiquidity = useCallback(async (position: SarosPosition) => {
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

      const transactions: Transaction[] = []
      if (removeResult.txCreateAccount) {
        transactions.push(removeResult.txCreateAccount)
      }
      transactions.push(...removeResult.txs)
      if (removeResult.txCloseAccount) {
        transactions.push(removeResult.txCloseAccount)
      }

      if (transactions.length === 0) {
        setRemoveError('No transactions generated for removal')
        return
      }

      const { blockhash, lastValidBlockHeight } = await serviceConnection.getLatestBlockhash('confirmed')

      for (const tx of transactions) {
        tx.recentBlockhash = blockhash
        tx.lastValidBlockHeight = lastValidBlockHeight
        tx.feePayer = publicKey
      }

      let signedTxs: Transaction[]
      if (signAllTransactions) {
        signedTxs = await signAllTransactions(transactions)
      } else if (signTransaction) {
        signedTxs = []
        for (const tx of transactions) {
          signedTxs.push(await signTransaction(tx))
        }
      } else {
        throw new Error('Connected wallet does not support transaction signing')
      }

      const signatures: string[] = []
      for (const signedTx of signedTxs) {
        const signature = await serviceConnection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        })
        signatures.push(signature)

        await serviceConnection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          'finalized'
        )
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
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={onBack}
              aria-label="Back to pools"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-primary leading-none">{label}</span>
              <span className={priceTone}>{priceLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {[
              { id: 'add' as ManageTab, label: 'Add Liquidity', icon: PlusCircle },
              { id: 'remove' as ManageTab, label: 'Remove Liquidity', icon: MinusCircle },
            ].map(({ id, label: tabLabel, icon: Icon }) => {
              const isActive = tab === id
              return (
                <Button
                  key={id}
                  type="button"
                  variant="ghost"
                  className={`relative h-8 px-3 text-xs transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                    }`}
                  onClick={() => setTab(id)}
                >
                  <span className="flex items-center gap-1">
                    <Icon className="h-4 w-4" />
                    {tabLabel}
                  </span>
                  <span
                    className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full transition-colors ${isActive ? 'bg-primary' : 'bg-transparent'
                      }`}
                  ></span>
                </Button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {tab === 'add' ? (
            <div className="flex h-full flex-col gap-2 rounded-xl border border-border/40 p-2 text-xs">
              {/* Token Amounts - Compact Side by Side */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <Input
                    value={baseAmountInput}
                    onChange={(e) => setBaseAmountInput(e.target.value)}
                    placeholder={`${pool.tokenX.symbol} 0.00`}
                    inputMode="decimal"
                    className="h-8 text-xs"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {renderBalanceLabel(baseTokenBalance, pool.tokenX.symbol)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <Input
                    value={quoteAmountInput}
                    onChange={(e) => setQuoteAmountInput(e.target.value)}
                    placeholder={`${pool.tokenY.symbol} 0.00`}
                    inputMode="decimal"
                    className="h-8 text-xs"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {renderBalanceLabel(quoteTokenBalance, pool.tokenY.symbol)}
                  </span>
                </div>
              </div>

              {/* Strategy Selector - Compact Row */}
              <div className="grid grid-cols-3 gap-1">
                {shapeOptions.map((option) => (
                  <Button
                    key={option.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-7 text-xs',
                      activeShape === option.id ? 'border border-primary bg-primary/10 text-primary' : 'border border-transparent'
                    )}
                    onClick={() => setActiveShape(option.id)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              {/* Bin Chart - Compact */}
              <div className="relative h-[220px] rounded-lg border border-border/40 bg-card/30 p-2">
                {binLoading ? (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Loading bins...</span>
                  </div>
                ) : binDistribution.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No liquidity data available
                  </div>
                ) : primaryPair && minBinId !== null && maxBinId !== null ? (
                  <BinChart
                    binData={binDistribution}
                    activeBinId={primaryPair.activeBin}
                    minBinId={minBinId}
                    maxBinId={maxBinId}
                    onRangeChange={handleRangeChange}
                    baseSymbol={pool.tokenX.symbol}
                    quoteSymbol={pool.tokenY.symbol}
                  />
                ) : null}
              </div>

              {/* Price Range Inputs - Editable */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                    Min Price
                    {minPricePercent !== null && (
                      <span className={cn('ml-1', minPricePercent < 0 ? 'text-red-400' : 'text-blue-400')}>
                        ({minPricePercent >= 0 ? '+' : ''}{minPricePercent.toFixed(1)}%)
                      </span>
                    )}
                  </label>
                  <Input
                    type="text"
                    value={displayMinPrice !== null ? displayMinPrice.toFixed(8) : ''}
                    onChange={(e) => handleMinPriceChange(e.target.value)}
                    onBlur={(e) => handleMinPriceChange(e.target.value)}
                    placeholder="Min price"
                    className="h-7 text-xs"
                    inputMode="decimal"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                    Max Price
                    {maxPricePercent !== null && (
                      <span className={cn('ml-1', maxPricePercent < 0 ? 'text-red-400' : 'text-blue-400')}>
                        ({maxPricePercent >= 0 ? '+' : ''}{maxPricePercent.toFixed(1)}%)
                      </span>
                    )}
                  </label>
                  <Input
                    type="text"
                    value={displayMaxPrice !== null ? displayMaxPrice.toFixed(8) : ''}
                    onChange={(e) => handleMaxPriceChange(e.target.value)}
                    onBlur={(e) => handleMaxPriceChange(e.target.value)}
                    placeholder="Max price"
                    className="h-7 text-xs"
                    inputMode="decimal"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                    Bins
                  </label>
                  <Input
                    type="text"
                    value={numBins}
                    disabled
                    className="h-7 bg-muted text-xs text-center"
                  />
                </div>
              </div>

              {/* Messages and Action Button */}
              {errorMessage && (
                <Card className="border-red-500/50 bg-red-500/10 p-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-[10px] text-red-500">{errorMessage}</p>
                  </div>
                </Card>
              )}

              {successMessage && (
                <Card className="border-green-500/50 bg-green-500/10 p-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-green-500 shrink-0" />
                    <p className="text-[10px] text-green-500 break-all">{successMessage}</p>
                  </div>
                </Card>
              )}

              {!connected ? (
                <Button type="button" size="sm" className="w-full text-xs" onClick={() => setWalletModalVisible(true)}>
                  Connect Wallet
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="w-full text-xs"
                  onClick={handleAddLiquidity}
                  disabled={isAdding || !baseAmountInput || !quoteAmountInput || minBinId === null || maxBinId === null}
                >
                  {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isAdding ? 'Adding Liquidity...' : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Liquidity
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col gap-2 rounded-xl border border-border/40 p-2 text-xs">
              {removeError && (
                <Card className="border-red-500/50 bg-red-500/10 p-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-[10px] text-red-500">{removeError}</p>
                  </div>
                </Card>
              )}
              {removeSuccess && (
                <Card className="border-green-500/50 bg-green-500/10 p-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-green-500 shrink-0" />
                    <p className="text-[10px] text-green-500 break-all">{removeSuccess}</p>
                  </div>
                </Card>
              )}
              {positionsLoading ? (
                <div className="flex flex-1 items-center justify-center text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading positions…
                </div>
              ) : positionsError ? (
                <Card className="border-red-500/50 bg-red-500/10 p-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-[10px] text-red-500">{positionsError}</p>
                  </div>
                </Card>
              ) : displayPositions.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/40 p-4 text-muted-foreground">
                  No Saros liquidity positions found for this pool.
                </div>
              ) : (
                <div className="flex flex-1 flex-col gap-2 overflow-auto">
                  {displayPositions.map((position, index) => {
                    const headerLabel = `${pool.tokenX.symbol} / ${pool.tokenY.symbol} — Position #${index + 1}`
                    const valueLabel = position.totalValue !== null
                      ? `≈ ${formatValueAmount(position.totalValue)} ${pool.tokenY.symbol}`
                      : '—'
                    const rangeLabel = `${formatInteger(position.lowerBinId)} → ${formatInteger(position.upperBinId)}`
                    return (
                      <Card
                        key={position.positionMint}
                        className="rounded-lg border border-border/50 bg-card/40 p-3"
                      >
                        <div className="flex items-center justify-between text-[11px] font-medium text-primary/80">
                          <span>{headerLabel}</span>
                          <span className="text-muted-foreground">{valueLabel}</span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span>Token X</span>
                              <span className="text-primary/80">{formatTokenAmount(position.baseAmount)} {pool.tokenX.symbol}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Token Y</span>
                              <span className="text-primary/80">{formatTokenAmount(position.quoteAmount)} {pool.tokenY.symbol}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span>Bin Range</span>
                              <span className="text-primary/80">{rangeLabel}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Total Bins</span>
                              <span className="text-primary/80">{formatInteger(position.totalBins)}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          className="mt-3 w-full text-xs"
                          onClick={() => handleRemoveLiquidity(position)}
                          disabled={removingMint === position.positionMint}
                        >
                          {removingMint === position.positionMint && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {removingMint === position.positionMint ? 'Removing Liquidity…' : 'Remove Liquidity'}
                        </Button>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default SarosManage
