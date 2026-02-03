import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { OtpInput } from '../components/OtpInput';
import { Button } from '../components/Button';

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
    <div className="flex flex-col min-h-full">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-6 pt-12 pb-16 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 text-center">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur border border-white/30 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-display font-bold text-white mb-2">
            Proofi Wallet
          </h1>
          <p className="text-white/70 text-sm">
            Self-custodial credentials, verified on-chain
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-6 -mt-8 relative z-10">
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-xl">
          {!otpSent ? (
            <>
              <div className="text-center mb-6">
                <h2 className="text-lg font-medium text-white mb-1">
                  Sign In or Create Account
                </h2>
                <p className="text-xs text-gray-500">
                  Enter your email to get started
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    autoFocus
                    disabled={loading}
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                    <p className="text-xs text-red-400">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={!email || loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Continue with Email'
                  )}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-3">
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <h2 className="text-lg font-medium text-white mb-1">
                  Check your email
                </h2>
                <p className="text-xs text-gray-500">
                  We sent a code to <span className="text-gray-300">{email}</span>
                </p>
              </div>

              <div className="space-y-4">
                <OtpInput 
                  length={6} 
                  onComplete={handleVerifyOtp}
                  disabled={loading}
                />

                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                    <p className="text-xs text-red-400">{error}</p>
                  </div>
                )}

                {loading && (
                  <div className="flex items-center justify-center gap-2 text-blue-400 text-sm">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying...
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => useAuthStore.setState({ otpSent: false, error: null })}
                  className="w-full text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  ← Use different email
                </button>
              </div>
            </>
          )}
        </div>

        {/* Features list */}
        <div className="mt-8 space-y-3">
          <Feature 
            icon="🔐" 
            title="Self-Custodial" 
            description="Your keys never leave your device"
          />
          <Feature 
            icon="⚡" 
            title="No Seed Phrases" 
            description="Sign in with email, secure with PIN"
          />
          <Feature 
            icon="🔗" 
            title="On-Chain Verified" 
            description="Credentials stored on Cere DDC"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center">
        <p className="text-xs text-gray-600">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900/50 border border-gray-800/50">
      <span className="text-lg">{icon}</span>
      <div>
        <p className="text-sm text-white font-medium">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}
