/**
 * Polyfills for React Native / Hermes that need to load before everything else.
 * Provides crypto.getRandomValues which @polkadot/* and noble-* libs require.
 */
import { getRandomBytes } from 'expo-crypto';

if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = {};
}

if (typeof globalThis.crypto.getRandomValues === 'undefined') {
  (globalThis.crypto as any).getRandomValues = <T extends ArrayBufferView>(array: T): T => {
    if (!(array instanceof Uint8Array)) {
      // Most crypto libs only use Uint8Array
      const bytes = getRandomBytes(array.byteLength);
      new Uint8Array(array.buffer, array.byteOffset, array.byteLength).set(bytes);
    } else {
      const bytes = getRandomBytes(array.length);
      array.set(bytes);
    }
    return array;
  };
}
