export { MessageChannel } from './MessageChannel'
export { RpcChannel } from './RpcChannel'
export type { RpcHandler } from './RpcChannel'
export { WalletEventEmitter } from './WalletEventEmitter'

export type {
  Message,
  MessageError,
  ChannelConfig,
  WalletEvent,
  WalletEventHandler,
} from './types'

export { ErrorCodes } from './types'
export { generateId, isProofiMessage } from './utils'
