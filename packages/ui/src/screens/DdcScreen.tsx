import { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { useWalletStore } from '../stores/walletStore';
import { u8aToHex } from '@polkadot/util';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3847';

/**
 * Signature-based auth headers (fully decentralized).
 * Signs: `proofi:{timestamp}:{address}`
 */
function authHeaders(): Record<string, string> {
  const { address, keypair } = useWalletStore.getState();
  
  if (!address || !keypair || !(keypair as any)._polkadotPair) {
    // Fallback to JWT for backwards compat (will be removed)
    const token = localStorage.getItem('proofi_token') || '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  const timestamp = Date.now();
  const message = `proofi:${timestamp}:${address}`;
  const messageBytes = new TextEncoder().encode(message);
  const sigBytes = (keypair as any)._polkadotPair.sign(messageBytes);
  const signature = u8aToHex(sigBytes);

  return {
    'Content-Type': 'application/json',
    'Authorization': `Signature ${address}:${timestamp}:${signature}`,
  };
}

interface StoredItem {
  cid: string;
  cdnUrl: string;
  type: 'memo' | 'credential';
  credentialType?: string;
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
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<string | null>(null);

  // Check DDC status on mount
  useEffect(() => {
    fetch(`${API_URL}/ddc/status`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setStatus(d); })
      .catch(() => setStatus(null));
  }, []);

  // Load existing memos/credentials on mount
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    
    fetch(`${API_URL}/ddc/list`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.items) {
          setStoredItems(d.items.map((item: any) => ({
            cid: item.cid,
            cdnUrl: item.cdnUrl,
            type: item.type,
            credentialType: item.credentialType,
          })));
        }
      })
      .catch(() => {});
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
      setStoredItems((prev) => [{ cid: data.cid, cdnUrl: data.cdnUrl, type: 'memo' }, ...prev]);
      setSuccess(`✅ Memo stored on DDC! CID: ${data.cid}`);
      setMemo('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMigrate = async () => {
    setMigrating(true);
    setMigrateResult(null);
    try {
      const res = await fetch(`${API_URL}/ddc/migrate`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMigrateResult(`✅ Migrated ${data.migrated} items to DDC!`);
      // Reload items
      const listRes = await fetch(`${API_URL}/ddc/list`, { headers: authHeaders() });
      const listData = await listRes.json();
      if (listData.ok && listData.items) {
        setStoredItems(listData.items);
      }
    } catch (e: any) {
      setMigrateResult(`❌ Migration failed: ${e.message}`);
    } finally {
      setMigrating(false);
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
      setStoredItems((prev) => [{ cid: data.cid, cdnUrl: data.cdnUrl, type: 'credential' }, ...prev]);
      setSuccess(`🎓 Credential stored on DDC! CID: ${data.cid}`);
      setCredData('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-full p-6 pb-20">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-3">
            <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
            </svg>
          </div>
          <h2 className="text-lg font-display font-bold text-white">DDC Storage</h2>
          <p className="text-xs text-gray-500 mt-1">Powered by Cere Network</p>
        </div>

        {/* DDC Status */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-4 mb-4">
          {status ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400">Connected to DDC Mainnet</span>
              <span className="text-xs text-gray-600 ml-auto">Bucket #{status.bucket}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-xs text-yellow-400">DDC initializing...</span>
            </div>
          )}
        </div>

        {/* Tab selector */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('memo')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
              tab === 'memo'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-gray-800 text-gray-500 border border-gray-700 hover:text-gray-300'
            }`}
          >
            📝 Memo
          </button>
          <button
            onClick={() => setTab('credential')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
              tab === 'credential'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-gray-800 text-gray-500 border border-gray-700 hover:text-gray-300'
            }`}
          >
            🎓 Credential
          </button>
        </div>

        {/* Memo form */}
        {tab === 'memo' && (
          <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5 space-y-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Store a memo on DDC
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Type your memo here..."
                rows={3}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white
                           placeholder:text-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50
                           focus:outline-none transition-colors resize-none"
              />
            </div>
            <Button onClick={handleStoreMemo} loading={loading} fullWidth disabled={!memo.trim()}>
              Store on DDC
            </Button>
          </div>
        )}

        {/* Credential form */}
        {tab === 'credential' && (
          <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5 space-y-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Credential Type
              </label>
              <select
                value={credType}
                onChange={(e) => setCredType(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white
                           focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50
                           focus:outline-none transition-colors"
              >
                <option value="ProofOfIdentity">Proof of Identity</option>
                <option value="ProofOfOwnership">Proof of Ownership</option>
                <option value="ProofOfMembership">Proof of Membership</option>
                <option value="ProofOfCompletion">Proof of Completion</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Claim Data
              </label>
              <textarea
                value={credData}
                onChange={(e) => setCredData(e.target.value)}
                placeholder='{"name": "Mart", "role": "CEO"} or just text'
                rows={3}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white
                           placeholder:text-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50
                           focus:outline-none transition-colors resize-none font-mono"
              />
            </div>
            <Button onClick={handleStoreCredential} loading={loading} fullWidth disabled={!credData.trim()}>
              Issue Credential
            </Button>
          </div>
        )}

        {/* Success / Error */}
        {success && (
          <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs text-green-400 text-center">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Migration from legacy SQLite */}
        {migrateResult && (
          <div className={`mb-4 rounded-lg px-3 py-2 text-xs text-center ${
            migrateResult.startsWith('✅') 
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {migrateResult}
          </div>
        )}

        {storedItems.length === 0 && (
          <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/20 p-4 mb-4">
            <p className="text-xs text-yellow-400 mb-3">
              📦 Have old memos from before? Click to migrate them to DDC.
            </p>
            <button
              onClick={handleMigrate}
              disabled={migrating}
              className="w-full py-2 px-3 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-medium 
                         hover:bg-yellow-500/30 disabled:opacity-50 transition-colors"
            >
              {migrating ? 'Migrating...' : 'Migrate Legacy Data to DDC'}
            </button>
          </div>
        )}

        {/* Stored Items */}
        {storedItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Stored on DDC ({storedItems.length} items)</p>
            {storedItems.map((item, i) => (
              <div key={i} className="rounded-lg bg-gray-900 border border-gray-800 px-3 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs">{item.type === 'memo' ? '📝' : '🎓'}</span>
                  {item.credentialType && (
                    <span className="text-xs text-purple-400">{item.credentialType}</span>
                  )}
                  <p className="text-xs text-gray-400 font-mono truncate flex-1">{item.cid}</p>
                </div>
                <a
                  href={item.cdnUrl}
                  target="_blank"
                  rel="noopener"
                  className="text-xs text-blue-400 hover:underline"
                >
                  View on DDC →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
