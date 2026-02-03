import { useAuthStore } from '../stores/authStore';
import { useWalletStore } from '../stores/walletStore';

export function AccountScreen() {
  const { email, logout } = useAuthStore();
  const { address, keypair, disconnect } = useWalletStore();

  const handleDisconnect = () => {
    disconnect();
    logout();
  };

  return (
    <div className="min-h-full bg-[#000] pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 border-b border-[#1A1A1A]">
        <div className="text-label mb-2 text-[#00E5FF]">Identity</div>
        <h1 className="text-display text-display-lg text-white">WALLET</h1>
      </div>

      {/* Address Card */}
      <div className="px-6 py-6">
        <div className="p-6 border border-[#2A2A2A] bg-[#0A0A0A]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-label">ADDRESS</div>
            <button
              onClick={() => navigator.clipboard.writeText(address || '')}
              className="text-mono text-xs text-[#4A4A4A] hover:text-[#00E5FF] transition-colors"
            >
              COPY
            </button>
          </div>
          <div className="text-mono text-sm text-white break-all leading-relaxed">
            {address}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
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
          <div className="text-mono text-sm text-[#00E5FF]">CERE</div>
        </div>
        <div className="p-4 border border-[#2A2A2A]">
          <div className="text-label mb-2">KEY TYPE</div>
          <div className="text-mono text-sm text-white">SR25519</div>
        </div>
        <div className="p-4 border border-[#2A2A2A]">
          <div className="text-label mb-2">CUSTODY</div>
          <div className="text-mono text-sm text-[#00FF88]">SELF</div>
        </div>
      </div>

      {/* Email */}
      <div className="px-6 mb-6">
        <div className="p-4 border border-[#2A2A2A]">
          <div className="text-label mb-2">AUTHENTICATED AS</div>
          <div className="text-mono text-sm text-white truncate">{email}</div>
        </div>
      </div>

      {/* Security Note */}
      <div className="px-6 mb-8">
        <div className="p-4 border border-[#00E5FF]/20 bg-[#00E5FF]/5">
          <div className="flex gap-3">
            <div className="text-[#00E5FF] text-lg">⚡</div>
            <div>
              <div className="text-mono text-xs text-[#00E5FF] mb-1">SELF-CUSTODIAL</div>
              <p className="text-body-xs text-[#8A8A8A]">
                Your private key is derived locally. We never see or store your keys.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 space-y-3">
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
