import { Buffer } from 'buffer'
import * as crypto from 'crypto'

// Comprehensive stream polyfill for ripemd160/readable-stream compatibility
class PolyfillWritable {
  _writableState: any = {
    objectMode: false,
    ended: false,
    finished: false,
    destroyed: false,
    errorEmitted: false,
    defaultEncoding: 'utf8',
    length: 0,
    writing: false,
    corked: 0,
    sync: false,
    bufferProcessing: false,
    onwrite: () => {},
    writecb: null,
    writelen: 0,
    bufferedRequest: null,
    lastBufferedRequest: null,
    pendingcb: 0,
    prefinished: false,
    emitClose: false,
    autoDestroy: false,
    bufferedRequestCount: 0,
    corkedRequestsFree: { next: null, entry: null, finish: () => {} }
  }

  constructor(options: any = {}) {
    this._writableState.objectMode = options.objectMode ?? false
    this._writableState.highWaterMark = options.highWaterMark ?? 16 * 1024
    this._writableState.decodeStrings = options.decodeStrings ?? true
    this._writableState.defaultEncoding = options.defaultEncoding ?? 'utf8'
    this._writableState.emitClose = options.emitClose ?? false
    this._writableState.autoDestroy = options.autoDestroy ?? false
  }

  _write(chunk: any, encoding: string, callback: Function) {
    callback()
  }

  _writev?(chunks: any[], callback: Function): void

  _final(callback: Function) {
    callback()
  }

  write(chunk: any, encoding?: string | Function, cb?: Function): boolean {
    if (typeof encoding === 'function') {
      cb = encoding
      encoding = this._writableState.defaultEncoding
    }

    if (typeof chunk === 'string' && this._writableState.decodeStrings) {
      chunk = Buffer.from(chunk, (encoding as any) || this._writableState.defaultEncoding)
    }

    try {
      this._write(chunk, (encoding as any) || this._writableState.defaultEncoding, cb || (() => {}))
      return true
    } catch (err) {
      if (cb) cb(err as Error)
      return false
    }
  }

  end(chunk?: any, encoding?: string | Function, cb?: Function): this {
    if (typeof chunk === 'function') {
      cb = chunk
      chunk = undefined
      encoding = undefined
    } else if (typeof encoding === 'function') {
      cb = encoding
      encoding = undefined
    }

    if (chunk) {
      this.write(chunk, encoding as any, () => {
        this._final(cb || (() => {}))
      })
    } else {
      this._final(cb || (() => {}))
    }

    return this
  }

  destroy(error?: Error): this {
    this._writableState.destroyed = true
    return this
  }

  on(event: string, listener: Function): this { return this }
  once(event: string, listener: Function): this { return this }
  emit(event: string, ...args: any[]): boolean { return false }
  pipe(destination: any): any { return destination }
  unpipe(destination?: any): this { return this }

  cork() {}
  uncork() {}
  setDefaultEncoding(encoding: string): this { return this }
}

class PolyfillReadable {
  _readableState: any = {
    objectMode: false,
    highWaterMark: 16 * 1024,
    buffer: [],
    length: 0,
    pipes: [],
    flowing: false,
    ended: false,
    endEmitted: false,
    reading: false,
    constructed: true,
    sync: true,
    needReadable: false,
    emittedReadable: false,
    readListening: false,
    resumeScheduled: false,
    errorEmitted: false,
    emitClose: false,
    autoDestroy: false,
    destroyed: false,
    errored: null,
    closed: false,
    closeEmitted: false,
    defaultEncoding: 'utf8',
    awaitDrainWriters: null,
    multiAwaitDrain: false,
    readingMore: false,
    dataEmitted: false,
    decoder: null,
    encoding: null
  }

  constructor(options: any = {}) {
    this._readableState.objectMode = options.objectMode ?? false
    this._readableState.highWaterMark = options.highWaterMark ?? 16 * 1024
    this._readableState.encoding = options.encoding
    this._readableState.emitClose = options.emitClose ?? false
    this._readableState.autoDestroy = options.autoDestroy ?? false
  }

  _read(size: number) {
    // Default implementation
  }

  read(size?: number): any {
    return null
  }

  on(event: string, listener: Function): this { return this }
  once(event: string, listener: Function): this { return this }
  emit(event: string, ...args: any[]): boolean { return false }
  pipe(destination: any): any { return destination }
  unpipe(destination?: any): this { return this }
  unshift(chunk: any, encoding?: string): void {}
  wrap(stream: any): this { return this }
  push(chunk: any, encoding?: string): boolean { return false }
  destroy(error?: Error): this { return this }
  resume() { return this }
  pause() { return this }
  isPaused(): boolean { return false }
  setEncoding(encoding: string): this { return this }
}

class PolyfillTransform extends PolyfillReadable {
  _transformState: any = {
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  }

  constructor(options: any = {}) {
    super(options)
  }

