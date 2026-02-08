/**
 * API client for Proofi backend.
 * Mirrors the web app's API calls, adapted for React Native.
 */

import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../constants/api';

/**
 * Get auth headers (Bearer token for now, signature auth when unlocked).
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync('proofi_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// --- DDC (Data Vault) endpoints ---

export interface StoredItem {
  cid: string;
  cdnUrl: string;
  type: 'memo' | 'credential';
  credentialType?: string;
  createdAt?: string;
}

export interface DdcStatus {
  ok: boolean;
  connected: boolean;
  issuerWallet: string;
  bucket: string;
}

export async function getDdcStatus(): Promise<DdcStatus | null> {
  try {
    const res = await fetch(`${API_URL}/ddc/status`);
    const data = await res.json();
    return data.ok ? data : null;
  } catch {
    return null;
  }
}

export async function listDdcItems(walletAddress?: string): Promise<StoredItem[]> {
  try {
    const headers = await getAuthHeaders();
    const endpoint = walletAddress 
      ? `${API_URL}/ddc/list/${walletAddress}`
      : `${API_URL}/ddc/list`;
    const res = await fetch(endpoint, { headers });
    const data = await res.json();
    return data.ok && data.items ? data.items : [];
  } catch {
    return [];
  }
}

export async function storeMemo(memo: string): Promise<StoredItem> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/ddc/memo`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ memo }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to store memo');
  return {
    cid: data.cid,
    cdnUrl: data.cdnUrl,
    type: 'memo',
    createdAt: new Date().toISOString(),
  };
}

export async function storeCredential(
  claimType: string,
  claimData: any,
): Promise<StoredItem> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/ddc/credential`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ claimType, claimData }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to issue credential');
  return {
    cid: data.cid,
    cdnUrl: data.cdnUrl,
    type: 'credential',
    credentialType: claimType,
    createdAt: new Date().toISOString(),
  };
}
