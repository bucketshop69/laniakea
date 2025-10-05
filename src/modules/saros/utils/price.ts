import { getIdFromPrice as sdkGetIdFromPrice, getPriceFromId as sdkGetPriceFromId } from '@saros-finance/dlmm-sdk/utils/price'

export const getIdFromPrice = (
  price: number,
  binStep: number,
  baseTokenDecimal: number,
  quoteTokenDecimal: number,
) => sdkGetIdFromPrice(price, binStep, baseTokenDecimal, quoteTokenDecimal)

export const getPriceFromBinId = (
  binId: number,
  binStep: number,
  baseTokenDecimal: number,
  quoteTokenDecimal: number,
) => sdkGetPriceFromId(binStep, binId, baseTokenDecimal, quoteTokenDecimal)

export const formatPrice = (value: number | null, options?: Intl.NumberFormatOptions) => {
  if (value === null || Number.isNaN(value) || !Number.isFinite(value)) {
    return '—'
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: 6,
    ...options,
  })
}
