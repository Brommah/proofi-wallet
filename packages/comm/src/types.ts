export interface Message<T = unknown> {
  id: string;
  type: 'request' | 'response' | 'event';
  method: string;
  params?: T;
  result?: T;
  error?: MessageError;
  source: 'proofi-wallet';
}

export interface MessageError {
  code: number;
  message: string;
  data?: unknown;
}

export const ErrorCodes = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  USER_REJECTED: 4001,
  UNAUTHORIZED: 4100,
  TIMEOUT: -32000,
} as const;

export interface ChannelConfig {
  targetOrigin: string;
  targetWindow: Window;
  timeout?: number; // default 30000ms
}

export type WalletEvent =
  | 'connected'
  | 'disconnected'
  | 'accountChanged'
  | 'chainChanged';

export type WalletEventHandler = (data: unknown) => void;
