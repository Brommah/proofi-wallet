import { useState } from 'react';
import { useRequestStore, type PendingRequest } from '../stores/requestStore';

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
    <div className="flex flex-col items-center justify-center min-h-full p-6 bg-[#000]">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-12 h-12 mb-3 ${
            isCredential
              ? 'bg-[#00E5FF]/10 border border-[#00E5FF]/20'
              : 'bg-[#FFB800]/10 border border-[#FFB800]/20'
          }`}>
            {isCredential ? (
              <svg className="w-6 h-6 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-[#FFB800]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
              </svg>
            )}
          </div>
          <h2 className="text-display text-display-sm text-white">
            {isCredential ? 'SIGN CREDENTIAL' : 'SIGN MESSAGE'}
          </h2>
          <p className="text-mono text-xs text-[#4A4A4A] mt-1">
            Review and approve this request
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0A0A0A] border border-[#2A2A2A] p-5 space-y-4">
          {/* App info */}
          <div className="flex items-center gap-3 pb-3 border-b border-[#1A1A1A]">
            <div className="w-9 h-9 bg-[#1A1A1A] flex items-center justify-center text-sm font-bold text-[#4A4A4A]">
              {appName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{appName}</p>
              <p className="text-mono text-xs text-[#4A4A4A] truncate">{appOrigin}</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-label">TYPE</span>
              <span className={isCredential ? 'text-[#00E5FF] text-mono' : 'text-[#FFB800] text-mono'}>
                {isCredential ? 'Credential' : 'Raw Message'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-label">METHOD</span>
              <span className="text-mono text-[#8A8A8A]">{method}</span>
            </div>
          </div>

          {/* Data preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-label">DATA</span>
              {data.length > 200 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-mono text-xs text-[#00E5FF] hover:text-white cursor-pointer transition-colors"
                >
                  {expanded ? 'Collapse' : 'Expand'}
                </button>
              )}
            </div>
            <div className="bg-[#000] border border-[#1A1A1A] p-3 max-h-48 overflow-auto">
              <pre className="text-xs text-mono text-[#8A8A8A] whitespace-pre-wrap break-all">
                {displayData}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1" onClick={reject}>
              REJECT
            </button>
            <button className="btn-primary flex-1" onClick={approve}>
              SIGN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
