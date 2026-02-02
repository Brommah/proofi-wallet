/**
 * Core message type for postMessage communication.
 * Used for RPC requests, responses, and event broadcasts.
 */
export interface Message<T = unknown> {
  /** Unique message identifier for correlating requests/responses */
  id: string
  /** Message direction */
  type: 'request' | 'response' | 'event'
  /** RPC method name or event name */
  method: string
  /** Request parameters */
  params?: T
  /** Response result */
  result?: T
  /** Error information for failed requests */
  error?: MessageError
}

export interface MessageError {
  code: number
  message: string
}

/** Standard error codes */
export const ErrorCodes = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  TIMEOUT: -32000,
  UNKNOWN: -32099,
} as const

/** Wallet lifecycle events */
export type WalletEvent =
  | 'connected'
  | 'disconnected'
  | 'accountChanged'
  | 'chainChanged'
  | 'ready'
  | 'error'

/** Handler for wallet events */
export type WalletEventHandler<T = unknown> = (data: T) => void

/** Configuration for the message channel */
export interface ChannelConfig {
  /** Target window (e.g., iframe contentWindow) */
  target: Window
  /** Expected origin for security validation */
  targetOrigin: string
  /** Timeout for RPC requests in ms (default: 30000) */
  timeout?: number
}
