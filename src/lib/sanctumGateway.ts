import { Connection, Keypair, Transaction, VersionedTransaction } from '@solana/web3.js'
import { Buffer } from 'buffer'

type WalletSigner = {
  signTransaction: (tx: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>
}

function getGatewayUrl() {
  const proxy = (import.meta as any)?.env?.VITE_SANCTUM_PROXY_URL as string | undefined
  
  // Validate and use proxy URL if provided
  if (proxy) {
    try {
      const url = new URL(proxy)
      
      // Enforce HTTPS for security
      if (url.protocol !== 'https:') {
        console.error('[Sanctum Gateway] Proxy URL must use HTTPS protocol')
        return null
      }
      
      return proxy
    } catch (error) {
      console.error('[Sanctum Gateway] Invalid proxy URL:', proxy)
      return null
    }
  }
  
  const apiKey = (import.meta as any)?.env?.VITE_SANCTUM_API_KEY as string | undefined
  const cluster = (import.meta as any)?.env?.VITE_SOLANA_CLUSTER as string | undefined
  
  if (!apiKey) return null
  
  // Strict cluster validation
  if (cluster !== 'devnet' && cluster !== 'mainnet-beta') {
    console.error(`[Sanctum Gateway] Invalid cluster: "${cluster}". Must be "devnet" or "mainnet-beta"`)
    return null
  }
  
  const c = cluster === 'devnet' ? 'v1/devnet' : 'v1/mainnet'
  
  // Note: Sanctum Gateway uses query param for API key (their API design)
  // This is acceptable as it's over HTTPS, but Authorization header would be better
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
  if (!url) {
    throw new Error(
      'Sanctum Gateway URL not configured. Please set VITE_SANCTUM_API_KEY and VITE_SOLANA_CLUSTER environment variables.'
    )
  }

  // Validate transaction before sending
  if (!unsignedTx) {
    throw new Error('Invalid transaction: transaction is required')
  }

  // Validate options if provided
  if (options && typeof options !== 'object') {
    throw new Error('Invalid options: must be an object')
  }

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
  
  if (!res.ok) {
    // Sanitize error messages in production - don't leak internal details
    const errorMsg = import.meta.env.PROD
      ? `Sanctum Gateway request failed: ${res.status}`
      : `Sanctum Gateway buildGatewayTransaction failed: ${res.status} ${res.statusText}`
    throw new Error(errorMsg)
  }
  
  const body = await res.json()
  
  if (body?.error) {
    // Sanitize error messages in production
    const errorMsg = import.meta.env.PROD
      ? 'Sanctum Gateway error occurred'
      : `Sanctum Gateway error: ${body.error.message || JSON.stringify(body.error)}`
    throw new Error(errorMsg)
  }
  
  const encoded: string = body?.result?.transaction || body?.result?.[0]?.transaction
  if (!encoded) {
    throw new Error('Invalid Sanctum Gateway response: missing transaction data')
  }
  
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
  
  if (!res.ok) {
    // Sanitize error messages in production
    const errorMsg = import.meta.env.PROD
      ? `Sanctum Gateway send failed: ${res.status}`
      : `Sanctum Gateway sendTransaction failed: ${res.status} ${res.statusText}`
    throw new Error(errorMsg)
  }
  
  const body = await res.json()
  
  if (body?.error) {
    // Sanitize error messages in production
    const errorMsg = import.meta.env.PROD
      ? 'Sanctum Gateway send error'
      : `Sanctum Gateway error: ${body.error.message || JSON.stringify(body.error)}`
    throw new Error(errorMsg)
  }
  
  const result = body?.result
  const signature = typeof result === 'string' ? result : result?.signature || result?.[0]?.result

  if (!signature) {
    throw new Error('Invalid Sanctum Gateway response: missing transaction signature')
  }

  if (opts?.waitForCommitment) {
    try {
      const latest = await connection.getLatestBlockhash()
      await connection.confirmTransaction({ signature, ...latest }, opts.waitForCommitment)
    } catch (confirmError) {
      // Log confirmation errors - don't silently swallow them
      console.warn('[Sanctum Gateway] Transaction confirmation warning:', confirmError)
      // Transaction was sent successfully, just confirmation timed out
      // Return signature anyway - user can check status manually
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
