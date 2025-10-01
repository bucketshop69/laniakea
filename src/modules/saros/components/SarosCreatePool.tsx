import { useState, useMemo, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { AlertCircle, Loader2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { createSarosPool } from '../services/poolService'
import { getLiquidityBookService } from '../lib/liquidityBook'
import TokenSelector from './TokenSelector'
import { checkPoolExists, type SarosToken, type ExistingPool } from '../services/tokenService'

const binStepOptions = [
  { binStep: 1, label: '0.01% - Ultra stable', fee: '0.01%' },
  { binStep: 2, label: '0.02% - Very stable', fee: '0.02%' },
  { binStep: 5, label: '0.05% - Stable (Base Fee)', fee: '5%' },
  { binStep: 10, label: '0.10% - Standard', fee: '0.10%' },
  { binStep: 20, label: '0.20% - Medium', fee: '0.20%' },
  { binStep: 50, label: '0.50% - High', fee: '0.50%' },
  { binStep: 100, label: '1.00% - Very high', fee: '1.00%' },
  { binStep: 200, label: '2.00% - Extreme', fee: '2.00%' },
]

const SarosCreatePool = () => {
  const { publicKey, connected, signTransaction } = useWallet()
  const { setVisible: setWalletModalVisible } = useWalletModal()

  const [baseToken, setBaseToken] = useState<SarosToken | null>(null)
  const [quoteToken, setQuoteToken] = useState<SarosToken | null>(null)
  const [selectedBinStep, setSelectedBinStep] = useState(5) // Default to base fee 5%
  const [ratePriceInput, setRatePriceInput] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isCheckingPool, setIsCheckingPool] = useState(false)
  const [existingPools, setExistingPools] = useState<ExistingPool[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Auto-calculate initial price from base to quote
  const calculatedPrice = useMemo(() => {
    if (!baseToken?.current_price || !quoteToken?.current_price) {
      return null
    }
    const basePrice = parseFloat(baseToken.current_price)
    const quotePrice = parseFloat(quoteToken.current_price)

    if (!Number.isFinite(basePrice) || !Number.isFinite(quotePrice) || basePrice === 0) {
      return null
    }

    return quotePrice / basePrice
  }, [baseToken, quoteToken])

  // Auto-populate price input when calculated price changes
  useEffect(() => {
    if (calculatedPrice !== null) {
      setRatePriceInput(calculatedPrice.toFixed(8))
    } else {
      setRatePriceInput('')
    }
  }, [calculatedPrice])

  // Check for existing pools whenever tokens change
  useEffect(() => {
    if (!baseToken?.address || !quoteToken?.address) {
      setExistingPools([])
      return
    }

    setIsCheckingPool(true)
    setExistingPools([])

    checkPoolExists(baseToken.address, quoteToken.address)
      .then((pools) => {
        setExistingPools(pools)
      })
      .catch((err) => {
        console.error('Failed to check pool existence:', err)
      })
      .finally(() => {
        setIsCheckingPool(false)
      })
  }, [baseToken?.address, quoteToken?.address])

  const handleCreatePool = async () => {
    if (!connected || !publicKey) {
      setWalletModalVisible(true)
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)

    // Validation
    if (!baseToken) {
      setErrorMessage('Please select a base token')
      return
    }

    if (!quoteToken) {
      setErrorMessage('Please select a quote token')
      return
    }

    if (baseToken.address === quoteToken.address) {
      setErrorMessage('Base and quote tokens must be different')
      return
    }

    const price = parseFloat(ratePriceInput)
    if (!ratePriceInput || !Number.isFinite(price) || price <= 0) {
      setErrorMessage('Please enter a valid price greater than 0')
      return
    }

    setIsCreating(true)

    try {
      const service = getLiquidityBookService()
      const connection = service.connection

      const poolParams = {
        tokenBaseMint: baseToken.address,
        tokenBaseDecimals: baseToken.decimals,
        tokenQuoteMint: quoteToken.address,
        tokenQuoteDecimals: quoteToken.decimals,
        ratePrice: price,
        binStep: selectedBinStep,
        payer: publicKey,
      }

      console.log('🔵 Create Pool Parameters:', {
        baseToken: {
          symbol: baseToken.symbol,
          address: baseToken.address,
          decimals: baseToken.decimals,
        },
        quoteToken: {
          symbol: quoteToken.symbol,
          address: quoteToken.address,
          decimals: quoteToken.decimals,
        },
        ratePrice: price,
        binStep: selectedBinStep,
        payer: publicKey.toBase58(),
      })

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash({
        commitment: 'confirmed',
      })

      const { tx } = await createSarosPool(poolParams)

      tx.recentBlockhash = blockhash
      tx.feePayer = publicKey

      console.log('🔵 Transaction details:', {
        instructionsCount: tx.instructions.length,
        feePayer: tx.feePayer?.toBase58(),
        recentBlockhash: tx.recentBlockhash,
      })

      console.log('🔵 Transaction instructions:', tx.instructions.map((ix, i) => ({
        index: i,
        programId: ix.programId.toBase58(),
        keys: ix.keys.length,
      })))

      // Sign and send transaction
      console.log('🔵 Requesting wallet signature...')
      if (!signTransaction) {
        throw new Error('Wallet does not support transaction signing')
      }
      const signedTx = await signTransaction(tx as any)
      console.log('🔵 Transaction signed successfully')

      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        'finalized'
      )

      setSuccessMessage(`Pool created successfully! Transaction: ${signature}`)

      // Reset form
      setBaseToken(null)
      setQuoteToken(null)
      setSelectedBinStep(5)
      setRatePriceInput('')
    } catch (err) {
      console.error('Create pool error:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create pool')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Configure your Dynamic Liquidity Market Maker pool parameters
        </p>
      </div>

      <div className="space-y-4">
        {/* Token Selection - 6 cols each */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <TokenSelector
              label="Base Token"
              selectedToken={baseToken}
              onSelect={setBaseToken}
              disabled={isCreating}
            />
          </div>
          <div className="col-span-6">
            <TokenSelector
              label="Quote Token"
              selectedToken={quoteToken}
              onSelect={setQuoteToken}
              disabled={isCreating}
            />
          </div>
        </div>

        {/* Bin Step Selection - 3 per row, 4 cols each */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-primary">Fee Tier (Bin Step)</label>
          <div className="grid grid-cols-12 gap-1">
            {binStepOptions.map((option) => (
              <label
                key={option.binStep}
                className={`col-span-4 flex items-center gap-2 rounded-lg border p-1 cursor-pointer transition-colors ${selectedBinStep === option.binStep
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
                  }`}
              >
                <input
                  type="radio"
                  name="binStep"
                  value={option.binStep}
                  checked={selectedBinStep === option.binStep}
                  onChange={(e) => setSelectedBinStep(Number(e.target.value))}
                  disabled={isCreating}
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-primary truncate">
                    {option.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Fee: {option.fee}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Existing Pools Warning */}
        {isCheckingPool && baseToken && quoteToken && (
          <Card className="border-blue-500/50 bg-blue-500/10 p-3">
            <div className="flex items-start gap-2">
              <Loader2 className="h-5 w-5 text-blue-500 mt-0.5 shrink-0 animate-spin" />
              <p className="text-sm text-blue-500">Checking for existing pools...</p>
            </div>
          </Card>
        )}

        {existingPools.length > 0 && (
          <Card className="border-yellow-500/50 bg-yellow-500/10 p-3">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-yellow-500">
                  {existingPools.length} pool{existingPools.length > 1 ? 's' : ''} already exist for this token pair
                </p>
                <div className="space-y-2">
                  {existingPools.map((pool) => (
                    <div key={pool._id} className="text-xs text-muted-foreground bg-background/50 rounded p-2">
                      <div className="font-medium">
                        {pool.tokenX.symbol?.toUpperCase() || 'TOKEN'} / {pool.tokenY.symbol?.toUpperCase() || 'TOKEN'}
                      </div>
                      <div className="mt-1">Bin Step: {pool.binStep} ({(pool.binStep / 100).toFixed(2)}%)</div>
                      <div className="mt-1 font-mono text-[10px] truncate">Pool: {pool.pair}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-yellow-500">
                  Consider using an existing pool or choose a different bin step if you want to create a new one.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Initial Price - Auto-populated but editable */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-primary">
            Initial Price {calculatedPrice && '(Auto-calculated - Editable)'}
          </label>
          <Input
            type="number"
            placeholder="Enter price or select tokens to auto-calculate"
            value={ratePriceInput}
            onChange={(e) => setRatePriceInput(e.target.value)}
            disabled={isCreating}
            step="0.00000001"
            min="0"
          />
          {baseToken && quoteToken && baseToken.symbol && quoteToken.symbol && (
            <p className="text-xs text-muted-foreground">
              1 {baseToken.symbol?.toUpperCase() || 'BASE'} = {ratePriceInput || '?'}{' '}
              {quoteToken.symbol?.toUpperCase() || 'QUOTE'}
              <br />
              Based on current market prices: {baseToken.symbol.toUpperCase()} ($
              {parseFloat(baseToken.current_price).toFixed(6)}) / {quoteToken.symbol.toUpperCase()}{' '}
              (${parseFloat(quoteToken.current_price).toFixed(6)})
            </p>
          )}
        </div>

        {/* Error Message */}
        {errorMessage && (
          <Card className="border-red-500/50 bg-red-500/10 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-500">{errorMessage}</p>
            </div>
          </Card>
        )}

        {/* Success Message */}
        {successMessage && (
          <Card className="border-green-500/50 bg-green-500/10 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <p className="text-sm text-green-500 break-all">{successMessage}</p>
            </div>
          </Card>
        )}

        {/* Create Button or Connect Wallet */}
        {!connected ? (
          <Button onClick={() => setWalletModalVisible(true)} className="w-full">
            Connect Wallet
          </Button>
        ) : (
          <Button
            onClick={handleCreatePool}
            disabled={isCreating || !baseToken || !quoteToken || !ratePriceInput}
            className="w-full"
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCreating ? 'Creating Pool...' : 'Create Pool'}
          </Button>
        )}
      </div>
    </div>
  )
}

export default SarosCreatePool
