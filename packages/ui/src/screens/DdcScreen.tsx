import { useState, useEffect, useCallback, useRef } from 'react';
import { PinUnlockModal } from '../components/PinUnlockModal';
import { useWalletStore } from '../stores/walletStore';
import { u8aToHex } from '@polkadot/util';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3847';

let cryptoReady = false;
cryptoWaitReady().then(() => { cryptoReady = true; });

function authHeaders(): Record<string, string> {
  const { address, keypair } = useWalletStore.getState();
  if (!address || !keypair || !keypair.secretKey || !cryptoReady) {
    const token = localStorage.getItem('proofi_token') || '';
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  }
  try {
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 54 });
    const signingPair = keyring.addFromSeed(keypair.secretKey.slice(0, 32));
    const timestamp = Date.now();
    const message = `proofi:${timestamp}:${address}`;
    const messageBytes = new TextEncoder().encode(message);
    const sigBytes = signingPair.sign(messageBytes);
    const signature = u8aToHex(sigBytes);
    return { 'Content-Type': 'application/json', 'Authorization': `Signature ${address}:${timestamp}:${signature}` };
  } catch {
    const token = localStorage.getItem('proofi_token') || '';
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  }
}

interface StoredItem {
  cid: string;
  cdnUrl: string;
  type: 'memo' | 'credential';
  credentialType?: string;
  createdAt?: string;
}

interface ItemContent {
  raw: any;
  preview: string;
  title: string;
  icon: string;
  details: Record<string, string>;
}

interface DdcStatus {
  connected: boolean;
  issuerWallet: string;
  bucket: string;
}

type FilterType = 'all' | 'memo' | 'credential' | 'achievement';

/* ═══════════════════════════════════════════════════════════════
   CONTENT PARSER — extract human-readable info from stored data
   ═══════════════════════════════════════════════════════════════ */

function flattenForDisplay(obj: any, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (key === 'id' || key === '@context' || key === 'type') continue;
    const label = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(result, flattenForDisplay(val, label));
    } else if (Array.isArray(val)) {
      result[label] = val.join(', ');
    } else if (val !== null && val !== undefined) {
      result[label] = String(val);
    }
  }
  return result;
}

function parseContent(data: any, item: StoredItem): ItemContent {
  // Plain text memo
  if (typeof data === 'string') {
    return {
      raw: data,
      preview: data.slice(0, 140),
      title: data.split('\n')[0].slice(0, 60) || 'Memo',
      icon: '📝',
      details: { 'Content': data },
    };
  }

  // Verifiable Credential
  if (data.credentialSubject) {
    const subject = data.credentialSubject;
    const types = Array.isArray(data.type) ? data.type : [];
    const credType = types.find((t: string) => t !== 'VerifiableCredential') || item.credentialType || 'Credential';

    // Game Achievement
    if (item.credentialType === 'GameAchievement' || subject.achievementName || subject.gameName) {
      return {
        raw: data,
        preview: subject.achievementName || subject.gameName || 'Game Achievement',
        title: subject.achievementName || 'Achievement Unlocked',
        icon: '🎮',
        details: {
          ...(subject.gameName ? { 'Game': subject.gameName } : {}),
          ...(subject.achievementName ? { 'Achievement': subject.achievementName } : {}),
          ...(subject.score != null ? { 'Score': String(subject.score) } : {}),
          ...(subject.playerName ? { 'Player': subject.playerName } : {}),
          ...(subject.level ? { 'Level': String(subject.level) } : {}),
          ...(data.issuanceDate ? { 'Issued': new Date(data.issuanceDate).toLocaleString() } : {}),
        },
      };
    }

    // Generic credential
    const subjectValues = Object.entries(subject)
      .filter(([k]) => k !== 'id' && k !== '@context' && k !== 'type')
      .map(([, v]) => typeof v === 'string' ? v : JSON.stringify(v))
      .join(' · ');

    return {
      raw: data,
      preview: subjectValues.slice(0, 140) || credType,
      title: credType.replace(/([A-Z])/g, ' $1').trim(),
      icon: credType === 'ProofOfIdentity' ? '🪪' : credType === 'ProofOfOwnership' ? '🔑' : credType === 'ProofOfMembership' ? '👥' : credType === 'ProofOfCompletion' ? '✅' : '📜',
      details: {
        'Type': credType,
        ...flattenForDisplay(subject),
        ...(data.issuanceDate ? { 'Issued': new Date(data.issuanceDate).toLocaleString() } : {}),
        ...(data.issuer ? { 'Issuer': typeof data.issuer === 'string' ? data.issuer : data.issuer.id || JSON.stringify(data.issuer) } : {}),
      },
    };
  }

  // Memo JSON object
  if (data.memo) {
    return {
      raw: data,
      preview: String(data.memo).slice(0, 140),
      title: String(data.memo).split('\n')[0].slice(0, 60) || 'Memo',
      icon: '📝',
      details: {
        'Memo': String(data.memo),
        ...(data.timestamp ? { 'Timestamp': new Date(data.timestamp).toLocaleString() } : {}),
        ...(data.metadata ? flattenForDisplay(data.metadata) : {}),
      },
    };
  }

  // Unknown format
  const jsonStr = JSON.stringify(data, null, 2);
  return {
    raw: data,
    preview: jsonStr.slice(0, 140),
    title: 'Data',
    icon: '📦',
    details: flattenForDisplay(data),
  };
}

