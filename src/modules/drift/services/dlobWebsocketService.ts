import { EventEmitter } from 'events'
import type { DriftEnv } from '@drift-labs/sdk'

type DlobMarketType = 'perp' | 'spot'
type DlobChannel = 'orderbook' | 'trades'

const DLOB_ENDPOINTS: Record<DriftEnv, string> = {
  'mainnet-beta': 'wss://dlob.drift.trade/ws',
  devnet: 'wss://master.dlob.drift.trade/ws',
}

const MAX_BUFFERED_MESSAGES = 50
const HEARTBEAT_TIMEOUT_MS = 15_000
const HEARTBEAT_CHECK_MS = 5_000
const RECONNECT_BASE_DELAY_MS = 1_000
const RECONNECT_MAX_DELAY_MS = 30_000

interface DlobOrderbookLevel {
  price: string
  size: string
  sources?: string[]
}

interface DlobOracleData {
  price?: string
  slot?: number
  confidence?: string
  twap?: string
  twapConfidence?: string
  hasSufficientNumberOfDataPoints?: boolean
}

interface DlobOrderbookPayload {
  bids?: DlobOrderbookLevel[]
  asks?: DlobOrderbookLevel[]
  oracle?: string
  oracleData?: DlobOracleData
  marketName?: string
  marketType?: DlobMarketType
  marketIndex?: number
  slot?: number
  marketSlot?: number
  timestamp?: number
}

interface DlobTradePayload {
  ts?: number
  marketIndex?: number
  marketType?: DlobMarketType
  filler?: string
  taker?: string
  takerFee?: string
  makerFee?: string
  quoteAssetAmountFilled?: string
  baseAssetAmountFilled?: string
  oraclePrice?: string
  slot?: number
  market?: string
  [key: string]: unknown
}

interface DlobSocketEnvelope {
  channel?: string
  data?: unknown
  ts?: number
}

interface SubscriptionRecord {
  channel: DlobChannel
  marketType: DlobMarketType
  market: string
  handlers: Set<(event: DlobStreamEvent) => void>
  active: boolean
  lastSlot?: number
  lastTimestamp?: number
  serverChannel?: string
}

interface DlobOrderbookEvent {
  type: 'orderbook'
  market: string
  marketType: DlobMarketType
  channel: string
  receivedTs: number
  slot?: number
  payload: DlobOrderbookPayload
}

interface DlobTradeEvent {
  type: 'trades'
  market: string
  marketType: DlobMarketType
  channel: string
  receivedTs: number
  slot?: number
  payload: DlobTradePayload
}

type DlobStreamEvent = DlobOrderbookEvent | DlobTradeEvent

interface HeartbeatEvent {
  type: 'heartbeat'
  receivedTs: number
  deltaMs?: number
}

interface BackpressureEvent {
  type: 'backpressure'
  queuedMessages: number
  droppedMessages: number
}

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

interface ConnectionEvent {
  state: ConnectionState
  attempt?: number
  code?: number
  reason?: string
}

type ListenerDisposer = () => void

class DlobWebsocketService {
  private static instance: DlobWebsocketService

  private endpoint: string = DLOB_ENDPOINTS['mainnet-beta']
  private socket: WebSocket | null = null
  private state: ConnectionState = 'idle'
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private lastHeartbeatTs: number | null = null
  private messageQueue: string[] = []
  private queueProcessing = false
  private droppedMessages = 0
  private readonly emitter = new EventEmitter()

  private readonly subscriptions = new Map<string, SubscriptionRecord>()

  static getInstance(): DlobWebsocketService {
    if (!DlobWebsocketService.instance) {
      DlobWebsocketService.instance = new DlobWebsocketService()
    }
    return DlobWebsocketService.instance
  }

  setEnv(env: DriftEnv): void {
    const nextEndpoint = DLOB_ENDPOINTS[env]
    if (!nextEndpoint || nextEndpoint === this.endpoint) {
      return
    }
    this.endpoint = nextEndpoint
    this.resetConnection()
  }

  getConnectionState(): ConnectionState {
    return this.state
  }

  getQueueSize(): number {
    return this.messageQueue.length
  }

  getLastHeartbeatTs(): number | null {
    return this.lastHeartbeatTs
  }

  subscribeOrderbook(params: {
    market: string
    marketType: DlobMarketType
    handler: (event: DlobOrderbookEvent) => void
  }): ListenerDisposer {
    return this.addSubscription({
      channel: 'orderbook',
      market: params.market,
      marketType: params.marketType,
      handler: params.handler as (event: DlobStreamEvent) => void,
    })
  }

