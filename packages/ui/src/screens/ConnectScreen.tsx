import { useRequestStore, type PendingRequest } from '../stores/requestStore';

function isConnectRequest(r: PendingRequest): r is Extract<PendingRequest, { type: 'connect' }> {
  return r.type === 'connect';
}

const permissionLabels: Record<string, { label: string; icon: string }> = {
  'sign': { label: 'Sign messages & credentials', icon: '✍️' },
  'read': { label: 'Read wallet address', icon: '👁️' },
  'verify': { label: 'Verify credentials', icon: '✅' },
  'issue': { label: 'Issue credentials', icon: '📜' },
};

export function ConnectScreen() {
  const { pendingRequest, approve, reject } = useRequestStore();

  if (!pendingRequest || !isConnectRequest(pendingRequest)) return null;

  const { appName, appOrigin, permissions } = pendingRequest;

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6 bg-[#000]">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#00E5FF]/10 border border-[#00E5FF]/20 mb-3">
            <svg className="w-6 h-6 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-1.242-7.244l4.5-4.5a4.5 4.5 0 016.364 6.364L17.25 8.688" />
            </svg>
          </div>
          <h2 className="text-display text-display-sm text-white">CONNECTION REQUEST</h2>
          <p className="text-mono text-xs text-[#4A4A4A] mt-1">An app wants to connect to your wallet</p>
        </div>

        {/* Card */}
        <div className="bg-[#0A0A0A] border border-[#2A2A2A] p-5 space-y-4">
          {/* App info */}
          <div className="flex items-center gap-3 pb-3 border-b border-[#1A1A1A]">
            <div className="w-9 h-9 bg-[#00E5FF]/10 flex items-center justify-center text-sm font-bold text-[#00E5FF]">
              {appName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{appName}</p>
              <p className="text-mono text-xs text-[#4A4A4A] truncate">{appOrigin}</p>
            </div>
          </div>

          {/* Permissions */}
          <div>
            <p className="text-label mb-2">REQUESTED PERMISSIONS</p>
            <div className="space-y-2">
              {permissions.map((perm) => {
                const info = permissionLabels[perm] || { label: perm, icon: '🔑' };
                return (
                  <div
                    key={perm}
                    className="flex items-center gap-2.5 bg-[#141414] border border-[#1A1A1A] px-3 py-2"
                  >
                    <span className="text-sm">{info.icon}</span>
                    <span className="text-mono text-xs text-[#8A8A8A]">{info.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1" onClick={reject}>
              DENY
            </button>
            <button className="btn-primary flex-1" onClick={approve}>
              APPROVE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
