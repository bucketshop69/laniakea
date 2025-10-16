import type { IWallet } from '@drift-labs/sdk'
import type { WalletContextState } from '@solana/wallet-adapter-react'
import type { Transaction, TransactionVersion, VersionedTransaction } from '@solana/web3.js'

export const createDriftWalletAdapter = (wallet: WalletContextState): IWallet => {
  if (!wallet.publicKey) {
    throw new Error('Wallet public key unavailable')
  }

  return {
    publicKey: wallet.publicKey,
    supportedTransactionVersions: (wallet as unknown as { supportedTransactionVersions?: ReadonlySet<TransactionVersion> | null }).supportedTransactionVersions ?? null,
    async signTransaction(tx: Transaction): Promise<Transaction> {
      if (!wallet.signTransaction) {
        throw new Error('Wallet does not support signTransaction')
      }
      const maybeVersioned = tx as Transaction | VersionedTransaction
      const signed = await wallet.signTransaction(maybeVersioned as unknown as Transaction)
      return signed as Transaction
    },
    async signAllTransactions(txs: Transaction[]): Promise<Transaction[]> {
      if (!wallet.signAllTransactions) {
        throw new Error('Wallet does not support signAllTransactions')
      }
      const signed = await wallet.signAllTransactions(txs as unknown as Transaction[])
      return signed as Transaction[]
    },
  }
}