function getItemCategory(item: StoredItem): FilterType {
  if (item.credentialType === 'GameAchievement') return 'achievement';
  if (item.type === 'credential') return 'credential';
  return 'memo';
}

/* ═══════════════════════════════════════════════════════════════
   DETAIL MODAL
   ═══════════════════════════════════════════════════════════════ */

function DetailModal({ 
  item, 
  content, 
  onClose 
}: { 
  item: StoredItem; 
  content: ItemContent | null; 
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleShare = async () => {
    const shareData = {
      title: content?.title || 'Proofi Data',
      text: content?.preview || item.cid,
      url: item.cdnUrl,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      handleCopy(item.cdnUrl, 'link');
    }
  };

  const category = getItemCategory(item);
  const accentColor = category === 'achievement' ? '#FFE100' : category === 'credential' ? '#00E5FF' : '#00FF88';

  return (
    <div className="fixed inset-0 bg-[#000]/98 z-50 overflow-y-auto">
      <div className="min-h-full max-w-[400px] mx-auto">
        {/* Top bar */}
        <div className="sticky top-0 bg-[#000]/95 backdrop-blur-sm px-6 py-4 border-b border-[#1A1A1A] flex items-center justify-between z-10">
          <button onClick={onClose} className="text-mono text-xs text-[#4A4A4A] hover:text-white transition-colors flex items-center gap-2 py-3 px-4">
            <span>←</span> BACK
          </button>
          <button 
            onClick={handleShare}
            className="text-mono text-xs px-4 py-3 border border-[#2A2A2A] hover:border-[#00E5FF] hover:text-[#00E5FF] transition-colors"
          >
            SHARE ↗
          </button>
        </div>

        <div className="px-6 py-6 space-y-6 fade-in">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{content?.icon || '📦'}</span>
              <span 
                className="text-xs px-2 py-0.5 font-mono uppercase tracking-wider"
                style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
              >
                {category === 'achievement' ? 'ACHIEVEMENT' : category === 'credential' ? (item.credentialType || 'CREDENTIAL') : 'MEMO'}
              </span>
              {item.createdAt && (
                <span className="text-mono text-xs text-[#4A4A4A]">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <h2 className="text-display text-display-sm text-white">
              {content?.title || 'Loading...'}
            </h2>
          </div>

          {/* Content */}
          {content ? (
            <div className="space-y-4">
              {/* Detail fields */}
              <div className="space-y-1">
                {Object.entries(content.details).map(([key, val]) => (
                  <div key={key} className="p-3 border border-[#1A1A1A] hover:border-[#2A2A2A] transition-colors">
                    <div className="text-label mb-1">{key.toUpperCase()}</div>
                    <div className="text-mono text-sm text-white break-all whitespace-pre-wrap">
                      {val || '—'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Raw JSON */}
              <details className="group">
                <summary className="text-label cursor-pointer hover:text-[#00E5FF] transition-colors flex items-center gap-2">
                  <span className="group-open:rotate-90 transition-transform">▶</span>
                  RAW DATA
                </summary>
                <div className="mt-2 p-3 bg-[#0A0A0A] border border-[#1A1A1A] max-h-64 overflow-auto">
                  <pre className="text-mono text-xs text-[#8A8A8A] whitespace-pre-wrap break-all">
                    {typeof content.raw === 'string' ? content.raw : JSON.stringify(content.raw, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          ) : (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="p-3 border border-[#1A1A1A]">
                  <div className="h-3 w-20 bg-[#1A1A1A] animate-pulse mb-2" />
                  <div className="h-4 bg-[#1A1A1A] animate-pulse" style={{ width: `${60 + i * 10}%` }} />
                </div>
              ))}
            </div>
          )}

          {/* CID */}
          <div className="p-4 border border-[#2A2A2A]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-label">CONTENT ID (CID)</div>
              <button
                onClick={() => handleCopy(item.cid, 'cid')}
                className="text-mono text-xs text-[#4A4A4A] hover:text-[#00E5FF] transition-colors"
              >
                {copied === 'cid' ? '✓ COPIED' : 'COPY'}
              </button>
            </div>
            <div className="text-mono text-xs text-[#8A8A8A] break-all">{item.cid}</div>
          </div>

          {/* CDN Link */}
          <div className="p-4 border border-[#2A2A2A]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-label">CDN URL</div>
              <button
                onClick={() => handleCopy(item.cdnUrl, 'link')}
                className="text-mono text-xs text-[#4A4A4A] hover:text-[#00E5FF] transition-colors"
              >
                {copied === 'link' ? '✓ COPIED' : 'COPY'}
              </button>
            </div>
            <a 
              href={item.cdnUrl} 
              target="_blank" 
              rel="noopener"
              className="text-mono text-xs text-[#00E5FF] break-all hover:underline"
            >
              {item.cdnUrl}
            </a>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pb-8">
            <button
              onClick={() => handleCopy(item.cdnUrl, 'link')}
              className="p-3 border-2 border-[#00E5FF]/30 bg-[#00E5FF]/5 hover:bg-[#00E5FF]/10 transition-colors text-center"
            >
              <div className="text-display text-sm text-[#00E5FF]">
                {copied === 'link' ? '✓ COPIED' : 'COPY LINK'}
              </div>
            </button>
            <a
              href={item.cdnUrl}
              target="_blank"
              rel="noopener"
              className="p-3 border-2 border-[#2A2A2A] hover:border-[#00E5FF] transition-colors text-center"
            >
              <div className="text-display text-sm text-white">VIEW RAW</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   MAIN SCREEN
   ═══════════════════════════════════════════════════════════════ */

export function DdcScreen() {
  const [status, setStatus] = useState<DdcStatus | null>(null);
  const [memo, setMemo] = useState('');
  const [credType, setCredType] = useState('ProofOfIdentity');
  const [credData, setCredData] = useState('');
  const [storedItems, setStoredItems] = useState<StoredItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [inputTab, setInputTab] = useState<'memo' | 'credential'>('memo');
  const [showPinUnlock, setShowPinUnlock] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  
  // New state for improvements
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [contentMap, setContentMap] = useState<Map<string, ItemContent>>(new Map());
  const [contentLoading, setContentLoading] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<StoredItem | null>(null);
  const [showInput, setShowInput] = useState(false);
  
  const fetchedRef = useRef<Set<string>>(new Set());

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

  const [initialLoading, setInitialLoading] = useState(true);
  const address = useWalletStore((s) => s.address);
  const keypair = useWalletStore((s) => s.keypair);

  /* ─── Content fetching ─── */
  const fetchContent = useCallback(async (item: StoredItem) => {
    if (fetchedRef.current.has(item.cid)) return;
    fetchedRef.current.add(item.cid);
    
    setContentLoading(prev => new Set(prev).add(item.cid));
    try {
      const res = await fetch(item.cdnUrl);
      let data: any;
      const text = await res.text();
      try { data = JSON.parse(text); } catch { data = text; }
      
      const parsed = parseContent(data, item);
      setContentMap(prev => {
        const next = new Map(prev);
        next.set(item.cid, parsed);
        return next;
      });
    } catch {
      // Failed to fetch — use fallback
      setContentMap(prev => {
        const next = new Map(prev);
        next.set(item.cid, {
          raw: null,
          preview: item.cid.slice(0, 20) + '...',
          title: item.type === 'memo' ? 'Memo' : (item.credentialType || 'Credential'),
          icon: item.type === 'memo' ? '📝' : '📜',
          details: { 'CID': item.cid },
        });
        return next;
      });
    } finally {
      setContentLoading(prev => {
        const next = new Set(prev);
        next.delete(item.cid);
        return next;
      });
    }
  }, []);

  const loadItems = useCallback(() => {
    const { address: addr, keypair: kp } = useWalletStore.getState();
    if (!addr || !kp) return;
    
    fetch(`${API_URL}/ddc/list`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.items) {
          setStoredItems(d.items);
          d.items.forEach((item: StoredItem) => fetchContent(item));
        }
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, [fetchContent]);

  useEffect(() => {
    if (address && keypair) loadItems();
  }, [address, keypair, loadItems]);

  useEffect(() => {
    const onFocus = () => loadItems();
    const onVisibility = () => { if (document.visibilityState === 'visible') loadItems(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loadItems]);

  /* ─── Filtering & Search ─── */
  const filteredItems = storedItems.filter(item => {
    // Category filter
    if (filter !== 'all') {
      const cat = getItemCategory(item);
      if (cat !== filter) return false;
    }
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const content = contentMap.get(item.cid);
      const searchable = [
        item.cid,
        item.type,
        item.credentialType,
        content?.title,
        content?.preview,
        ...Object.values(content?.details || {}),
      ].filter(Boolean).join(' ').toLowerCase();
      return searchable.includes(q);
    }
    return true;
  });

  // Count per category
  const counts = {
    all: storedItems.length,
    memo: storedItems.filter(i => getItemCategory(i) === 'memo').length,
    credential: storedItems.filter(i => getItemCategory(i) === 'credential').length,
    achievement: storedItems.filter(i => getItemCategory(i) === 'achievement').length,
  };

  /* ─── Store handlers ─── */
  const handleStoreMemo = async () => {
    if (!memo.trim()) return;
    setLoading(true); setError(null); setSuccess(null);
    try {
      const res = await fetch(`${API_URL}/ddc/memo`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ memo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const newItem: StoredItem = { cid: data.cid, cdnUrl: data.cdnUrl, type: 'memo', createdAt: new Date().toISOString() };
      setStoredItems(prev => [newItem, ...prev]);
      fetchContent(newItem);
      setSuccess('Stored on DDC');
      setMemo('');
      setShowInput(false);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleStoreCredential = async () => {
    if (!credType || !credData.trim()) return;
    setLoading(true); setError(null); setSuccess(null);
    try {
      let claimData: any;
      try { claimData = JSON.parse(credData); } catch { claimData = { value: credData }; }
      const res = await fetch(`${API_URL}/ddc/credential`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ claimType: credType, claimData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const newItem: StoredItem = { cid: data.cid, cdnUrl: data.cdnUrl, type: 'credential', credentialType: credType, createdAt: new Date().toISOString() };
      setStoredItems(prev => [newItem, ...prev]);
      fetchContent(newItem);
      setSuccess('Credential issued');
      setCredData('');
      setShowInput(false);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  /* ─── Detail Modal ─── */
  if (selectedItem) {
    return (
      <>
        <DetailModal
          item={selectedItem}
          content={contentMap.get(selectedItem.cid) || null}
          onClose={() => setSelectedItem(null)}
        />
      </>
    );
  }

  return (
    <div className="min-h-full bg-[#000] pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 border-b border-[#1A1A1A]">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-display text-display-md text-white">DATA VAULT</h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={loadItems}
              className="text-[#4A4A4A] hover:text-[#00E5FF] transition-colors p-3"
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
          <div className="flex gap-4 mb-4">
            <div>
              <div className="text-label mb-1">NETWORK</div>
              <div className="text-mono text-sm text-white">CERE MAINNET</div>
            </div>
            <div>
              <div className="text-label mb-1">BUCKET</div>
              <div className="text-mono text-sm text-[#00E5FF]">#{status.bucket}</div>
            </div>
            <div>
              <div className="text-label mb-1">ITEMS</div>
              <div className="text-mono text-sm text-white">{storedItems.length}</div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A4A]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your vault..."
            className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white text-sm font-mono py-2.5 pl-10 pr-4 focus:border-[#00E5FF] focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-3 text-[#4A4A4A] hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          {([
            { key: 'all' as FilterType, label: 'ALL', color: '#FFFFFF' },
            { key: 'memo' as FilterType, label: 'MEMOS', color: '#00FF88' },
            { key: 'credential' as FilterType, label: 'CREDENTIALS', color: '#00E5FF' },
            { key: 'achievement' as FilterType, label: '🎮 ACHIEVEMENTS', color: '#FFE100' },
          ]).map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-shrink-0 text-mono text-xs px-3 py-2.5 border transition-all ${
                filter === key
                  ? 'border-current bg-current/10'
                  : 'border-[#2A2A2A] text-[#4A4A4A] hover:text-[#8A8A8A] hover:border-[#4A4A4A]'
              }`}
              style={filter === key ? { color, borderColor: color, backgroundColor: `${color}10` } : undefined}
            >
              {label}
              {counts[key] > 0 && (
                <span className="ml-1.5 opacity-60">{counts[key]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Add new button / Input toggle */}
      <div className="px-6 py-3">
        {!showInput ? (
          <button
            onClick={() => setShowInput(true)}
            className="w-full p-3 border-2 border-dashed border-[#2A2A2A] hover:border-[#00E5FF] text-[#4A4A4A] hover:text-[#00E5FF] transition-all flex items-center justify-center gap-2"
          >
            <span className="text-lg">+</span>
            <span className="text-display text-sm">ADD TO VAULT</span>
          </button>
        ) : (
          <div className="border border-[#2A2A2A] p-4 space-y-4 fade-in">
            {/* Input tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setInputTab('memo')}
                className={`tab flex-1 rounded-none text-xs ${inputTab === 'memo' ? 'active' : ''}`}
              >
                MEMO
              </button>
              <button
                onClick={() => setInputTab('credential')}
                className={`tab flex-1 rounded-none text-xs ${inputTab === 'credential' ? 'active' : ''}`}
              >
                CREDENTIAL
              </button>
            </div>

            {inputTab === 'memo' && (
              <div className="space-y-3">
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Enter your memo..."
                  rows={3}
                  className="input-brutal w-full rounded-none resize-none text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowInput(false); setMemo(''); }}
                    className="btn-secondary flex-1 rounded-none py-2 text-sm"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={() => withUnlock(handleStoreMemo)}
                    disabled={!memo.trim() || loading}
                    className="btn-primary flex-1 rounded-none py-2 text-sm"
                  >
                    {loading ? 'STORING...' : 'STORE'}
                  </button>
                </div>
              </div>
            )}

            {inputTab === 'credential' && (
              <div className="space-y-3">
                <select
                  value={credType}
                  onChange={(e) => setCredType(e.target.value)}
                  className="input-brutal w-full rounded-none appearance-none cursor-pointer text-sm"
                >
                  <option value="ProofOfIdentity">Proof of Identity</option>
                  <option value="ProofOfOwnership">Proof of Ownership</option>
                  <option value="ProofOfMembership">Proof of Membership</option>
                  <option value="ProofOfCompletion">Proof of Completion</option>
                  <option value="Custom">Custom</option>
                </select>
                <textarea
                  value={credData}
                  onChange={(e) => setCredData(e.target.value)}
                  placeholder='{"name": "...", "role": "..."}'
                  rows={3}
                  className="input-brutal w-full rounded-none resize-none text-mono text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowInput(false); setCredData(''); }}
                    className="btn-secondary flex-1 rounded-none py-2 text-sm"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={() => withUnlock(handleStoreCredential)}
                    disabled={!credData.trim() || loading}
                    className="btn-primary flex-1 rounded-none py-2 text-sm"
                  >
                    {loading ? 'ISSUING...' : 'ISSUE'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Messages */}
      <div className="px-6">
        {success && (
          <div className="mb-3 p-3 bg-[#00FF88]/10 border border-[#00FF88]/30 flex items-center gap-2">
            <span className="text-[#00FF88]">✓</span>
            <span className="text-mono text-sm text-[#00FF88]">{success}</span>
          </div>
        )}
        {error && (
          <div className="mb-3 p-3 bg-[#FF3366]/10 border border-[#FF3366]/30">
            <span className="text-mono text-sm text-[#FF3366]">{error}</span>
          </div>
        )}
      </div>

      {/* Items list */}
      <div className="px-6">
        {/* Skeleton loading state */}
        {initialLoading && storedItems.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-4 border border-[#1A1A1A]" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="skeleton" style={{ width: '1.5rem', height: '1.5rem' }} />
                  <div className="skeleton" style={{ width: '5rem', height: '0.875rem' }} />
                  <div className="skeleton ml-auto" style={{ width: '3rem', height: '0.75rem' }} />
                </div>
                <div className="skeleton" style={{ width: '70%', height: '1rem', marginBottom: '0.5rem' }} />
                <div className="skeleton" style={{ width: '90%', height: '0.75rem' }} />
              </div>
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-2">
            {searchQuery && (
              <div className="text-mono text-xs text-[#4A4A4A] mb-2">
                {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} for "{searchQuery}"
              </div>
            )}
            {filteredItems.map((item, i) => {
              const content = contentMap.get(item.cid);
              const isLoading = contentLoading.has(item.cid);
              const category = getItemCategory(item);
              const accentColor = category === 'achievement' ? '#FFE100' : category === 'credential' ? '#00E5FF' : '#00FF88';
              
              return (
                <button
                  key={item.cid + i}
                  onClick={() => {
                    setSelectedItem(item);
                    if (!contentMap.has(item.cid)) fetchContent(item);
                  }}
                  className={`block w-full text-left p-4 border transition-all group hover:translate-x-1 ${
                    category === 'achievement'
                      ? 'border-[#FFE100]/20 hover:border-[#FFE100] bg-[#FFE100]/5'
                      : category === 'credential'
                      ? 'border-[#00E5FF]/20 hover:border-[#00E5FF] bg-[#00E5FF]/3'
                      : 'border-[#2A2A2A] hover:border-[#00FF88]'
                  }`}
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  {/* Top row: icon + type + time */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{content?.icon || (isLoading ? '⏳' : '📦')}</span>
                    <span 
                      className="text-xs px-1.5 py-0.5 font-mono uppercase tracking-wider"
                      style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                    >
                      {category === 'achievement' ? 'ACHIEVEMENT' : category === 'credential' ? (item.credentialType || 'CREDENTIAL') : 'MEMO'}
                    </span>
                    {item.createdAt && (
                      <span className="text-mono text-xs text-[#4A4A4A] ml-auto flex-shrink-0">
                        {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    <svg className="w-3 h-3 text-[#4A4A4A] group-hover:text-white transition-colors flex-shrink-0 ml-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>

                  {/* Title */}
                  {content ? (
                    <div className="text-white text-sm font-medium mb-1 truncate group-hover:text-white/90">
                      {content.title}
                    </div>
                  ) : isLoading ? (
                    <div className="h-4 w-3/4 bg-[#1A1A1A] animate-pulse mb-1 rounded" />
                  ) : null}

                  {/* Preview */}
                  {content ? (
                    <div className="text-[#8A8A8A] text-xs font-mono truncate group-hover:text-[#AAAAAA]">
                      {content.preview}
                    </div>
                  ) : isLoading ? (
                    <div className="h-3 w-full bg-[#1A1A1A] animate-pulse rounded" />
                  ) : (
                    <div className="text-mono text-xs text-[#4A4A4A] truncate">{item.cid}</div>
                  )}
                </button>
              );
            })}
          </div>
        ) : storedItems.length > 0 ? (
          /* No results for search/filter */
          <div className="mt-12 text-center">
            <div className="text-4xl mb-4 opacity-40">🔍</div>
            <p className="text-body-sm text-[#4A4A4A]">
              No items match your {searchQuery ? 'search' : 'filter'}
            </p>
            <button
              onClick={() => { setSearchQuery(''); setFilter('all'); }}
              className="text-mono text-xs text-[#00E5FF] mt-2 hover:underline"
            >
              CLEAR FILTERS
            </button>
          </div>
        ) : (
          /* Empty state */
          <div className="mt-12 text-center px-4">
            <div className="mb-6 text-[#1A1A1A] font-mono text-xs leading-relaxed select-none">
              <pre className="inline-block text-left">{`
  ┌──────────────────────┐
  │  ╔══╗                │
  │  ║  ║  DATA VAULT    │
  │  ╚══╝  ─────────     │
  │                      │
  │  Your decentralized  │
  │  data storage awaits │
  │                      │
  │  ▓▓░░░░░░░░  0%     │
  └──────────────────────┘
`}</pre>
            </div>
            <h3 className="text-display text-lg text-[#4A4A4A] mb-2">YOUR VAULT IS EMPTY</h3>
            <p className="text-body-sm text-[#4A4A4A] mb-6 max-w-[260px] mx-auto">
              Store memos, credentials and achievements on Cere's decentralized data cloud.
            </p>
            <button
              onClick={() => setShowInput(true)}
              className="btn-primary rounded-none px-8 py-3"
            >
              STORE YOUR FIRST ITEM
            </button>
          </div>
        )}
      </div>

      {/* PIN Unlock Modal */}
      <PinUnlockModal
        isOpen={showPinUnlock}
        onClose={() => { setShowPinUnlock(false); setPendingAction(null); }}
        onUnlocked={handleUnlocked}
      />
    </div>
  );
}
