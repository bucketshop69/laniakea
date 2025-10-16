import processPolyfill from 'vite-plugin-node-polyfills/shims/process'

const ensureNextTick = (cb: (...args: unknown[]) => void, ...args: unknown[]) => {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(() => cb(...args))
    return
  }

  Promise.resolve().then(() => cb(...args))
}

const proc = processPolyfill

proc.env = proc.env ?? {}
proc.browser = true
proc.version = proc.version && proc.version.length > 0 ? proc.version : '18.19.0'
proc.versions = proc.versions ?? {}
proc.versions.node = proc.versions.node ?? proc.version
proc.nextTick = proc.nextTick ?? ensureNextTick

if (typeof globalThis !== 'undefined') {
  globalThis.process = proc
}

export { proc as process }
export default proc
