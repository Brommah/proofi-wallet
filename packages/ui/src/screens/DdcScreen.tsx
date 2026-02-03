import { useState, useEffect } from 'react';
import { PinUnlockModal } from '../components/PinUnlockModal';
import { useWalletStore } from '../stores/walletStore';
import { u8aToHex } from '@polkadot/util';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3847';

// Global crypto ready state
let cryptoReady = false;
cryptoWaitReady().then(() => { cryptoReady = true; });

/**
 * Signature-based auth headers (fully decentralized).
 */
function authHeaders(): Record<string, string> {
  const { address, keypair } = useWalletStore.getState();
  
  if (!address || !keypair || !keypair.secretKey || !cryptoReady) {
    const token = localStorage.getItem('proofi_token') || '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  try {
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 54 });
    const signingPair = keyring.addFromSeed(keypair.secretKey.slice(0, 32));
    
    const timestamp = Date.now();
    const message = `proofi:${timestamp}:${address}`;
    const messageBytes = new TextEncoder().encode(message);
    const sigBytes = signingPair.sign(messageBytes);
    const signature = u8aToHex(sigBytes);

    return {
      'Content-Type': 'application/json',
      'Authorization': `Signature ${address}:${timestamp}:${signature}`,
    };
  } catch (e) {
    const token = localStorage.getItem('proofi_token') || '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }
}

interface StoredItem {
  cid: string;
  cdnUrl: string;
  type: 'memo' | 'credential';
  credentialType?: string;
  createdAt?: string;
}

interface DdcStatus {
  connected: boolean;
  issuerWallet: string;
  bucket: string;
}

