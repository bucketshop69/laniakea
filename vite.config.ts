import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'node:path'

const depsProcessBanner = `
if (typeof globalThis.process === 'undefined') {
  const nextTick = (cb, ...args) => {
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => cb(...args))
      return
    }
    Promise.resolve().then(() => cb(...args))
  }

  globalThis.process = {
    env: {},
    browser: true,
    version: '18.19.0',
    versions: { node: '18.19.0' },
    nextTick,
  }
} else {
  globalThis.process.env = globalThis.process.env ?? {}
  globalThis.process.browser = true
  globalThis.process.version = globalThis.process.version ?? '18.19.0'
  const versions = globalThis.process.versions ?? {}
  versions.node = versions.node ?? globalThis.process.version
  globalThis.process.versions = versions
  globalThis.process.nextTick = globalThis.process.nextTick ?? ((cb, ...args) => {
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => cb(...args))
      return
    }
    Promise.resolve().then(() => cb(...args))
  })
}
`

const processShimBanner = `
const ensureProcessNextTick = (cb, ...args) => {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(() => cb(...args))
  } else {
    Promise.resolve().then(() => cb(...args))
  }
}

if (!globalThis.process) {
  globalThis.process = {
    env: {},
    browser: true,
    version: '18.19.0',
    versions: { node: '18.19.0' },
    nextTick: ensureProcessNextTick,
  }
} else {
  globalThis.process.env = globalThis.process.env ?? {}
  globalThis.process.browser = true
  globalThis.process.version = globalThis.process.version ?? '18.19.0'
  globalThis.process.versions = globalThis.process.versions ?? { node: '18.19.0' }
  globalThis.process.nextTick = globalThis.process.nextTick ?? ensureProcessNextTick
}

var process = globalThis.process;

// Stream polyfill for ripemd160 compatibility
class PolyfillWritable {
  constructor() {
    this._writableState = {
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
  }

  _write(chunk, encoding, callback) {
    callback()
  }

  write(chunk, encoding, cb) {
    try {
      this._write(chunk, encoding || 'utf8', cb || (() => {}))
      return true
    } catch (err) {
      if (cb) cb(err)
      return false
    }
  }

  end(chunk, encoding, cb) {
    if (typeof chunk === 'function') {
      cb = chunk
      chunk = undefined
      encoding = undefined
    } else if (typeof encoding === 'function') {
      cb = encoding
      encoding = undefined
    }
    if (cb) cb()
    return this
  }

  on(event, listener) { return this }
  once(event, listener) { return this }
  emit(event, ...args) { return false }
  pipe(destination) { return destination }
  unpipe() { return this }
  destroy() { return this }
  cork() {}
  uncork() {}
  setDefaultEncoding() { return this }
}

// Set up stream polyfill globally
globalThis.Writable = PolyfillWritable
if (typeof window !== 'undefined') {
  window.Writable = PolyfillWritable
}

// Override require to provide stream modules
const originalRequire = globalThis.require
globalThis.require = (mod) => {
  if (mod === 'stream' || mod === 'readable-stream') {
    return { 
      Writable: PolyfillWritable,
      default: { Writable: PolyfillWritable }
    }
  }
  
  if (originalRequire) {
    try {
      return originalRequire(mod)
    } catch (e) {
      // Fall through
    }
  }
  
  throw new Error(\`Module "\${mod}" is not available.\`)
}
`

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      protocolImports: true,
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  resolve: {
    alias: [
      {
        find: '@',
        replacement: '/src',
      },
      {
        find: 'events',
        replacement: path.resolve(__dirname, 'node_modules/events/events.js'),
      },
      {
        find: 'rpc-websockets/dist/lib/client/websocket.browser',
        replacement: path.resolve(
          __dirname,
          'src/modules/drift/shims/rpcWebsocketFactory.ts'
        ),
      },
      {
        find: 'rpc-websockets/dist/lib/client',
        replacement: path.resolve(
          __dirname,
          'src/modules/drift/shims/rpcWebsocketClient.ts'
        ),
      },
      {
        find: 'js-sha256',
        replacement: path.resolve(
          __dirname,
          'node_modules/js-sha256/src/sha256.js'
        ),
      },
      {
        find: 'process',
        replacement: path.resolve(
          __dirname,
          'src/polyfills/processShim.ts'
        ),
      },
    ],
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.version': JSON.stringify('18.19.0'),
    'process.browser': JSON.stringify(true),
    'process.versions': JSON.stringify({ node: '18.19.0' })
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      banner: {
        js: `${depsProcessBanner}\n${processShimBanner}`,
      },
    },
  },
})
