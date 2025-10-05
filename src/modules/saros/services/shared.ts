const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const withRetries = async <T>(fn: () => Promise<T>, retries = 2, delay = 500): Promise<T> => {
  try {
    return await fn()
  } catch (error) {
    if (retries <= 0) {
      throw error
    }

    await sleep(delay)
    return withRetries(fn, retries - 1, delay * 2)
  }
}