  subscribeTrades(params: {
    market: string
    marketType: DlobMarketType
    handler: (event: DlobTradeEvent) => void
  }): ListenerDisposer {
    return this.addSubscription({
      channel: 'trades',
      market: params.market,
      marketType: params.marketType,
      handler: params.handler as (event: DlobStreamEvent) => void,
    })
  }

  onConnection(handler: (event: ConnectionEvent) => void): ListenerDisposer {
    this.emitter.on('connection', handler)
    return () => this.emitter.off('connection', handler)
  }

  onHeartbeat(handler: (event: HeartbeatEvent) => void): ListenerDisposer {
    this.emitter.on('heartbeat', handler)
    return () => this.emitter.off('heartbeat', handler)
  }

  onBackpressure(handler: (event: BackpressureEvent) => void): ListenerDisposer {
    this.emitter.on('backpressure', handler)
    return () => this.emitter.off('backpressure', handler)
  }

  disconnect(): void {
    this.teardownSocket()
    this.state = 'idle'
    this.emitConnection()
  }

  private addSubscription(params: {
    channel: DlobChannel
    marketType: DlobMarketType
    market: string
    handler: (event: DlobStreamEvent) => void
  }): ListenerDisposer {
    const key = this.getSubscriptionKey(params.channel, params.marketType, params.market)
    let record = this.subscriptions.get(key)
    if (!record) {
      record = {
        channel: params.channel,
        marketType: params.marketType,
        market: params.market,
        handlers: new Set(),
        active: false,
      }
      this.subscriptions.set(key, record)
    }

    record.handlers.add(params.handler)
    this.ensureSocket()
    if (this.state === 'connected' && !record.active) {
      this.sendSubscribe(record)
    }

    return () => this.removeHandler(key, params.handler)
  }

  private removeHandler(key: string, handler: (event: DlobStreamEvent) => void): void {
    const record = this.subscriptions.get(key)
    if (!record) {
      return
    }
    record.handlers.delete(handler)
    if (record.handlers.size > 0) {
      return
    }
    if (this.state === 'connected' && record.active) {
      this.sendUnsubscribe(record)
    }
    this.subscriptions.delete(key)
    if (this.subscriptions.size === 0) {
      this.disconnect()
    }
  }

  private ensureSocket(): void {
    if (this.socket || this.state === 'connecting') {
      return
    }
    this.connect()
  }

  private connect(): void {
    if (typeof WebSocket === 'undefined') {
      console.warn('[DLOB] WebSocket unavailable in current environment')
      return
    }
    this.state = this.state === 'disconnected' ? 'reconnecting' : 'connecting'
    this.emitConnection()
    try {
      this.socket = new WebSocket(this.endpoint)
      this.socket.binaryType = 'arraybuffer'
    } catch (error) {
      console.error('[DLOB] failed to create websocket', error)
      this.scheduleReconnect()
      return
    }

    this.socket.onopen = () => {
      this.state = 'connected'
      this.reconnectAttempts = 0
      this.emitConnection()
      this.lastHeartbeatTs = Date.now()
      this.startHeartbeatMonitor()
      this.flushSubscriptions()
    }

    this.socket.onmessage = (event) => {
      const result = this.toMessageString(event.data)
      if (typeof result === 'string') {
        this.enqueueMessage(result)
      } else if (result instanceof Promise) {
        result.then((text) => {
          if (typeof text === 'string') {
            this.enqueueMessage(text)
          }
        }).catch((error) => {
          console.error('[DLOB] failed to decode message', error)
        })
      }
    }

    this.socket.onerror = (event) => {
      console.error('[DLOB] websocket error', event)
    }

    this.socket.onclose = (event) => {
      this.state = 'disconnected'
      this.emitConnection({ code: event.code, reason: event.reason })
      this.resetActiveSubscriptions()
      this.stopHeartbeatMonitor()
      this.socket = null
      this.scheduleReconnect()
    }
  }

  private enqueueMessage(raw: string): void {
    if (this.messageQueue.length >= MAX_BUFFERED_MESSAGES) {
      this.messageQueue.shift()
      this.droppedMessages += 1
      this.emitter.emit('backpressure', {
        type: 'backpressure',
        queuedMessages: this.messageQueue.length,
        droppedMessages: this.droppedMessages,
      } satisfies BackpressureEvent)
    }
    this.messageQueue.push(raw)
    if (!this.queueProcessing) {
      this.queueProcessing = true
      queueMicrotask(() => this.drainQueue())
    }
  }

