import {
  DriftClient,
  type DriftEnv,
  type IWallet,
  getMarketsAndOraclesForSubscription,
  initialize,
} from '@drift-labs/sdk'
import { Keypair, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'
import { getSolanaConnection } from '@/lib/solanaConnection'

const DRIFT_ENV: DriftEnv = 'mainnet-beta'

let clientInstance: DriftClient | null = null
let currentWallet: IWallet | null = null
let isReadOnlyWallet = false
let initializationPromise: Promise<DriftClient> | null = null

const isVersionedTransaction = (tx: Transaction | VersionedTransaction): tx is VersionedTransaction =>
  typeof (tx as VersionedTransaction).version !== 'undefined'

const createReadOnlyWallet = (): IWallet => {
  const keypair = Keypair.generate()

  return {
    publicKey: keypair.publicKey,
    payer: keypair,
    supportedTransactionVersions: null,
    async signTransaction(tx) {
      const candidate = tx as Transaction | VersionedTransaction
      if (isVersionedTransaction(candidate)) {
        candidate.sign([keypair])
        return candidate as unknown as Transaction
      }
      candidate.partialSign(keypair)
      return candidate
    },
    async signAllTransactions(txs) {
      const signed = await Promise.all(
        (txs as (Transaction | VersionedTransaction)[]).map(async (tx) => {
          if (isVersionedTransaction(tx)) {
            tx.sign([keypair])
            return tx as unknown as Transaction
          }
          tx.partialSign(keypair)
          return tx
        })
      )
      return signed as Transaction[]
    },
  }
}

const walletsMatch = (a: IWallet | null, b: IWallet | null) => {
  if (!a || !b) {
    return false
  }
  return (a.publicKey as PublicKey).equals(b.publicKey as PublicKey)
}

const createClient = async (wallet: IWallet): Promise<DriftClient> => {
  initialize({ env: DRIFT_ENV })
  const connection = getSolanaConnection()
  const { perpMarketIndexes, spotMarketIndexes, oracleInfos } = getMarketsAndOraclesForSubscription(DRIFT_ENV)

  const client = new DriftClient({
    connection,
    wallet,
    env: DRIFT_ENV,
    accountSubscription: {
      type: 'websocket',
      commitment: 'confirmed',
    },
    perpMarketIndexes,
    spotMarketIndexes,
    oracleInfos,
  })

  await client.subscribe()

  return client
}

const ensureClient = async (wallet?: IWallet): Promise<DriftClient> => {
  if (wallet && currentWallet && walletsMatch(currentWallet, wallet)) {
    return clientInstance ?? ensureClient()
  }

  if (clientInstance && wallet && currentWallet && !walletsMatch(currentWallet, wallet)) {
    await clientInstance.updateWallet(wallet)
    currentWallet = wallet
    isReadOnlyWallet = false
    return clientInstance
  }

  if (clientInstance) {
    return clientInstance
  }

  if (!initializationPromise) {
    currentWallet = wallet ?? createReadOnlyWallet()
    isReadOnlyWallet = !wallet
    initializationPromise = createClient(currentWallet).catch((error) => {
      clientInstance = null
      currentWallet = null
      isReadOnlyWallet = false
      initializationPromise = null
      throw error
    })
  }

  clientInstance = await initializationPromise
  initializationPromise = null
  return clientInstance
}

export const getDriftClient = async (wallet?: IWallet): Promise<DriftClient> => {
  return ensureClient(wallet)
}

export const getCurrentDriftWallet = () => currentWallet

export const getDriftEnv = () => DRIFT_ENV

export const driftClientIsReadOnly = () => isReadOnlyWallet

export const disposeDriftClient = async () => {
  if (clientInstance) {
    try {
      await clientInstance.unsubscribe()
    } catch (error) {
      console.error('[Drift] failed to unsubscribe client', error)
    }
  }
  clientInstance = null
  currentWallet = null
  isReadOnlyWallet = false
  initializationPromise = null
}
