import type { PublicKey } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import { QUOTE_PRECISION, convertToNumber } from '@drift-labs/sdk'
import { getDriftClient } from './driftClientService'

export const checkUserExists = async (
  authority?: PublicKey,
  subAccountId?: number
): Promise<{ exists: boolean; userAccount?: PublicKey }> => {
  const client = await getDriftClient()
  const exists = client.hasUser(subAccountId, authority)
  if (!exists) return { exists }
  const userAccount = await client.getUserAccountPublicKey(subAccountId, authority)
  return { exists: true, userAccount }
}

export const initializeUserAccount = async (
  name?: string,
  subAccountId?: number
): Promise<{ txSig: string; userAccount: PublicKey }> => {
  const client = await getDriftClient()
  const [txSig, userAccount] = await client.initializeUserAccount(subAccountId, name)
  return { txSig, userAccount }
}

export const getAccountMetrics = async (marketIndex?: number) => {
  const client = await getDriftClient()
  const user = client.getUser()

  const usdcBn = client.getQuoteAssetTokenAmount()
  const freeBn = user.getFreeCollateral()
  const levBn = user.getLeverage()

  const usdcBalance = convertToNumber(usdcBn, QUOTE_PRECISION)
  const freeCollateral = convertToNumber(freeBn, QUOTE_PRECISION)
  const leverage = levBn.toNumber() / 10_000

  let buyingPower: number | null = null
  if (typeof marketIndex === 'number') {
    const bpBn = user.getPerpBuyingPower(marketIndex)
    buyingPower = convertToNumber(bpBn, QUOTE_PRECISION)
  }

  return { usdcBalance, freeCollateral, buyingPower, leverage }
}