  private drainQueue(): void {
    while (this.messageQueue.length > 0) {
      const raw = this.messageQueue.shift()
      if (raw) {
        this.handleRawMessage(raw)
      }
    }
    this.queueProcessing = false
  }

  private handleRawMessage(raw: string): void {
    let envelope: DlobSocketEnvelope
    try {
      envelope = JSON.parse(raw) as DlobSocketEnvelope
    } catch (error) {
      console.error('[DLOB] failed to parse message', error)
      return
    }

    if (envelope.channel === 'heartbeat') {
      this.handleHeartbeat(envelope)
      return
    }

    if (!envelope.channel) {
      return
    }

    const channel = this.parseChannelType(envelope.channel)
    if (!channel) {
      return
    }

    const parsedData = this.parsePayload(envelope.data)
    const payloadMarketType = this.toMarketType(parsedData && (parsedData as { marketType?: unknown }).marketType)
    const marketType = payloadMarketType ?? this.extractMarketTypeFromChannel(envelope.channel)

    if (!marketType) {
      return
    }

    const payloadMarketName = this.resolveMarketName(parsedData)
    let record: SubscriptionRecord | undefined

    if (payloadMarketName) {
      record = this.subscriptions.get(this.getSubscriptionKey(channel, marketType, payloadMarketName))
    }

    if (!record) {
      record = this.findRecordForEnvelope(channel, marketType, envelope.channel)
    }

    if (!record || record.handlers.size === 0) {
      return
    }

    const receivedTs = Date.now()
    if (channel === 'orderbook') {
      const payload = parsedData as DlobOrderbookPayload
      record.serverChannel = envelope.channel
      record.lastSlot = typeof payload?.slot === 'number' ? payload.slot : record.lastSlot
      record.lastTimestamp = typeof payload?.timestamp === 'number' ? payload.timestamp : receivedTs
      const event: DlobOrderbookEvent = {
        type: 'orderbook',
        market: record.market,
        marketType,
        channel: envelope.channel,
        receivedTs,
        slot: payload?.slot,
        payload,
      }
      record.handlers.forEach((handler) => handler(event))
      return
    }

    const payload = parsedData as DlobTradePayload
    record.serverChannel = envelope.channel
    record.lastSlot = typeof payload?.slot === 'number' ? payload.slot : record.lastSlot
    record.lastTimestamp = typeof payload?.ts === 'number' ? payload.ts : receivedTs
    const event: DlobTradeEvent = {
      type: 'trades',
      market: record.market,
      marketType,
      channel: envelope.channel,
      receivedTs,
      slot: payload?.slot,
      payload,
    }
    record.handlers.forEach((handler) => handler(event))
  }

  private handleHeartbeat(envelope: DlobSocketEnvelope): void {
    const now = Date.now()
    const previous = this.lastHeartbeatTs ?? now
    this.lastHeartbeatTs = now
    this.emitter.emit('heartbeat', {
      type: 'heartbeat',
      receivedTs: now,
      deltaMs: now - previous,
    } satisfies HeartbeatEvent)
  }

  private parsePayload(data: unknown): Record<string, unknown> | undefined {
    if (!data) {
      return undefined
    }
    if (typeof data === 'string') {
      try {
        return JSON.parse(data) as Record<string, unknown>
      } catch (error) {
        console.error('[DLOB] failed to parse message payload', error)
        return undefined
      }
    }
    if (typeof data === 'object') {
      return data as Record<string, unknown>
    }
    return undefined
  }

  private resolveMarketName(data: Record<string, unknown> | undefined): string | undefined {
    if (!data) {
      return undefined
    }
    const marketName = (data as { marketName?: unknown }).marketName
    if (typeof marketName === 'string' && marketName.length > 0) {
      return marketName
    }
    const market = (data as { market?: unknown }).market
    if (typeof market === 'string' && market.length > 0) {
      return market
    }
    return undefined
  }

  private extractMarketTypeFromChannel(channel: string): DlobMarketType | undefined {
    if (channel.includes('_perp_')) {
      return 'perp'
    }
    if (channel.includes('_spot_')) {
      return 'spot'
    }
    return undefined
  }

