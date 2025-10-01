import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, MinusCircle, PlusCircle, Loader2, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useDappStore } from '@/store/dappStore'
import { useFetchPoolMetadata } from '../hooks/useFetchPoolMetadata'
import { useFetchBinDistribution } from '../hooks/useFetchBinDistribution'
import { LiquidityShape } from '@saros-finance/dlmm-sdk/types/services'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { PublicKey, Transaction, Keypair } from '@solana/web3.js'
import { createUniformDistribution, getMaxBinArray } from '@saros-finance/dlmm-sdk/utils'
import { getIdFromPrice, getPriceFromId } from '@saros-finance/dlmm-sdk/utils/price'
import { BIN_ARRAY_SIZE } from '@saros-finance/dlmm-sdk/constants'
import { addLiquidityToSarosPosition, createSarosPosition, getSarosUserPositions, getSarosPairAccount } from '../services/poolService'
import { getLiquidityBookService } from '../lib/liquidityBook'
import BinChart from './BinChart'

type ManageTab = 'add' | 'remove'

interface SarosManageProps {
  onBack: () => void
}

const SarosManage = ({ onBack }: SarosManageProps) => {
  const pool = useDappStore((state) => state.saros.selectedPool)
  const { publicKey, connected } = useWallet()
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

      const signedTxs = await window.solana?.signAllTransactions?.(transactions)
      if (!signedTxs || signedTxs.length === 0) {
        throw new Error('Transaction signing failed')
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
    } catch (err) {
      console.error('Add liquidity error:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add liquidity')
    } finally {
      setIsAdding(false)
    }
  }

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
                <Input
                  value={baseAmountInput}
                  onChange={(e) => setBaseAmountInput(e.target.value)}
                  placeholder={`${pool.tokenX.symbol} 0.00`}
                  inputMode="decimal"
                  className="h-8 text-xs"
                />
                <Input
                  value={quoteAmountInput}
                  onChange={(e) => setQuoteAmountInput(e.target.value)}
                  placeholder={`${pool.tokenY.symbol} 0.00`}
                  inputMode="decimal"
                  className="h-8 text-xs"
                />
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
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border/40 p-4 text-xs text-muted-foreground">
              Remove liquidity controls coming soon for {label}.
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default SarosManage
