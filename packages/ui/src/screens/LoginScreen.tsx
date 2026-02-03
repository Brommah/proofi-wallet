import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { OtpInput } from '../components/OtpInput';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const { 
    otpSent, 
    sendOtp, 
    verifyOtp, 
    loading, 
    error, 
    clearError 
  } = useAuthStore();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await sendOtp(email);
  };

  const handleVerifyOtp = async (code: string) => {
    clearError();
    await verifyOtp(code);
  };

  return (
    <div className="min-h-full flex flex-col bg-[#000]">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        {/* Brand */}
        <div className="mb-12 fade-in">
          <div className="text-label mb-4 text-[#00E5FF]">Data Ownership Protocol</div>
          <h1 className="text-display text-display-xl text-white leading-none mb-3">
            PROOFI
          </h1>
          <p className="text-body text-[#8A8A8A] max-w-[280px]">
            Self-custodial credentials verified on-chain. Your data, your keys, your proof.
          </p>
        </div>

        {/* Auth Card */}
        <div className="slide-up" style={{ animationDelay: '0.1s' }}>
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label className="text-label block mb-3">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-brutal w-full rounded-none"
                  autoFocus
                  disabled={loading}
                  required
                />
              </div>

              {error && (
                <div className="bg-[#FF3366]/10 border-2 border-[#FF3366]/30 p-4">
                  <p className="text-mono text-sm text-[#FF3366]">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!email || loading}
                className="btn-primary w-full rounded-none h-14"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <LoadingSpinner />
                    SENDING
                  </span>
                ) : (
                  'CONTINUE'
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="text-label mb-2">Verification Code</div>
                <p className="text-body-sm text-[#8A8A8A] mb-6">
                  Sent to <span className="text-white text-mono">{email}</span>
                </p>
                
                <OtpInput 
                  length={6} 
                  onComplete={handleVerifyOtp}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-[#FF3366]/10 border-2 border-[#FF3366]/30 p-4">
                  <p className="text-mono text-sm text-[#FF3366]">{error}</p>
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center gap-3 text-[#00E5FF]">
                  <LoadingSpinner />
                  <span className="text-mono text-sm">VERIFYING</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => useAuthStore.setState({ otpSent: false, error: null })}
                className="btn-secondary w-full rounded-none"
              >
                ← DIFFERENT EMAIL
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="px-6 pb-8 stagger">
        <div className="grid grid-cols-3 gap-3">
          <FeatureBlock 
            label="CUSTODY"
            value="SELF"
            accent
          />
          <FeatureBlock 
            label="NETWORK"
            value="CERE"
          />
          <FeatureBlock 
            label="STORAGE"
            value="DDC"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <div className="border-t border-[#2A2A2A] pt-4">
          <p className="text-label text-center text-[#4A4A4A]">
            Your keys never leave your device
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureBlock({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`p-4 border ${accent ? 'border-[#00E5FF]/30 bg-[#00E5FF]/5' : 'border-[#2A2A2A]'}`}>
      <div className="text-label mb-1" style={{ fontSize: '0.5rem' }}>{label}</div>
      <div className={`text-display text-lg ${accent ? 'text-[#00E5FF]' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
