'use strict'

const ensureProcessNextTick = (cb, ...args) => {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(() => cb(...args))
  } else {
    Promise.resolve().then(() => cb(...args))
  }
}

const proc = globalThis.process ?? {}

proc.env = proc.env ?? {}
proc.browser = true
proc.version = proc.version ?? '18.19.0'
proc.versions = proc.versions ?? {}
proc.versions.node = proc.versions.node ?? '18.19.0'
proc.nextTick = proc.nextTick ?? ensureProcessNextTick

globalThis.process = proc

const process = globalThis.process

export { process }
