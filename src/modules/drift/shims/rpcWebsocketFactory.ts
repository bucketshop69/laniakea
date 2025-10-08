import { WebSocket } from 'rpc-websockets'

const createRpc = (address: string, options?: unknown) =>
  WebSocket(address, options as Record<string, unknown>)

export default createRpc
