import { useState } from 'react';
import { useWalletStore } from '../stores/walletStore';
import { KeyringManager } from '@proofi/core';

interface PinUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlocked: () => void;
}

/**
 * Decrypt seed with PIN.
 */
async function decryptSeed(encrypted: string, pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode('proofi-encrypt'), iterations: 50000 },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  );

  return decoder.decode(plaintext);
}

/**
 * Derive keypair from seed hex.
 */
async function deriveKeypairFromSeed(seedHex: string) {
  const mgr = new KeyringManager();
  mgr.ss58Prefix = 54; // Cere network
  await mgr.init();

  return mgr.importKey({
    type: 'sr25519',
    secretKey: seedHex,
    label: 'proofi-wallet',
    purposes: ['transaction', 'credential', 'authentication'],
  });
}

export function PinUnlockModal({ isOpen, onClose, onUnlocked }: PinUnlockModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUnlock = async () => {
    const encryptedSeed = localStorage.getItem('proofi_encrypted_seed');
    const expectedAddress = localStorage.getItem('proofi_address');
    
    if (!encryptedSeed) {
      setError('No encrypted seed found. Please login again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Decrypt seed with PIN
      const seed = await decryptSeed(encryptedSeed, pin);
      
      // Derive keypair
      const keypair = await deriveKeypairFromSeed(seed);
      
      // Verify address matches
      if (expectedAddress && keypair.address !== expectedAddress) {
        setError('Wrong PIN. Please try again.');
        setLoading(false);
        return;
      }

      // Update wallet store with full keypair
      useWalletStore.getState().setKeypair(keypair);
      
      console.log('[PinUnlock] ✅ Wallet unlocked:', keypair.address);
      setPin('');
      onUnlocked();
    } catch (e: any) {
      console.error('[PinUnlock] Failed:', e);
      setError('Wrong PIN or decryption failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-3">
            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-lg font-display font-bold text-white">Unlock Wallet</h2>
          <p className="text-xs text-gray-500 mt-1">Enter your PIN to sign transactions</p>
        </div>

        <div className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter PIN"
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-center text-xl tracking-[0.5em] text-white
                       placeholder:text-gray-600 placeholder:tracking-normal focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50
                       focus:outline-none transition-colors"
            autoFocus
          />

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400 text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleUnlock}
            disabled={pin.length < 4 || loading}
            className="w-full py-3 px-4 rounded-xl bg-blue-500 text-white font-medium text-sm
                       hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Unlocking...' : 'Unlock'}
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
