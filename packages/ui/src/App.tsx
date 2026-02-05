import { useEffect, useState } from 'react';
import { useAuthStore } from './stores/authStore';
import { useWalletStore } from './stores/walletStore';
import { useRequestStore, type PendingRequest } from './stores/requestStore';
import { LoginScreen } from './screens/LoginScreen';
import { PinScreen } from './screens/PinScreen';
import { SignScreen } from './screens/SignScreen';
import { ConnectScreen } from './screens/ConnectScreen';
import { AccountScreen } from './screens/AccountScreen';
import { DdcScreen } from './screens/DdcScreen';
import { RecoveryScreen } from './screens/RecoveryScreen';
import { setTargetOrigin } from './lib/targetOrigin';

type Tab = 'wallet' | 'ddc';

export function App() {
  const [tab, setTab] = useState<Tab>('ddc');
  const [showRecovery, setShowRecovery] = useState(false);
  const [newCredentialCount, setNewCredentialCount] = useState(0);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const otpVerified = useAuthStore((s) => s.otpVerified);
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const pendingRequest = useRequestStore((s) => s.pendingRequest);
  const setRequest = useRequestStore((s) => s.setRequest);
  const walletConnect = useWalletStore((s) => s.connect);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // ── Fix 14: DDC polling for new credentials ──
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3847';
    let lastCount = -1;
    let pollTimer: ReturnType<typeof setInterval>;

    const checkForNew = async () => {
      const address = useWalletStore.getState().address;
      if (!address) return;
      
      try {
        const res = await fetch(`${API_URL}/ddc/list/${address}`);
        const data = await res.json();
        if (data.ok && typeof data.count === 'number') {
          if (lastCount >= 0 && data.count > lastCount) {
            setNewCredentialCount(prev => prev + (data.count - lastCount));
          }
          lastCount = data.count;
        }
      } catch {
        // Silent fail — polling is best-effort
      }
    };

    // Initial check + poll every 30s
    checkForNew();
    pollTimer = setInterval(checkForNew, 30_000);

    return () => clearInterval(pollTimer);
  }, [isAuthenticated]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const { data } = event;
      if (!data || typeof data !== 'object' || !data.type) return;

      // Set target origin from the embedding page's origin
      if (event.origin && event.origin !== window.location.origin) {
        setTargetOrigin(event.origin);
      }

      switch (data.type) {
        case 'PROOFI_SIGN_REQUEST': {
          const req: PendingRequest = {
            type: 'sign',
            id: data.id ?? crypto.randomUUID(),
            appName: data.appName ?? 'Unknown App',
            appOrigin: data.origin ?? event.origin,
            category: data.category ?? 'transaction',
            method: data.method ?? 'unknown',
            data: typeof data.data === 'string' ? data.data : JSON.stringify(data.data, null, 2),
          };
          setRequest(req);
          break;
        }
        case 'PROOFI_CONNECT_REQUEST': {
          const req: PendingRequest = {
            type: 'connect',
            id: data.id ?? crypto.randomUUID(),
            appName: data.appName ?? 'Unknown App',
            appOrigin: data.origin ?? event.origin,
            permissions: data.permissions ?? ['read'],
          };
          setRequest(req);
          break;
        }
        case 'PROOFI_SET_ADDRESS': {
          if (data.address) walletConnect(data.address);
          break;
        }
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [setRequest, walletConnect]);

  const screen = (() => {
    if (showRecovery) return <RecoveryScreen onBack={() => setShowRecovery(false)} />;
    if (!isAuthenticated && !otpVerified) return <LoginScreen onForgotPin={() => setShowRecovery(true)} />;
    if (otpVerified && !isAuthenticated) return <PinScreen onForgotPin={() => setShowRecovery(true)} />;
    if (pendingRequest?.type === 'sign') return <SignScreen />;
    if (pendingRequest?.type === 'connect') return <ConnectScreen />;
    if (tab === 'ddc') return <DdcScreen />;
    return <AccountScreen />;
  })();

  return (
    <div className="min-h-screen bg-[#000] text-white flex flex-col max-w-[400px] mx-auto relative">
      {screen}

      {/* Bottom Navigation - Brutal Style */}
      {isAuthenticated && !pendingRequest && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[400px] bg-[#0A0A0A] border-t border-[#1A1A1A] pb-[env(safe-area-inset-bottom)]">
          <div className="flex">
            <NavItem 
              active={tab === 'wallet'}
              onClick={() => setTab('wallet')}
              label="WALLET"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 6v3" />
                </svg>
              }
            />
            <NavItem 
              active={tab === 'ddc'}
              onClick={() => { setTab('ddc'); setNewCredentialCount(0); }}
              label="DATA VAULT"
              badge={newCredentialCount > 0 ? newCredentialCount : undefined}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                </svg>
              }
            />
          </div>
        </nav>
      )}
    </div>
  );
}

function NavItem({ 
  active, 
  onClick, 
  label, 
  icon,
  badge,
}: { 
  active: boolean; 
  onClick: () => void; 
  label: string; 
  icon: React.ReactNode;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all relative ${
        active 
          ? 'text-[#00E5FF] border-t-2 border-[#00E5FF] bg-[#00E5FF]/5' 
          : 'text-[#4A4A4A] hover:text-[#8A8A8A] border-t-2 border-transparent'
      }`}
    >
      <div className="relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="notification-badge">{badge > 99 ? '99+' : badge}</span>
        )}
      </div>
      <span className="text-mono text-[10px] tracking-wider">{label}</span>
    </button>
  );
}
