import { useState, useEffect } from 'react';
import { useWalletStore } from '../stores/walletStore';
import { KeyringManager } from '@proofi/core';
import { cryptoWaitReady } from '@polkadot/util-crypto';

interface PinUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlocked: () => void;
}

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

async function deriveKeypairFromSeed(seedHex: string) {
  await cryptoWaitReady();
  
  const mgr = new KeyringManager();
  mgr.ss58Prefix = 54;
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

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUnlock = async () => {
    const encryptedSeed = localStorage.getItem('proofi_encrypted_seed');
    const expectedAddress = localStorage.getItem('proofi_address');
    
    if (!encryptedSeed) {
      setError('No encrypted seed found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const seed = await decryptSeed(encryptedSeed, pin);
      const keypair = await deriveKeypairFromSeed(seed);
      
      if (expectedAddress && keypair.address !== expectedAddress) {
        setError('Wrong PIN');
        setLoading(false);
        return;
      }

      useWalletStore.getState().setKeypair(keypair);
      setPin('');
      onUnlocked();
    } catch (e: any) {
      setError('Wrong PIN or decryption failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#000]/95 flex items-center justify-center z-50 p-6">
      <div className="w-full max-w-sm fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-display text-display-md text-white mb-2">UNLOCK</div>
          <p className="text-body-sm text-[#8A8A8A]">Enter PIN to sign transaction</p>
        </div>

        {/* PIN Input */}
        <div className="space-y-6">
          <div>
            <label className="text-label block mb-3">YOUR PIN</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="input-brutal w-full rounded-none text-center text-2xl tracking-[0.5em] placeholder:tracking-normal"
              autoFocus
            />
          </div>

          {/* PIN Progress */}
          <div className="flex justify-center gap-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 transition-all duration-150 ${
                  i < pin.length
                    ? 'bg-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.5)]'
                    : 'bg-[#2A2A2A]'
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="p-4 bg-[#FF3366]/10 border-2 border-[#FF3366]/30 text-center">
              <p className="text-mono text-sm text-[#FF3366]">{error}</p>
            </div>
          )}

          <button
            onClick={handleUnlock}
            disabled={pin.length < 4 || loading}
            className="btn-primary w-full rounded-none h-14"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <LoadingSpinner />
                UNLOCKING
              </span>
            ) : (
              'UNLOCK'
            )}
          </button>

          <button
            onClick={onClose}
            className="btn-secondary w-full rounded-none"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
