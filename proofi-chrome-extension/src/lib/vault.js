import { VaultSDK, KeypairWallet } from '@cef-ai/vault-sdk';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { stringToU8a, u8aToHex } from '@polkadot/util';
import { cryptoWaitReady, encodeAddress } from '@polkadot/util-crypto';
import { getCereEd25519SecretKey, normalizeWalletSecret } from './keyring.js';

export const VAULT_API = 'https://vault-api.compute.dev.ddcdragon.com';
export const GATEWAY = 'https://ddc-s3-gateway.compute.dev.ddcdragon.com';
export const RPC = 'wss://rpc.devnet.cere.network/ws';
export const CERE_SS58_PREFIX = 54;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function secretToBytes(walletSecret) {
  return getCereEd25519SecretKey(normalizeWalletSecret(walletSecret)).slice(0, 32);
}

function createVaultPair(walletSecret) {
  const keyring = new Keyring({ type: 'ed25519', ss58Format: CERE_SS58_PREFIX });
  return keyring.addFromSeed(secretToBytes(walletSecret));
}

async function signedHeaders(pair) {
  const sig = pair.sign(new Uint8Array(0));
  return {
    'X-Public-Key': u8aToHex(pair.publicKey),
    'X-Signature': Array.from(sig, (b) => b.toString(16).padStart(2, '0')).join(''),
    'X-Signature-Type': 'ed25519',
  };
}

async function getOnboardingStatus(pair) {
  const res = await fetch(`${GATEWAY}/auth/onboarding/status`, {
    method: 'GET',
    headers: await signedHeaders(pair),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`onboarding status ${res.status}`);
  return res.json();
}

async function bootstrap(pair) {
  const res = await fetch(`${GATEWAY}/auth/onboarding/bootstrap`, {
    method: 'POST',
    headers: await signedHeaders(pair),
  });
  if (res.status !== 200 && res.status !== 207) {
    const body = await res.text().catch(() => '');
    throw new Error(`onboarding bootstrap ${res.status}: ${body}`);
  }
}

async function fetchGatewayPubkey() {
  const res = await fetch(`${GATEWAY}/auth/info`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`auth/info ${res.status}`);
  const body = await res.json();
  const key = body.gateway_public_key || body.pubkey;
  if (!key) throw new Error('gateway pubkey missing in /auth/info');
  return key.startsWith('0x') ? key : `0x${key}`;
}

async function submitAddProxy(pair, gatewayPubkey, onProgress) {
  onProgress?.({ kind: 'connecting-rpc', detail: RPC });
  const provider = new WsProvider(RPC);
  const api = await ApiPromise.create({ provider });
  try {
    const cleanHex = gatewayPubkey.startsWith('0x') ? gatewayPubkey.slice(2) : gatewayPubkey;
    const delegateBytes = new Uint8Array(cleanHex.match(/.{2}/g).map((b) => parseInt(b, 16)));
    const delegateAddress = encodeAddress(delegateBytes, CERE_SS58_PREFIX);
    onProgress?.({ kind: 'submitting-add-proxy', detail: delegateAddress });

    const tx = api.tx.proxy.addProxy(delegateAddress, 'NonTransfer', 0);
    await new Promise((resolve, reject) => {
      let unsub;
      tx.signAndSend(pair, (result) => {
        if (result.dispatchError) {
          unsub?.();
          reject(new Error(result.dispatchError.toString()));
          return;
        }
        if (result.status.isInBlock || result.status.isFinalized) {
          unsub?.();
          resolve();
        }
      })
        .then((u) => {
          unsub = u;
        })
        .catch(reject);
    });
  } finally {
    await api.disconnect();
  }
}

async function pollUntilProxy(pair, timeoutMs = 60_000, intervalMs = 3_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const status = await getOnboardingStatus(pair);
    if (status?.gateway_is_proxy) return;
    await sleep(intervalMs);
  }
  throw new Error('Timed out waiting for gateway proxy authorization');
}

async function createSdk(walletSecret) {
  await cryptoWaitReady();
  const wallet = await KeypairWallet.fromSeed(secretToBytes(walletSecret));
  return new VaultSDK({
    endpoint: VAULT_API,
    wallet,
    s3GatewayAuthInfoUrl: `${GATEWAY}/auth/info`,
    rpcEndpoint: RPC,
  });
}

