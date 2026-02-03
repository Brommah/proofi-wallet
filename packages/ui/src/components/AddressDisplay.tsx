import { useState } from 'react';

interface AddressDisplayProps {
  address: string;
  truncate?: boolean;
}

export function AddressDisplay({ address, truncate = true }: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const display = truncate && address.length > 16
    ? `${address.slice(0, 8)}...${address.slice(-6)}`
    : address;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for iframe contexts
      const ta = document.createElement('textarea');
      ta.value = address;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-2 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2
                 hover:bg-gray-750 hover:border-gray-600 transition-colors group cursor-pointer"
      title="Copy address"
    >
      <span className="font-mono text-sm text-gray-300">{display}</span>
      <svg
        className="h-4 w-4 text-gray-500 group-hover:text-gray-300 transition-colors shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        {copied ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
          />
        )}
      </svg>
      {copied && (
        <span className="text-xs text-green-400 animate-pulse">Copied!</span>
      )}
    </button>
  );
}
