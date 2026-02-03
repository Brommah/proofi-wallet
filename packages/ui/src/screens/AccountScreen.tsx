import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useWalletStore } from '../stores/walletStore';
import { AddressDisplay } from '../components/AddressDisplay';
import { Button } from '../components/Button';

type Tab = 'overview' | 'credentials' | 'activity';

export function AccountScreen() {
  const [tab, setTab] = useState<Tab>('overview');
  const { email, logout } = useAuthStore();
  const { address, keypair, disconnect } = useWalletStore();

  const handleDisconnect = () => {
    disconnect();
    logout();
  };

  const shortAddress = address ? `${address.slice(0, 8)}...${address.slice(-6)}` : '';

  return (
    <div className="flex flex-col min-h-full">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 px-6 pt-6 pb-8 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-300 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10">
          {/* Profile section */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold text-white border border-white/20">
              {email?.[0]?.toUpperCase() || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-xs mb-0.5">Proofi Wallet</p>
              <p className="text-white font-medium truncate">{email}</p>
            </div>
            <button 
              onClick={() => navigator.clipboard.writeText(address || '')}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="Copy address"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
              </svg>
            </button>
          </div>

          {/* Balance card */}
          <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-4">
            <p className="text-white/60 text-xs mb-1">Wallet Address</p>
            <p className="text-white font-mono text-sm mb-3">{shortAddress}</p>
            
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/60 text-xs mb-0.5">Signing Key</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${keypair ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  <span className="text-white text-sm">{keypair ? 'Active' : 'Locked'}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-xs mb-0.5">Network</p>
                <p className="text-white text-sm font-medium">Cere Mainnet</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-gray-800 bg-gray-950 sticky top-0 z-20">
        {(['overview', 'credentials', 'activity'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-xs font-medium capitalize transition-colors ${
              tab === t 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 pb-24">
        {tab === 'overview' && (
          <div className="space-y-4">
            {/* Quick actions */}
            <div className="grid grid-cols-3 gap-3">
              <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <span className="text-xs text-gray-400">Receive</span>
              </button>
              
              <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <span className="text-xs text-gray-400">Verify</span>
              </button>
              
              <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  </svg>
                </div>
                <span className="text-xs text-gray-400">QR Code</span>
              </button>
            </div>

            {/* Wallet info card */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-4">
              <h3 className="text-sm font-medium text-white mb-3">Wallet Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Full Address</span>
                  <AddressDisplay address={address || ''} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Key Type</span>
                  <span className="text-xs text-gray-300">sr25519</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">SS58 Format</span>
                  <span className="text-xs text-gray-300">54 (Cere)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Derivation</span>
                  <span className="text-xs text-green-400">Self-custodial (v2)</span>
                </div>
              </div>
            </div>

            {/* Security card */}
            <div className="rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">Self-Custodial Security</h4>
                  <p className="text-xs text-gray-400">
                    Your private key is derived locally from your PIN. 
                    We never see or store your keys.
                  </p>
                </div>
              </div>
            </div>

            {/* Disconnect */}
            <Button variant="danger" fullWidth onClick={handleDisconnect}>
              Disconnect Wallet
            </Button>
          </div>
        )}

        {tab === 'credentials' && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 className="text-white font-medium mb-2">No Credentials Yet</h3>
              <p className="text-xs text-gray-500 mb-4">
                Credentials you issue or receive will appear here.
              </p>
              <Button variant="secondary">
                Issue First Credential
              </Button>
            </div>
          </div>
        )}

        {tab === 'activity' && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-medium mb-2">No Activity Yet</h3>
              <p className="text-xs text-gray-500">
                Your signing activity and DDC interactions will appear here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
