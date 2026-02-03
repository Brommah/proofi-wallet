import { useState } from 'react';
import { useRequestStore, type PendingRequest } from '../stores/requestStore';
import { Button } from '../components/Button';

function isSignRequest(r: PendingRequest): r is Extract<PendingRequest, { type: 'sign' }> {
  return r.type === 'sign';
}

export function SignScreen() {
  const { pendingRequest, approve, reject } = useRequestStore();
  const [expanded, setExpanded] = useState(false);

  if (!pendingRequest || !isSignRequest(pendingRequest)) return null;

  const { appName, appOrigin, category, method, data } = pendingRequest;
  const isCredential = category === 'credential';
  const displayData = expanded || data.length <= 200 ? data : data.slice(0, 200) + '…';

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3 ${
            isCredential
              ? 'bg-purple-500/10 border border-purple-500/20'
              : 'bg-amber-500/10 border border-amber-500/20'
          }`}>
            {isCredential ? (
              <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
              </svg>
            )}
          </div>
          <h2 className="text-lg font-display font-bold text-white">
            {isCredential ? 'Sign Credential' : 'Sign Message'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Review and approve this request
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5 space-y-4">
          {/* App info */}
          <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
            <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400">
              {appName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{appName}</p>
              <p className="text-xs text-gray-600 truncate">{appOrigin}</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Type</span>
              <span className={isCredential ? 'text-purple-400' : 'text-amber-400'}>
                {isCredential ? 'Credential' : 'Raw Message'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Method</span>
              <span className="text-gray-300 font-mono">{method}</span>
            </div>
          </div>

          {/* Data preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500">Data</span>
              {data.length > 200 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
                >
                  {expanded ? 'Collapse' : 'Expand'}
                </button>
              )}
            </div>
            <div className="rounded-lg bg-gray-950 border border-gray-800 p-3 max-h-48 overflow-auto">
              <pre className="text-xs font-mono text-gray-400 whitespace-pre-wrap break-all">
                {displayData}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" fullWidth onClick={reject}>
              Reject
            </Button>
            <Button variant="primary" fullWidth onClick={approve}>
              Sign
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
