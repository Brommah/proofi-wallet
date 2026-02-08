import Constants from 'expo-constants';

export const API_URL =
  Constants.expoConfig?.extra?.apiUrl ??
  'https://proofi-api-production.up.railway.app';

export const CERE_RPC_ENDPOINTS = [
  'wss://archive.mainnet.cere.network/ws',
  'wss://rpc.mainnet.cere.network/ws',
];

export const CERE_DECIMALS = 10;
export const CERE_SYMBOL = 'CERE';
export const CERE_SS58_PREFIX = 54;
