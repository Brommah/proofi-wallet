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

type Tab = 'wallet' | 'ddc';

export function App() {
  const [tab, setTab] = useState<Tab>('wallet');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const otpVerified = useAuthStore((s) => s.otpVerified);
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const pendingRequest = useRequestStore((s) => s.pendingRequest);
  const setRequest = useRequestStore((s) => s.setRequest);
  const walletConnect = useWalletStore((s) => s.connect);

  // Restore previous session on mount
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Listen for PostMessage from parent window
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const { data } = event;
      if (!data || typeof data !== 'object' || !data.type) return;

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

  // Route to the right screen
  const screen = (() => {
    // Not logged in yet
    if (!isAuthenticated && !otpVerified) return <LoginScreen />;
    // OTP verified, need to set PIN
    if (otpVerified && !isAuthenticated) return <PinScreen />;
    // Signed in, handle requests
    if (pendingRequest?.type === 'sign') return <SignScreen />;
    if (pendingRequest?.type === 'connect') return <ConnectScreen />;
    if (tab === 'ddc') return <DdcScreen />;
    return <AccountScreen />;
  })();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col max-w-[400px] mx-auto">
      {screen}

      {/* Bottom navigation - only when authenticated */}
      {isAuthenticated && !pendingRequest && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[400px] bg-gray-900 border-t border-gray-800">
          <div className="flex">
            <button
              onClick={() => setTab('wallet')}
              className={`flex-1 py-3 text-xs font-medium text-center transition-colors ${
                tab === 'wallet' ? 'text-blue-400 border-t-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 6v3" />
              </svg>
              Wallet
            </button>
            <button
              onClick={() => setTab('ddc')}
              className={`flex-1 py-3 text-xs font-medium text-center transition-colors ${
                tab === 'ddc' ? 'text-purple-400 border-t-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75" />
              </svg>
              DDC
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
