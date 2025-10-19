import { useState, useMemo, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createSarosPool } from '../services/liquidity'
import { sendViaSanctum } from '@/lib/sanctumGateway'
import { getLiquidityBookService } from '../lib/liquidityBook'
import { checkPoolExists, type SarosToken, type ExistingPool } from '../services/tokenService'
import { useSarosStore } from '../state'
import CreateTokenPairSection from './create/CreateTokenPairSection'
import CreateFeeTierSelector from './create/CreateFeeTierSelector'
import CreateExistingPoolsNotice from './create/CreateExistingPoolsNotice'
import CreatePriceInput from './create/CreatePriceInput'
import CreateStatusMessages from './create/CreateStatusMessages'

const SarosCreatePool = () => {
  const { publicKey, connected, signTransaction } = useWallet()
  const { setVisible: setWalletModalVisible } = useWalletModal()

  const createForm = useSarosStore((state) => state.createForm)
  const updateCreateForm = useSarosStore((state) => state.updateCreateForm)
  const resetCreateForm = useSarosStore((state) => state.resetCreateForm)
  const setActiveView = useSarosStore((state) => state.setActiveView)
  const setSelectedPoolAddress = useSarosStore((state) => state.setSelectedPoolAddress)

  const baseToken = createForm.baseToken
  const quoteToken = createForm.quoteToken
  const selectedBinStep = createForm.selectedBinStep
  const ratePriceInput = createForm.ratePriceInput
  const [isCreating, setIsCreating] = useState(false)
  const [isCheckingPool, setIsCheckingPool] = useState(false)
  const [existingPools, setExistingPools] = useState<ExistingPool[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isRatePriceDirty, setIsRatePriceDirty] = useState(false)

  const handleSelectBaseToken = (token: SarosToken) => {
    updateCreateForm({ baseToken: token })
  }

  const handleSelectQuoteToken = (token: SarosToken) => {
    updateCreateForm({ quoteToken: token })
  }

  const handleBinStepChange = (value: number) => {
    updateCreateForm({ selectedBinStep: value })
  }

  const handleRatePriceChange = (value: string) => {
    setIsRatePriceDirty(true)
    updateCreateForm({ ratePriceInput: value })
  }

  useEffect(() => {
    setActiveView('create')
    setSelectedPoolAddress(null)
  }, [setActiveView, setSelectedPoolAddress])

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

    return basePrice / quotePrice
  }, [baseToken, quoteToken])

  useEffect(() => {
    setIsRatePriceDirty(false)
  }, [baseToken?.address, quoteToken?.address])

  // Auto-populate price input when calculated price changes and user hasn't overridden it
  useEffect(() => {
    if (isRatePriceDirty) {
      return
    }

    if (calculatedPrice !== null) {
      const formatted = calculatedPrice.toFixed(8)
      if (ratePriceInput !== formatted) {
        updateCreateForm({ ratePriceInput: formatted })
      }
    } else if (ratePriceInput !== '') {
      updateCreateForm({ ratePriceInput: '' })
    }
  }, [calculatedPrice, isRatePriceDirty, ratePriceInput, updateCreateForm])

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
      const signature = await sendViaSanctum(tx as any, connection, { signTransaction: signTransaction! }, { waitForCommitment: 'finalized' })
      console.log('🔵 Transaction sent via Sanctum')

      setSuccessMessage(`Pool created successfully! Transaction: ${signature}`)

      // Reset form
      resetCreateForm()
      setIsRatePriceDirty(false)
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
        <CreateTokenPairSection
          baseToken={baseToken}
          quoteToken={quoteToken}
          onSelectBase={handleSelectBaseToken}
          onSelectQuote={handleSelectQuoteToken}
          disabled={isCreating}
        />

        <CreateFeeTierSelector
          selectedBinStep={selectedBinStep}
          onSelect={handleBinStepChange}
          disabled={isCreating}
        />

        <CreateExistingPoolsNotice
          isChecking={isCheckingPool}
          baseToken={baseToken}
          quoteToken={quoteToken}
          pools={existingPools}
        />

        <CreatePriceInput
          value={ratePriceInput}
          onChange={handleRatePriceChange}
          disabled={isCreating}
          baseToken={baseToken}
          quoteToken={quoteToken}
          isAutoCalculated={calculatedPrice !== null}
        />

        <CreateStatusMessages errorMessage={errorMessage} successMessage={successMessage} />

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
