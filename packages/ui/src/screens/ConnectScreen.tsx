import { useRequestStore, type PendingRequest } from '../stores/requestStore';
import { Button } from '../components/Button';

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
    <div className="flex flex-col items-center justify-center min-h-full p-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-3">
            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-1.242-7.244l4.5-4.5a4.5 4.5 0 016.364 6.364L17.25 8.688" />
            </svg>
          </div>
          <h2 className="text-lg font-display font-bold text-white">Connection Request</h2>
          <p className="text-xs text-gray-500 mt-1">An app wants to connect to your wallet</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5 space-y-4">
          {/* App info */}
          <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-sm font-bold text-blue-400">
              {appName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{appName}</p>
              <p className="text-xs text-gray-600 truncate">{appOrigin}</p>
            </div>
          </div>

          {/* Permissions */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Requested permissions</p>
            <div className="space-y-2">
              {permissions.map((perm) => {
                const info = permissionLabels[perm] || { label: perm, icon: '🔑' };
                return (
                  <div
                    key={perm}
                    className="flex items-center gap-2.5 rounded-lg bg-gray-800/50 border border-gray-800 px-3 py-2"
                  >
                    <span className="text-sm">{info.icon}</span>
                    <span className="text-xs text-gray-300">{info.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" fullWidth onClick={reject}>
              Deny
            </Button>
            <Button variant="primary" fullWidth onClick={approve}>
              Approve
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