export async function getVaultIdentity(walletSecret) {
  await cryptoWaitReady();
  const pair = createVaultPair(walletSecret);
  return {
    address: pair.address,
    publicKey: u8aToHex(pair.publicKey),
  };
}

export async function claimVault(walletSecret, name = 'Proofi Wallet Cubby', onProgress = () => {}) {
  await cryptoWaitReady();
  const pair = createVaultPair(walletSecret);

  onProgress({ kind: 'checking-onboarding' });
  const initial = await getOnboardingStatus(pair);
  if (initial && !initial.gateway_is_proxy) {
    if (initial.faucet_eligible || initial.ddc_seed_eligible) {
      onProgress({ kind: 'funding-wallet' });
      await bootstrap(pair);
    }
    const gatewayPubkey = await fetchGatewayPubkey();
    await submitAddProxy(pair, gatewayPubkey, onProgress);
    onProgress({ kind: 'waiting-for-proxy' });
    await pollUntilProxy(pair);
  }

  onProgress({ kind: 'claiming-vault' });
  const sdk = await createSdk(walletSecret);
  const vault = await sdk.vault.ensure({ name, onboard: false });
  return vaultToRecord(vault);
}

export async function currentVault(walletSecret) {
  const sdk = await createSdk(walletSecret);
  const vault = await sdk.vault.current();
  return { vault, record: vaultToRecord(vault) };
}

function vaultToRecord(vault) {
  return {
    vaultId: vault.id,
    bucketId: vault.bucketId,
    walletPubkey: vault.walletPubkey,
    gatewayEndpoint: vault.gatewayEndpoint,
    region: vault.region,
  };
}

async function ensureScope(vault, name, displayName) {
  try {
    return await vault.scopes.get(name);
  } catch (err) {
    if (!isNotFound(err)) throw err;
    return vault.scopes.create({
      name,
      displayName: displayName || name,
      streamLabel: `${name}:events`,
      metadata: { source: 'proofi-extension' },
    });
  }
}

export async function publishVaultEvent(walletSecret, scopeName, event) {
  const { vault } = await currentVault(walletSecret);
  await ensureScope(vault, scopeName, scopeName);
  return vault.scope(scopeName).publish({
    type: event.type,
    role: event.role || 'user',
    context: event.context || `proofi-extension-${Date.now()}`,
    target: event.target,
    payload: event.payload || {},
    timestamp: event.timestamp || new Date().toISOString(),
  });
}

export async function loadVaultSnapshot(walletSecret) {
  const { vault, record } = await currentVault(walletSecret);
  const scopes = await vault.scopes.list();
  const agents = await vault.agents.list().catch(() => []);
  const events = [];

  for (const scope of scopes) {
    const name = scope.name || scope.scope;
    if (!name) continue;
    try {
      const streams = await vault.scope(name).streams.list();
      const streamItems = streams.items || streams.streams || [];
      for (const stream of streamItems) {
        const context = stream.context;
        if (!context) continue;
        try {
          const page = await vault.scope(name).stream(context).events.list();
          const items = Array.isArray(page) ? page : page.items || page.events || [];
          for (const item of items) events.push({ ...item, scope: name, context });
        } catch (err) {
          events.push({
            id: `${name}:${context}:summary`,
            scope: name,
            context,
            type: 'stream-summary',
            timestamp: stream.lastSeen || stream.updatedAt || stream.firstSeen,
            payload: stream,
          });
        }
      }
    } catch {
      // Some scopes may have no stream list yet.
    }
  }

  events.sort(
    (a, b) =>
      new Date(b.timestamp || b.at || 0).getTime() - new Date(a.timestamp || a.at || 0).getTime(),
  );

  return { record, scopes, agents, events };
}

export function isNotFound(err) {
  return err?.status === 404 || /not.found|not found|404/i.test(err?.message || '');
}

export function signVaultText(walletSecret, text) {
  const pair = createVaultPair(walletSecret);
  return u8aToHex(pair.sign(stringToU8a(text)));
}
