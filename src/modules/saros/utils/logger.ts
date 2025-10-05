type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const isDebug = () => import.meta.env.DEV && import.meta.env.VITE_DEBUG_SAROS === 'true'

const log = (level: LogLevel, message: string, payload?: unknown) => {
  if (level === 'debug' && !isDebug()) {
    return
  }

  const prefix = `[Saros:${level.toUpperCase()}]`

  if (payload !== undefined) {
    console[level](`${prefix} ${message}`, payload)
  } else {
    console[level](`${prefix} ${message}`)
  }
}

export const sarosLogger = {
  debug: (message: string, payload?: unknown) => log('debug', message, payload),
  info: (message: string, payload?: unknown) => log('info', message, payload),
  warn: (message: string, payload?: unknown) => log('warn', message, payload),
  error: (message: string, payload?: unknown) => log('error', message, payload),
}