  _transform(chunk: any, encoding: string, callback: Function) {
    callback(null, chunk)
  }

  _flush(callback: Function) {
    callback()
  }

  _write(chunk: any, encoding: string, callback: Function) {
    this._transform(chunk, encoding, callback)
  }

  _read(size: number) {
    // Minimal implementation
  }
}

class PolyfillPassThrough extends PolyfillTransform {
  _transform(chunk: any, encoding: string, callback: Function) {
    callback(null, chunk)
  }
}

// Initialize polyfills immediately
if (typeof globalThis !== 'undefined') {
  const globalAny = globalThis as any
  // Set up on globalThis first
  globalAny.Writable = PolyfillWritable
  globalAny.Readable = PolyfillReadable
  globalAny.Transform = PolyfillTransform
  globalAny.PassThrough = PolyfillPassThrough
  
  // Also set up on window for browser compatibility
  if (typeof window !== 'undefined') {
    const windowAny = window as any
    windowAny.Writable = PolyfillWritable
    windowAny.Readable = PolyfillReadable  
    windowAny.Transform = PolyfillTransform
    windowAny.PassThrough = PolyfillPassThrough
  }
  
  // Create comprehensive require function
  const originalRequire = (globalThis as any).require
  ;(globalThis as any).require = (mod: string) => {
    if (mod === 'stream' || mod === 'readable-stream') {
      return { 
        Writable: PolyfillWritable, 
        Readable: PolyfillReadable, 
        Transform: PolyfillTransform, 
        PassThrough: PolyfillPassThrough,
        default: { 
          Writable: PolyfillWritable, 
          Readable: PolyfillReadable, 
          Transform: PolyfillTransform, 
          PassThrough: PolyfillPassThrough 
        }
      }
    }
    
    // Try original require first
    if (originalRequire) {
      try {
        return originalRequire(mod)
      } catch (e) {
        // Fall through to our modules
      }
    }
    
    const moduleMap: Record<string, unknown> = {
      buffer: Buffer,
      crypto,
    }

    const result = moduleMap[mod]
    if (result !== undefined) {
      return result
    }
    
    throw new Error(`Module "${mod}" is not available in the browser polyfill.`)
  }
}

type NextTickFn = (callback: (...args: unknown[]) => void, ...args: unknown[]) => void

type PolyfillProcess = {
  env: Record<string, string>
  version?: string
  versions?: Record<string, string>
  browser?: boolean
  nextTick?: NextTickFn
} & Record<string, unknown>

const runtimeWindow = typeof window !== 'undefined'
  ? ((window as unknown) as Window & {
      Buffer?: typeof Buffer
      global?: typeof globalThis
      process?: PolyfillProcess
      require?: (moduleName: string) => unknown
    })
  : undefined

const globalScope = (typeof globalThis !== 'undefined' ? (globalThis as Record<string, unknown>) : {}) as Record<string, unknown>

const ensureNextTick = (): NextTickFn => {
  if (typeof queueMicrotask === 'function') {
    return (callback, ...args) => queueMicrotask(() => callback(...args))
  }
  return (callback, ...args) => {
    Promise.resolve().then(() => callback(...args))
  }
}

if (runtimeWindow && !runtimeWindow.Buffer) {
  runtimeWindow.Buffer = Buffer
}

if (runtimeWindow && !runtimeWindow.global) {
  runtimeWindow.global = runtimeWindow as unknown as typeof globalThis
}

if (runtimeWindow) {
  if (!runtimeWindow.require) {
    const moduleMap: Record<string, unknown> = {
      buffer: Buffer,
      crypto,
    }

    runtimeWindow.require = (moduleName: string) => {
      const mod = moduleMap[moduleName]
      if (!mod) {
        throw new Error(`Module "${moduleName}" is not available in the browser polyfill.`)
      }
      return mod
    }
  }
}

const existingProcess = (globalScope.process as PolyfillProcess | undefined) ?? runtimeWindow?.process
const polyfillProcess: PolyfillProcess = existingProcess ?? {
  env: {},
  browser: true,
  version: '18.19.0',
  versions: { node: '18.19.0' },
  nextTick: ensureNextTick(),
}

polyfillProcess.env = polyfillProcess.env ?? {}
polyfillProcess.browser = true
polyfillProcess.version = polyfillProcess.version ?? '18.19.0'
polyfillProcess.versions = polyfillProcess.versions ?? { node: '18.19.0' }
polyfillProcess.nextTick = polyfillProcess.nextTick ?? ensureNextTick()

// Ensure process.version has the slice method (it should as a string)
if (polyfillProcess.version && typeof polyfillProcess.version !== 'string') {
  polyfillProcess.version = String(polyfillProcess.version)
}

globalScope.process = polyfillProcess
if (runtimeWindow) {
  runtimeWindow.process = polyfillProcess
}
