import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { u8aToHex } from '@polkadot/util';
import { cryptoWaitReady, encodeAddress } from '@polkadot/util-crypto';
import { getCereEd25519SecretKey, normalizeWalletSecret } from './keyring.js';
import { CERE_SS58_PREFIX, RPC } from './vault.js';

export const CERE_TOKEN_SYMBOL = 'CERE';
export const DEFAULT_CERE_DECIMALS = 10;

function createTransferPair(walletSecret) {
  const secretKey = getCereEd25519SecretKey(normalizeWalletSecret(walletSecret));
  const publicKey = secretKey.slice(32);
  const keyring = new Keyring({ type: 'ed25519', ss58Format: CERE_SS58_PREFIX });
  keyring.addFromPair({ publicKey, secretKey });
  return keyring.getPair(encodeAddress(publicKey, CERE_SS58_PREFIX));
}

async function withDevnetApi(fn) {
  const provider = new WsProvider(RPC);
  const api = await ApiPromise.create({ provider });
  try {
    return await fn(api);
  } finally {
    await api.disconnect();
  }
}

function toBigInt(value) {
  return BigInt(value?.toString?.() || value || 0);
}

function maxBigInt(...values) {
  return values.reduce((max, value) => (value > max ? value : max), 0n);
}

export async function getCereBalance(address) {
  if (!address) throw new Error('Wallet address missing');

  return withDevnetApi(async (api) => {
    const account = await api.query.system.account(address);
    const data = account.data;
    const free = toBigInt(data.free);
    const reserved = toBigInt(data.reserved);
    const frozen = toBigInt(data.frozen);
    const miscFrozen = toBigInt(data.miscFrozen);
    const feeFrozen = toBigInt(data.feeFrozen);
    const locked = maxBigInt(frozen, miscFrozen, feeFrozen);
    const transferable = free > locked ? free - locked : 0n;
    const decimals = api.registry.chainDecimals?.[0] || DEFAULT_CERE_DECIMALS;
    const symbol = api.registry.chainTokens?.[0] || CERE_TOKEN_SYMBOL;

    return {
      address,
      free: free.toString(),
      reserved: reserved.toString(),
      locked: locked.toString(),
      transferable: transferable.toString(),
      nonce: account.nonce?.toString?.() || '0',
      decimals,
      symbol,
    };
  });
}

export function parseTokenAmount(value, decimals = DEFAULT_CERE_DECIMALS) {
  const clean = String(value || '').trim();
  if (!/^\d+(\.\d+)?$/.test(clean)) {
    throw new Error('Enter a valid CERE amount');
  }

  const [whole, fraction = ''] = clean.split('.');
  if (fraction.length > decimals) {
    throw new Error(`CERE supports up to ${decimals} decimal places on this network`);
  }

  const base = 10n ** BigInt(decimals);
  return BigInt(whole) * base + BigInt(fraction.padEnd(decimals, '0') || '0');
}

export function formatTokenAmount(planck, decimals = DEFAULT_CERE_DECIMALS, precision = 4) {
  const value = BigInt(planck || 0);
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = value % base;
  const rawFraction = fraction.toString().padStart(decimals, '0');
  const trimmed = rawFraction.slice(0, precision).replace(/0+$/, '');
  return trimmed ? `${whole.toString()}.${trimmed}` : whole.toString();
}

export async function sendCereTokens({ walletSecret, to, amount }) {
  if (!walletSecret) throw new Error('Unlock Proofi before sending CERE');
  if (!to) throw new Error('Recipient address missing');

  await cryptoWaitReady();
  const pair = createTransferPair(walletSecret);

  return withDevnetApi(async (api) => {
    const decimals = api.registry.chainDecimals?.[0] || DEFAULT_CERE_DECIMALS;
    const symbol = api.registry.chainTokens?.[0] || CERE_TOKEN_SYMBOL;
    const amountPlanck = parseTokenAmount(amount, decimals);
    if (amountPlanck <= 0n) throw new Error('Amount must be greater than zero');

    const transfer =
      api.tx.balances.transferKeepAlive ||
      api.tx.balances.transferAllowDeath ||
      api.tx.balances.transfer;
    if (!transfer) throw new Error('This devnet does not expose a balances transfer call');

    const tx = transfer(to.trim(), amountPlanck.toString());
    const paymentInfo = await tx.paymentInfo(pair);

    const hash = await new Promise((resolve, reject) => {
      let unsub;
      tx.signAndSend(pair, (result) => {
        if (result.dispatchError) {
          unsub?.();
          reject(new Error(result.dispatchError.toString()));
          return;
        }

        if (result.status.isInBlock || result.status.isFinalized) {
          unsub?.();
          resolve(result.txHash.toHex());
        }
      })
        .then((u) => {
          unsub = u;
        })
        .catch(reject);
    });

    return {
      hash,
      from: pair.address,
      to: to.trim(),
      amountPlanck: amountPlanck.toString(),
      feePlanck: paymentInfo.partialFee.toString(),
      decimals,
      symbol,
      publicKey: u8aToHex(pair.publicKey),
    };
  });
}
