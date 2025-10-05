export const toBigIntSafe = (value: unknown): bigint => {
  if (typeof value === 'bigint') {
    return value
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value) || Number.isNaN(value)) {
      return 0n
    }
    return BigInt(Math.trunc(value))
  }

  if (typeof value === 'string') {
    try {
      return BigInt(value)
    } catch {
      return 0n
    }
  }

  if (value && typeof value === 'object' && 'toString' in value) {
    try {
      return BigInt((value as { toString(): string }).toString())
    } catch {
      return 0n
    }
  }

  return 0n
}

export const scaleDown = (amount: bigint, decimals: number) => {
  if (decimals <= 0) {
    return Number(amount)
  }

  const divisor = 10n ** BigInt(decimals)
  return Number(amount) / Number(divisor)
}

export const scaleUp = (amount: number, decimals: number) => {
  if (!Number.isFinite(amount) || Number.isNaN(amount)) {
    return 0n
  }

  const multiplier = 10n ** BigInt(Math.max(0, decimals))
  return BigInt(Math.trunc(amount * Number(multiplier)))
}