  private parseChannelType(channel: string): DlobChannel | undefined {
    if (channel.startsWith('orderbook')) {
      return 'orderbook'
    }
    if (channel.startsWith('trades')) {
      return 'trades'
    }
    return undefined
  }

  private findRecordForEnvelope(channel: DlobChannel, marketType: DlobMarketType, serverChannel: string): SubscriptionRecord | undefined {
    for (const record of this.subscriptions.values()) {
      if (record.channel !== channel) {
        continue
      }
      if (record.marketType !== marketType) {
        continue
      }
      if (record.serverChannel && record.serverChannel === serverChannel) {
        return record
      }
    }
    return undefined
  }

  private flushSubscriptions(): void {
    this.subscriptions.forEach((record) => {
      if (record.handlers.size === 0) {
        return
      }
      this.sendSubscribe(record)
    })
  }

  private resetActiveSubscriptions(): void {
    this.subscriptions.forEach((record) => {
      record.active = false
    })
  }

  private sendSubscribe(record: SubscriptionRecord): void {
    if (!this.socket || this.state !== 'connected') {
      return
    }
    const payload = {
      type: 'subscribe',
      marketType: record.marketType,
      channel: record.channel,
      market: record.market,
    }
    this.socket.send(JSON.stringify(payload))
    record.active = true
  }

  private sendUnsubscribe(record: SubscriptionRecord): void {
    if (!this.socket || this.state !== 'connected') {
      return
    }
    const payload = {
      type: 'unsubscribe',
      marketType: record.marketType,
      channel: record.channel,
      market: record.market,
    }
    this.socket.send(JSON.stringify(payload))
    record.active = false
  }

  private getSubscriptionKey(channel: DlobChannel, marketType: DlobMarketType, market: string): string {
    return `${channel}:${marketType}:${market}`
  }

  private startHeartbeatMonitor(): void {
    this.stopHeartbeatMonitor()
    this.heartbeatTimer = setInterval(() => {
      if (!this.lastHeartbeatTs) {
        return
      }
      if (Date.now() - this.lastHeartbeatTs > HEARTBEAT_TIMEOUT_MS) {
        console.warn('[DLOB] heartbeat missed threshold, reconnecting')
        this.forceReconnect()
      }
    }, HEARTBEAT_CHECK_MS)
  }

  private stopHeartbeatMonitor(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private forceReconnect(): void {
    this.teardownSocket()
    this.scheduleReconnect()
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.subscriptions.size === 0) {
      return
    }
    this.reconnectAttempts += 1
    const delay = Math.min(RECONNECT_MAX_DELAY_MS, RECONNECT_BASE_DELAY_MS * 2 ** (this.reconnectAttempts - 1))
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
    this.state = 'reconnecting'
    this.emitConnection({ attempt: this.reconnectAttempts })
  }

  private resetConnection(): void {
    this.teardownSocket()
    this.reconnectAttempts = 0
    this.state = 'idle'
    if (this.subscriptions.size > 0) {
      this.connect()
    }
  }

  private teardownSocket(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.stopHeartbeatMonitor()
    if (this.socket) {
      this.socket.onopen = null
      this.socket.onmessage = null
      this.socket.onerror = null
      this.socket.onclose = null
      try {
        this.socket.close()
      } catch (error) {
        console.error('[DLOB] error while closing websocket', error)
      }
      this.socket = null
    }
    this.resetActiveSubscriptions()
    this.messageQueue = []
    this.queueProcessing = false
  }

  private emitConnection(extra?: Partial<ConnectionEvent>): void {
    this.emitter.emit('connection', {
      state: this.state,
      ...extra,
    } satisfies ConnectionEvent)
  }

  private toMessageString(data: unknown): string | Promise<string> | null {
    if (typeof data === 'string') {
      return data
    }
    if (data instanceof ArrayBuffer) {
      return new TextDecoder().decode(data)
    }
    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      return data.text()
    }
    return null
  }

  private toMarketType(value: unknown): DlobMarketType | undefined {
    if (value === 'perp' || value === 'spot') {
      return value
    }
    return undefined
  }
}

export const dlobWebsocketService = DlobWebsocketService.getInstance()

export type {
  DlobOrderbookEvent,
  DlobTradeEvent,
  DlobStreamEvent,
  HeartbeatEvent,
  BackpressureEvent,
  ConnectionEvent,
  ConnectionState,
  DlobMarketType,
  DlobChannel,
}
