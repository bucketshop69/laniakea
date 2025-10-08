declare module 'vite-plugin-node-polyfills/shims/process' {
  const processPolyfill: any
  export { processPolyfill as process }
  export default processPolyfill
}
