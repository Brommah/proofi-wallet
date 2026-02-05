import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useWalletStore } from '../stores/walletStore';
import { getBalance, subscribeBalance, transfer, parseCere, formatCere, isValidAddress, estimateFee } from '../lib/cere';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { PinUnlockModal } from '../components/PinUnlockModal';
import { QRCodeSVG } from 'qrcode.react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3847';

interface RecentItem {
  cid: string;
  cdnUrl: string;
  type: 'memo' | 'credential';
  credentialType?: string;
  createdAt?: string;
}

type View = 'main' | 'send' | 'receive';

export function AccountScreen() {
  const { email, logout } = useAuthStore();
  const { address, keypair, disconnect } = useWalletStore();
  const [view, setView] = useState<View>('main');
  const [balance, setBalance] = useState<string>('--');
  const [balanceLoading, setBalanceLoading] = useState(true);
  
  // Send state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [fee, setFee] = useState<string | null>(null);
  
  // PIN unlock
  const [showPinUnlock, setShowPinUnlock] = useState(false);
  
  // Recent activity
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Fetch and subscribe to balance
  useEffect(() => {
    if (!address) return;
    
    let unsub: (() => void) | null = null;
    
    const init = async () => {
      try {
        setBalanceLoading(true);
        const bal = await getBalance(address);
        setBalance(bal.formatted);
        setBalanceLoading(false);
        
        // Subscribe to updates
        unsub = await subscribeBalance(address, (b) => {
          setBalance(b.formatted);
        });
      } catch (e) {
        console.error('[Balance] Error:', e);
        setBalance('Error');
        setBalanceLoading(false);
      }
    };
    
    init();
    return () => { unsub?.(); };
  }, [address]);

  // Fetch recent DDC activity
  useEffect(() => {
    if (!address) return;
    setActivityLoading(true);
    fetch(`${API_URL}/ddc/list/${address}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.items) {
          setRecentItems(d.items.slice(0, 5)); // Last 5 items
        }
      })
      .catch(() => {})
      .finally(() => setActivityLoading(false));
  }, [address]);

  // Estimate fee when amount/recipient changes
  useEffect(() => {
    if (!address || !recipient || !amount || !isValidAddress(recipient)) {
      setFee(null);
      return;
    }
    
    const estimate = async () => {
      try {
        const amountBn = parseCere(amount);
        const feeBn = await estimateFee(address, recipient, amountBn);
        setFee(formatCere(feeBn));
      } catch {
        setFee(null);
      }
    };
    
    estimate();
  }, [address, recipient, amount]);

  const handleDisconnect = () => {
    disconnect();
    logout();
  };

  const handleSend = async () => {
    // Read keypair from store directly (React state may be stale after PIN unlock)
    const kp = keypair || useWalletStore.getState().keypair;
    if (!kp?.secretKey) {
      setShowPinUnlock(true);
      return;
    }
    
    setSending(true);
    setSendError(null);
    setSendSuccess(null);
    setSendStatus('Preparing...');
    
    try {
      await cryptoWaitReady();
      
      const amountBn = parseCere(amount);
      const result = await transfer(
        kp.secretKey,
        recipient,
        amountBn,
        (status) => setSendStatus(status)
      );
      
      setSendSuccess(`Sent! TX: ${result.hash.slice(0, 16)}...`);
      setRecipient('');
      setAmount('');
      setSendStatus(null);
    } catch (e: any) {
      setSendError(e.message || 'Transfer failed');
      setSendStatus(null);
    } finally {
      setSending(false);
    }
  };

  // Main View
  if (view === 'main') {
    return (
      <div className="min-h-full bg-[#000] pb-24">
        {/* Header */}
        <div className="px-6 pt-8 pb-6 border-b border-[#1A1A1A]">
          <div className="text-label mb-2 text-[#00E5FF]">Balance</div>
          <h1 className="text-display text-display-xl text-white leading-none">
            {balanceLoading ? (
              <div className="skeleton" style={{ height: '3.5rem', width: '60%' }} />
            ) : (
              balance.replace(' CERE', '')
            )}
          </h1>
          <div className="text-mono text-sm text-[#00E5FF] mt-2">CERE</div>
        </div>

        {/* Actions */}
        <div className="px-6 py-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => setView('send')}
            className="p-4 border-2 border-[#00E5FF]/30 bg-[#00E5FF]/5 hover:bg-[#00E5FF]/10 transition-colors"
          >
            <div className="text-2xl mb-2">↑</div>
            <div className="text-display text-sm text-[#00E5FF]">SEND</div>
          </button>
          <button
            onClick={() => setView('receive')}
            className="p-4 border-2 border-[#00FF88]/30 bg-[#00FF88]/5 hover:bg-[#00FF88]/10 transition-colors"
          >
            <div className="text-2xl mb-2">↓</div>
            <div className="text-display text-sm text-[#00FF88]">RECEIVE</div>
          </button>
        </div>

        {/* Address Card */}
        <div className="px-6 mb-6">
          <div className="p-4 border border-[#2A2A2A]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-label">ADDRESS</div>
              <button
                onClick={() => navigator.clipboard.writeText(address || '')}
                className="text-mono text-xs text-[#4A4A4A] hover:text-[#00E5FF] transition-colors"
              >
                COPY
              </button>
            </div>
            <div className="text-mono text-xs text-[#8A8A8A] break-all">{address}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 border border-[#2A2A2A]">
            <div className="text-label mb-2">STATUS</div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 ${keypair ? 'bg-[#00FF88]' : 'bg-[#FFB800]'}`} />
              <span className="text-mono text-sm text-white">
                {keypair ? 'UNLOCKED' : 'LOCKED'}
              </span>
            </div>
          </div>
          <div className="p-4 border border-[#2A2A2A]">
            <div className="text-label mb-2">NETWORK</div>
            <div className="text-mono text-sm text-[#00E5FF]">MAINNET</div>
          </div>
        </div>

        {/* Email */}
        <div className="px-6 mb-6">
          <div className="p-4 border border-[#2A2A2A]">
            <div className="text-label mb-2">ACCOUNT</div>
            <div className="text-mono text-sm text-white truncate">{email}</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="px-6 mb-6">
          <div className="text-label mb-3">RECENT ACTIVITY</div>
          {activityLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-3 border border-[#1A1A1A]">
                  <div className="flex items-center gap-2">
                    <div className="skeleton" style={{ width: '1.25rem', height: '1.25rem' }} />
                    <div className="skeleton" style={{ width: '60%', height: '0.875rem' }} />
                    <div className="skeleton ml-auto" style={{ width: '3rem', height: '0.625rem' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : recentItems.length > 0 ? (
            <div className="space-y-1">
              {recentItems.map((item, i) => (
                <div key={item.cid + i} className="p-3 border border-[#1A1A1A] hover:border-[#2A2A2A] transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {item.type === 'memo' ? '📝' : item.credentialType === 'GameAchievement' ? '🎮' : '📜'}
                    </span>
                    <span className="text-mono text-xs text-white truncate flex-1">
                      {item.credentialType || item.type.toUpperCase()}
                    </span>
                    {item.createdAt && (
                      <span className="text-mono text-xs text-[#4A4A4A] flex-shrink-0">
                        {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 border border-[#1A1A1A] text-center">
              <p className="text-mono text-xs text-[#4A4A4A]">No activity yet</p>
            </div>
          )}
        </div>

        {/* Disconnect */}
        <div className="px-6">
          <button
            onClick={handleDisconnect}
            className="w-full p-4 border-2 border-[#FF3366]/30 bg-[#FF3366]/5 text-[#FF3366] text-display text-sm tracking-wider hover:bg-[#FF3366]/10 transition-colors"
          >
            DISCONNECT
          </button>
        </div>
      </div>
    );
  }

  // Send View
  if (view === 'send') {
    const isValid = recipient && amount && isValidAddress(recipient) && parseFloat(amount) > 0;
    
    return (
      <div className="min-h-full bg-[#000] pb-24">
        <div className="px-6 pt-8 pb-6 border-b border-[#1A1A1A]">
          <button
            onClick={() => { setView('main'); setSendError(null); setSendSuccess(null); }}
            className="text-mono text-xs text-[#4A4A4A] hover:text-white transition-colors mb-4 py-3 px-4"
          >
            ← BACK
          </button>
          <h1 className="text-display text-display-md text-white">SEND CERE</h1>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Recipient */}
          <div>
            <label className="text-label block mb-3">RECIPIENT ADDRESS</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="5..."
              className="input-brutal w-full rounded-none text-mono text-sm"
              disabled={sending}
            />
            {recipient && !isValidAddress(recipient) && (
              <p className="text-mono text-xs text-[#FF3366] mt-2">Invalid address</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="text-label block mb-3">AMOUNT</label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                className="input-brutal w-full rounded-none text-2xl pr-20"
                disabled={sending}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-mono text-[#4A4A4A]">
                CERE
              </span>
            </div>
            <p className="text-mono text-xs text-[#4A4A4A] mt-2">
              Available: {balance}
            </p>
          </div>

          {/* Fee */}
          {fee && (
            <div className="p-4 border border-[#2A2A2A]">
              <div className="flex justify-between">
                <span className="text-label">NETWORK FEE</span>
                <span className="text-mono text-sm text-[#8A8A8A]">{fee}</span>
              </div>
            </div>
          )}

          {/* Status */}
          {sendStatus && (
            <div className="p-4 border border-[#00E5FF]/30 bg-[#00E5FF]/5">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin" />
                <span className="text-mono text-sm text-[#00E5FF]">{sendStatus}</span>
              </div>
            </div>
          )}

          {/* Error */}
          {sendError && (
            <div className="p-4 border-2 border-[#FF3366]/30 bg-[#FF3366]/5">
              <p className="text-mono text-sm text-[#FF3366]">{sendError}</p>
            </div>
          )}

          {/* Success */}
          {sendSuccess && (
            <div className="p-4 border-2 border-[#00FF88]/30 bg-[#00FF88]/5">
              <p className="text-mono text-sm text-[#00FF88]">{sendSuccess}</p>
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!isValid || sending}
            className="btn-primary w-full rounded-none h-14"
          >
            {sending ? 'SENDING...' : 'SEND'}
          </button>
        </div>

        <PinUnlockModal
          isOpen={showPinUnlock}
          onClose={() => setShowPinUnlock(false)}
          onUnlocked={() => {
            setShowPinUnlock(false);
            handleSend();
          }}
        />
      </div>
    );
  }

  // Receive View
  if (view === 'receive') {
    return (
      <div className="min-h-full bg-[#000] pb-24">
        <div className="px-6 pt-8 pb-6 border-b border-[#1A1A1A]">
          <button
            onClick={() => setView('main')}
            className="text-mono text-xs text-[#4A4A4A] hover:text-white transition-colors mb-4 py-3 px-4"
          >
            ← BACK
          </button>
          <h1 className="text-display text-display-md text-white">RECEIVE CERE</h1>
        </div>

        <div className="px-6 py-8">
          {/* QR Code */}
          <div className="w-52 h-52 mx-auto mb-8 bg-white p-3">
            <QRCodeSVG
              value={address || ''}
              size={184}
              level="M"
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </div>

          {/* Address */}
          <div className="text-center mb-6">
            <div className="text-label mb-3">YOUR ADDRESS</div>
            <div className="text-mono text-xs text-[#8A8A8A] break-all px-4">
              {address}
            </div>
          </div>

          {/* Copy Button */}
          <button
            onClick={() => navigator.clipboard.writeText(address || '')}
            className="btn-primary w-full rounded-none h-14"
          >
            COPY ADDRESS
          </button>

          <p className="text-center text-mono text-xs text-[#4A4A4A] mt-6">
            Only send CERE tokens to this address
          </p>
        </div>
      </div>
    );
  }

  return null;
}