export function DdcScreen() {
  const [status, setStatus] = useState<DdcStatus | null>(null);
  const [memo, setMemo] = useState('');
  const [credType, setCredType] = useState('ProofOfIdentity');
  const [credData, setCredData] = useState('');
  const [storedItems, setStoredItems] = useState<StoredItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tab, setTab] = useState<'memo' | 'credential'>('memo');
  const [showPinUnlock, setShowPinUnlock] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    cryptoWaitReady().then(() => { cryptoReady = true; });
  }, []);

  const needsUnlock = () => {
    const { keypair } = useWalletStore.getState();
    const hasEncryptedSeed = !!localStorage.getItem('proofi_encrypted_seed');
    return !keypair?.secretKey && hasEncryptedSeed;
  };

  const withUnlock = (action: () => void) => {
    if (needsUnlock()) {
      setPendingAction(() => action);
      setShowPinUnlock(true);
    } else {
      action();
    }
  };

  const handleUnlocked = () => {
    setShowPinUnlock(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  useEffect(() => {
    fetch(`${API_URL}/ddc/status`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setStatus(d); })
      .catch(() => setStatus(null));
  }, []);

  const loadItems = () => {
    const { address, keypair } = useWalletStore.getState();
    if (!address || !keypair) return;
    
    fetch(`${API_URL}/ddc/list`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.items) {
          setStoredItems(d.items);
        }
      })
      .catch(() => {});
  };

  // Load on mount
  useEffect(() => { loadItems(); }, []);

  // Auto-reload when page regains focus (e.g. switching back from game tab)
  useEffect(() => {
    const onFocus = () => loadItems();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') loadItems();
    });
    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const handleStoreMemo = async () => {
    if (!memo.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_URL}/ddc/memo`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ memo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStoredItems((prev) => [{ cid: data.cid, cdnUrl: data.cdnUrl, type: 'memo', createdAt: new Date().toISOString() }, ...prev]);
      setSuccess(`Stored on DDC`);
      setMemo('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStoreCredential = async () => {
    if (!credType || !credData.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      let claimData: any;
      try {
        claimData = JSON.parse(credData);
      } catch {
        claimData = { value: credData };
      }

      const res = await fetch(`${API_URL}/ddc/credential`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ claimType: credType, claimData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStoredItems((prev) => [{ cid: data.cid, cdnUrl: data.cdnUrl, type: 'credential', credentialType: credType, createdAt: new Date().toISOString() }, ...prev]);
      setSuccess(`Credential issued`);
      setCredData('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-[#000] pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 border-b border-[#1A1A1A]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-display text-display-md text-white">DATA VAULT</h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={loadItems}
              className="text-[#4A4A4A] hover:text-[#00E5FF] transition-colors p-1"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183" />
              </svg>
            </button>
            {status && (
              <div className="flex items-center gap-2">
                <div className="status-dot online" />
                <span className="text-mono text-xs text-[#00FF88]">LIVE</span>
              </div>
            )}
          </div>
        </div>
        
        {status && (
          <div className="flex gap-4">
            <div>
              <div className="text-label mb-1">NETWORK</div>
              <div className="text-mono text-sm text-white">CERE MAINNET</div>
            </div>
            <div>
              <div className="text-label mb-1">BUCKET</div>
              <div className="text-mono text-sm text-[#00E5FF]">#{status.bucket}</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-6 py-4 flex gap-2">
        <button
          onClick={() => setTab('memo')}
          className={`tab flex-1 rounded-none ${tab === 'memo' ? 'active' : ''}`}
        >
          MEMO
        </button>
        <button
          onClick={() => setTab('credential')}
          className={`tab flex-1 rounded-none ${tab === 'credential' ? 'active' : ''}`}
        >
          CREDENTIAL
        </button>
      </div>

      {/* Content */}
      <div className="px-6">
        {/* Memo Form */}
        {tab === 'memo' && (
          <div className="space-y-4 fade-in">
            <div>
              <label className="text-label block mb-3">Store Data on DDC</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Enter your memo..."
                rows={4}
                className="input-brutal w-full rounded-none resize-none"
              />
            </div>
            <button
              onClick={() => withUnlock(handleStoreMemo)}
              disabled={!memo.trim() || loading}
              className="btn-primary w-full rounded-none h-12"
            >
              {loading ? 'STORING...' : 'STORE ON DDC'}
            </button>
          </div>
        )}

        {/* Credential Form */}
        {tab === 'credential' && (
          <div className="space-y-4 fade-in">
            <div>
              <label className="text-label block mb-3">Credential Type</label>
              <select
                value={credType}
                onChange={(e) => setCredType(e.target.value)}
                className="input-brutal w-full rounded-none appearance-none cursor-pointer"
              >
                <option value="ProofOfIdentity">Proof of Identity</option>
                <option value="ProofOfOwnership">Proof of Ownership</option>
                <option value="ProofOfMembership">Proof of Membership</option>
                <option value="ProofOfCompletion">Proof of Completion</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="text-label block mb-3">Claim Data</label>
              <textarea
                value={credData}
                onChange={(e) => setCredData(e.target.value)}
                placeholder='{"name": "...", "role": "..."}'
                rows={4}
                className="input-brutal w-full rounded-none resize-none text-mono"
              />
            </div>
            <button
              onClick={() => withUnlock(handleStoreCredential)}
              disabled={!credData.trim() || loading}
              className="btn-primary w-full rounded-none h-12"
            >
              {loading ? 'ISSUING...' : 'ISSUE CREDENTIAL'}
            </button>
          </div>
        )}

        {/* Status Messages */}
        {success && (
          <div className="mt-4 p-4 bg-[#00FF88]/10 border-2 border-[#00FF88]/30">
            <div className="flex items-center gap-2">
              <span className="text-[#00FF88]">✓</span>
              <span className="text-mono text-sm text-[#00FF88]">{success}</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-[#FF3366]/10 border-2 border-[#FF3366]/30">
            <span className="text-mono text-sm text-[#FF3366]">{error}</span>
          </div>
        )}

        {/* Stored Items */}
        {storedItems.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-display text-lg text-white">STORED</h2>
              <span className="text-mono text-xs text-[#00E5FF]">{storedItems.length} ITEMS</span>
            </div>
            
            <div className="space-y-2">
              {storedItems.map((item, i) => (
                <a
                  key={i}
                  href={item.cdnUrl}
                  target="_blank"
                  rel="noopener"
                  className={`block p-4 border transition-colors group ${
                    item.credentialType === 'GameAchievement'
                      ? 'border-[#FFE100]/30 hover:border-[#FFE100] bg-[#FFE100]/5'
                      : 'border-[#2A2A2A] hover:border-[#00E5FF]'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {item.credentialType === 'GameAchievement' ? (
                      <span className="text-xs px-2 py-0.5 bg-[#FFE100]/10 text-[#FFE100]">
                        🎮 ACHIEVEMENT
                      </span>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 ${
                        item.type === 'memo' 
                          ? 'bg-[#2A2A2A] text-[#8A8A8A]' 
                          : 'bg-[#00E5FF]/10 text-[#00E5FF]'
                      }`}>
                        {item.type === 'memo' ? 'MEMO' : item.credentialType?.toUpperCase() || 'CREDENTIAL'}
                      </span>
                    )}
                    {item.createdAt && (
                      <span className="text-mono text-xs text-[#4A4A4A]">
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <div className={`text-mono text-xs truncate transition-colors ${
                    item.credentialType === 'GameAchievement'
                      ? 'text-[#FFE100]/60 group-hover:text-[#FFE100]'
                      : 'text-[#8A8A8A] group-hover:text-[#00E5FF]'
                  }`}>
                    {item.cid}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {storedItems.length === 0 && (
          <div className="mt-12 text-center">
            <div className="text-display text-4xl text-[#1A1A1A] mb-2">∅</div>
            <p className="text-body-sm text-[#4A4A4A]">No data stored yet</p>
          </div>
        )}
      </div>

      {/* PIN Unlock Modal */}
      <PinUnlockModal
        isOpen={showPinUnlock}
        onClose={() => {
          setShowPinUnlock(false);
          setPendingAction(null);
        }}
        onUnlocked={handleUnlocked}
      />
    </div>
  );
}
