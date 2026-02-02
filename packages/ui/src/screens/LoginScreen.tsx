import { useState } from 'react';
import { useAuthStore } from '../stores';

export function LoginScreen() {
  const { otpSent, loading, error, sendOtp, verifyOtp, clearError, email } =
    useAuthStore();
  const [emailInput, setEmailInput] = useState('');
  const [codeInput, setCodeInput] = useState('');

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.includes('@')) sendOtp(emailInput);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeInput.length === 6) verifyOtp(codeInput);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-text">
            Proof<span className="text-accent">i</span>
          </h1>
          <p className="text-text-dim text-sm mt-1 font-sans">
            Verified credentials. No middleman.
          </p>
        </div>

        {/* Card */}
        <div className="border border-border bg-bg p-7">
          {!otpSent ? (
            <form onSubmit={handleSendOtp}>
              <label className="block font-heading text-[11px] font-bold uppercase tracking-[2.5px] text-text-dim mb-3">
                Email Address
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  clearError();
                }}
                placeholder="you@example.com"
                className="w-full border border-border bg-bg px-4 py-3 font-mono text-[13px] text-text placeholder:text-text-muted focus:border-accent focus:outline-none transition-colors duration-150"
                autoFocus
                disabled={loading}
              />
              {error && (
                <p className="text-danger text-sm mt-2">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || !emailInput.includes('@')}
                className="w-full mt-4 px-8 py-4 bg-accent text-white border-2 border-accent font-heading text-sm font-bold uppercase tracking-[1px] hover:bg-accent-hover hover:border-accent-hover transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending…' : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify}>
              <p className="text-text-dim text-sm mb-4">
                We sent a 6-digit code to{' '}
                <span className="font-mono text-text text-[13px]">{email}</span>
              </p>
              <label className="block font-heading text-[11px] font-bold uppercase tracking-[2.5px] text-text-dim mb-3">
                Verification Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value.replace(/\D/g, ''));
                  clearError();
                }}
                placeholder="000000"
                className="w-full border border-border bg-bg px-4 py-3 font-mono text-[13px] text-text text-center tracking-[8px] placeholder:text-text-muted focus:border-accent focus:outline-none transition-colors duration-150"
                autoFocus
                disabled={loading}
              />
              {error && (
                <p className="text-danger text-sm mt-2">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || codeInput.length !== 6}
                className="w-full mt-4 px-8 py-4 bg-accent text-white border-2 border-accent font-heading text-sm font-bold uppercase tracking-[1px] hover:bg-accent-hover hover:border-accent-hover transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying…' : 'Verify'}
              </button>
              <button
                type="button"
                onClick={() => useAuthStore.setState({ otpSent: false, error: null })}
                className="w-full mt-2 py-2 text-text-dim text-sm underline hover:text-text transition-colors duration-150"
              >
                Use different email
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-text-muted text-[11px] mt-6 font-heading uppercase tracking-[1.5px]">
          Powered by Proof<span className="text-accent">i</span>
        </p>
      </div>
    </div>
  );
}
