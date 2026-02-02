import { useRequestStore } from '../stores';
import type { PendingRequest } from '../stores';

export function SignScreen() {
  const pendingRequest = useRequestStore((s) => s.pendingRequest);
  const approve = useRequestStore((s) => s.approve);
  const reject = useRequestStore((s) => s.reject);

  if (!pendingRequest || pendingRequest.type !== 'sign') return null;

  const req = pendingRequest as Extract<PendingRequest, { type: 'sign' }>;
  const isCredential = req.category === 'credential';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm">
        <div className="border border-border bg-bg">
          {/* Header */}
          <div className="p-7 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-bold text-text">
                Sign Request
              </h2>
              <span
                className={`inline-flex px-3 py-1 border text-[11px] font-bold uppercase tracking-[1px] font-heading ${
                  isCredential
                    ? 'border-success text-success'
                    : 'border-warning text-warning'
                }`}
              >
                {isCredential ? 'Credential' : 'Transaction'}
              </span>
            </div>

            {/* App info */}
            <div className="space-y-1">
              <p className="font-heading text-[11px] font-bold uppercase tracking-[2.5px] text-text-dim">
                Requesting App
              </p>
              <p className="text-text font-medium text-sm">{req.appName}</p>
              <p className="font-mono text-[11px] text-text-muted">
                {req.appOrigin}
              </p>
            </div>
          </div>

          {/* Data preview */}
          <div className="p-7 border-b border-border">
            <p className="font-heading text-[11px] font-bold uppercase tracking-[2.5px] text-text-dim mb-3">
              Method
            </p>
            <p className="font-mono text-[13px] text-text mb-4">{req.method}</p>

            <p className="font-heading text-[11px] font-bold uppercase tracking-[2.5px] text-text-dim mb-3">
              Data
            </p>
            <div className="border border-border bg-bg-off p-4 max-h-48 overflow-y-auto">
              <pre className="font-mono text-[11px] text-text-dim whitespace-pre-wrap break-all leading-relaxed">
                {req.data}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="p-7 flex gap-3">
            <button
              onClick={reject}
              className="flex-1 px-6 py-3 bg-transparent text-text border-2 border-border font-heading text-sm font-bold uppercase tracking-[1px] hover:border-border-strong transition-colors duration-150"
            >
              Reject
            </button>
            <button
              onClick={approve}
              className="flex-1 px-6 py-3 bg-accent text-white border-2 border-accent font-heading text-sm font-bold uppercase tracking-[1px] hover:bg-accent-hover hover:border-accent-hover transition-colors duration-150"
            >
              Sign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
