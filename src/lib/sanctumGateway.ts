import { Connection, Keypair, Transaction, VersionedTransaction } from '@solana/web3.js'
import { Buffer } from 'buffer'

type WalletSigner = {
  signTransaction: (tx: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>
}

function getGatewayUrl() {
  const proxy = (import.meta as any)?.env?.VITE_SANCTUM_PROXY_URL as string | undefined
  if (proxy) return proxy
  const apiKey = (import.meta as any)?.env?.VITE_SANCTUM_API_KEY as string | undefined
  const cluster = (import.meta as any)?.env?.VITE_SOLANA_CLUSTER as string | undefined
  if (!apiKey) return null
  const c = cluster === 'devnet' ? 'v1/devnet' : 'v1/mainnet'
  // If cluster given as 'mainnet' or 'v1/mainnet' either is fine
  return `https://tpg.sanctum.so/${c}?apiKey=${apiKey}`
}

function txToBase64(tx: Transaction | VersionedTransaction) {
  return Buffer.from(tx.serialize()).toString('base64')
}

function decodeTxBase64(b64: string): Transaction | VersionedTransaction {
  const bin = Buffer.from(b64, 'base64')
  // Try VersionedTransaction first
  try {
    return VersionedTransaction.deserialize(bin)
  } catch {
    return Transaction.from(bin)
  }
}

export async function buildGatewayTransaction(
  unsignedTx: Transaction | VersionedTransaction,
  options?: Record<string, unknown>
) {
  const url = getGatewayUrl()
  if (!url) throw new Error('Sanctum Gateway URL not configured')

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'laniakea',
      jsonrpc: '2.0',
      method: 'buildGatewayTransaction',
      params: [txToBase64(unsignedTx), options ?? {}],
    }),
  })
  if (!res.ok) throw new Error('buildGatewayTransaction failed')
  const body = await res.json()
  const encoded: string = body?.result?.transaction || body?.result?.[0]?.transaction
  if (!encoded) throw new Error('Invalid builder response')
  return decodeTxBase64(encoded)
}

export async function sendViaSanctum(
  originalUnsignedTx: Transaction,
  connection: Connection,
  wallet: WalletSigner,
  opts?: {
    additionalSigners?: Keypair[]
    builderOptions?: Record<string, unknown>
    waitForCommitment?: 'processed' | 'confirmed' | 'finalized'
  }
): Promise<string> {
  const url = getGatewayUrl()
  if (!url) {
    // Fallback to normal path if not configured
    const signed = (await wallet.signTransaction(originalUnsignedTx)) as Transaction
    const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false, preflightCommitment: 'confirmed' })
    return sig
  }

  const built = await buildGatewayTransaction(originalUnsignedTx, opts?.builderOptions)

  if (opts?.additionalSigners && opts.additionalSigners.length > 0) {
    if ('partialSign' in built) {
      for (const kp of opts.additionalSigners) {
        ;(built as Transaction).partialSign(kp)
      }
    } else if (built instanceof VersionedTransaction) {
      built.sign(opts.additionalSigners)
    }
  }

  const signed = (await wallet.signTransaction(built)) as Transaction | VersionedTransaction

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'laniakea',
      jsonrpc: '2.0',
      method: 'sendTransaction',
      params: [Buffer.from(signed.serialize()).toString('base64'), { encoding: 'base64' }],
    }),
  })
  if (!res.ok) throw new Error('sendTransaction failed')
  const body = await res.json()
  const result = body?.result
  const signature = typeof result === 'string' ? result : result?.signature || result?.[0]?.result

  if (!signature) throw new Error('Invalid sendTransaction response')

  if (opts?.waitForCommitment) {
    try {
      const latest = await connection.getLatestBlockhash()
      await connection.confirmTransaction({ signature, ...latest }, opts.waitForCommitment)
    } catch {
      // ignore confirmation failure here
    }
  }

  return signature
}

export async function sendManyViaSanctum(
  txs: Transaction[],
  connection: Connection,
  wallet: WalletSigner,
  perTxOpts?: { additionalSigners?: Keypair[]; builderOptions?: Record<string, unknown> }
): Promise<string[]> {
  const sigs: string[] = []
  for (const tx of txs) {
    const sig = await sendViaSanctum(tx, connection, wallet, perTxOpts)
    sigs.push(sig)
  }
  return sigs
}
