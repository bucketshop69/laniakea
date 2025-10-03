import { create } from 'zustand'
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import type { ParsedAccountData } from '@solana/web3.js'

export type WalletTokenBalance = {
  account: string
  mint: string
  owner: string
  amountRaw: string
  decimals: number
  uiAmount: number
  uiAmountString: string
  isNative: boolean
}

type WalletBalanceStateBase = {
  balances: WalletTokenBalance[]
  balancesByMint: Record<string, WalletTokenBalance>
  nativeBalanceLamports: number
  nativeBalanceSol: number
  isLoading: boolean
  error?: string
  lastFetched?: number
}

interface WalletBalanceState extends WalletBalanceStateBase {
  fetchBalances: (
    connection: Connection,
    owner: PublicKey,
    options?: { force?: boolean; mints?: string[] }
  ) => Promise<void>
  refreshBalances: (
    connection: Connection,
    owner: PublicKey,
    mints?: string[],
    options?: { force?: boolean }
  ) => Promise<void>
  reset: () => void
}

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')

const createBaseState = (): WalletBalanceStateBase => ({
  balances: [],
  balancesByMint: {},
  nativeBalanceLamports: 0,
  nativeBalanceSol: 0,
  isLoading: false,
  error: undefined,
  lastFetched: undefined,
})

type ParsedTokenAccount = {
  pubkey: PublicKey
  account: { data: ParsedAccountData }
}

const parseTokenAccount = ({
  pubkey,
  account,
}: ParsedTokenAccount): WalletTokenBalance | null => {
  const { data } = account

  if (data.program !== 'spl-token') {
    return null
  }

  const rawInfo = data.parsed?.info as any
  if (!rawInfo?.tokenAmount) {
    return null
  }

  const tokenAmount = rawInfo.tokenAmount as {
    amount: string
    decimals: number
    uiAmount?: number
    uiAmountString?: string
  }

  const decimals = Number(tokenAmount.decimals ?? 0)
  const amountRaw = tokenAmount.amount ?? '0'
  const fallbackUiAmount = Number.parseFloat(tokenAmount.uiAmountString ?? '0')
  const uiAmount = typeof tokenAmount.uiAmount === 'number'
    ? tokenAmount.uiAmount
    : Number.isFinite(fallbackUiAmount)
      ? fallbackUiAmount
      : Number.parseFloat(amountRaw) / Math.pow(10, decimals)
  const uiAmountString = tokenAmount.uiAmountString ?? uiAmount.toString()

  return {
    account: pubkey.toBase58(),
    mint: rawInfo.mint as string,
    owner: rawInfo.owner as string,
    amountRaw,
    decimals,
    uiAmount,
    uiAmountString,
    isNative: Boolean(rawInfo.isNative),
  }
}

export const useWalletBalanceStore = create<WalletBalanceState>((set, get) => ({
  ...createBaseState(),
  fetchBalances: async (connection, owner, options) => {
    const { force, mints } = options ?? {}
    const state = get()

    if (state.isLoading && !force) {
      return
    }

    set((current) => ({
      ...current,
      isLoading: true,
      error: undefined,
    }))

    try {
      const lamportsPromise = connection.getBalance(owner, 'confirmed')

      const tokenAccounts = await (async () => {
        if (Array.isArray(mints) && mints.length > 0) {
          const queries = await Promise.all(
            mints.map(async (mint) => {
              try {
                const mintKey = new PublicKey(mint)
                const response = await connection.getParsedTokenAccountsByOwner(owner, { mint: mintKey })
                return response.value as ParsedTokenAccount[]
              } catch (error) {
                console.warn(`Skipping invalid mint ${mint}`, error)
                return []
              }
            })
          )

          return queries.flat()
        }

        const response = await connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID })
        return response.value as ParsedTokenAccount[]
      })()

      const normalizedBalances = tokenAccounts
        .map((entry) => parseTokenAccount(entry))
        .filter((balance): balance is WalletTokenBalance => {
          if (!balance) {
            return false
          }

          try {
            return BigInt(balance.amountRaw) > 0n
          } catch {
            return false
          }
        })

      const lamports = await lamportsPromise

      set((current) => {
        const nextByMint = Array.isArray(mints) && mints.length > 0
          ? (() => {
            const updated = { ...current.balancesByMint }

            for (const mint of mints) {
              delete updated[mint]
            }

            for (const balance of normalizedBalances) {
              updated[balance.mint] = balance
            }

            // Ensure any mints that returned zero balances remain removed
            return updated
          })()
          : normalizedBalances.reduce<Record<string, WalletTokenBalance>>((accumulator, balance) => {
            accumulator[balance.mint] = balance
            return accumulator
          }, {})

        const nextBalances = Object.values(nextByMint)

        return {
          ...current,
          balances: nextBalances,
          balancesByMint: nextByMint,
          nativeBalanceLamports: lamports,
          nativeBalanceSol: lamports / LAMPORTS_PER_SOL,
          isLoading: false,
          error: undefined,
          lastFetched: Date.now(),
        }
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch wallet balances'
      console.warn('Wallet balance fetch failed. Check Solana RPC connectivity.', error)

      set((current) => ({
        ...current,
        balances: [],
        balancesByMint: {},
        nativeBalanceLamports: 0,
        nativeBalanceSol: 0,
        isLoading: false,
        error: message,
        lastFetched: Date.now(),
      }))
    }
  },
  refreshBalances: async (connection, owner, mints, options) => {
    await get().fetchBalances(connection, owner, {
      ...(options ?? {}),
      mints,
    })
  },
  reset: () => {
    set((current) => ({
      ...current,
      ...createBaseState(),
    }))
  },
}))
