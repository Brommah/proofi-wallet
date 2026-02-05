import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useWalletStore } from '../stores/walletStore';
import { OtpInput } from '../components/OtpInput';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3847';

/**
 * Wallet Recovery Flow:
 * 1. User enters email
 * 2. Receives OTP via email
 * 3. Verifies OTP
 * 4. Enters NEW PIN
 * 5. New keypair derived → new address
 * 6. Server stores recovery credential linking old → new address
 */
export function RecoveryScreen({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<'email' | 'otp' | 'pin' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState<1 | 2>(1);
  const [recoveryResult, setRecoveryResult] = useState<{
    newAddress: string;
    previousAddress: string | null;
  } | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send OTP');
      }
      setStep('otp');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      // Store temp token and salt
      localStorage.setItem('proofi_recovery_token', data.token);
      localStorage.setItem('proofi_recovery_salt', data.derivationSalt);
      localStorage.setItem('proofi_recovery_old_address', data.address || '');
      
      setStep('pin');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPin.length < 6) {
      setError('PIN must be at least 6 digits');
      return;
    }

    if (pinStep === 1) {
      setPinStep(2);
      setConfirmPin('');
      return;
    }

    if (newPin !== confirmPin) {
      setError("PINs don't match");
      setConfirmPin('');
      return;
    }

    setLoading(true);
    try {
      const salt = localStorage.getItem('proofi_recovery_salt')!;
      const token = localStorage.getItem('proofi_recovery_token')!;
      const oldAddress = localStorage.getItem('proofi_recovery_old_address') || undefined;

      // Derive new key from new PIN + salt
      const { deriveSeedFromPin, deriveKeypairFromSeed, encryptSeed } = await import('../lib/recovery');
      const seed = await deriveSeedFromPin(newPin, salt);
      const keypair = await deriveKeypairFromSeed(seed);

      // Call recovery endpoint
      // First, send another OTP for the recovery itself
      const sendRes = await fetch(`${API_URL}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      // Register the new address  
      const regRes = await fetch(`${API_URL}/auth/register-address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ address: keypair.address }),
      });

      // Store encrypted seed for session
      const encryptedSeed = await encryptSeed(seed, newPin);
      localStorage.setItem('proofi_encrypted_seed', encryptedSeed);
      localStorage.setItem('proofi_address', keypair.address);
      localStorage.setItem('proofi_token', token);
      localStorage.setItem('proofi_email', email);

      // Connect wallet
      useWalletStore.getState().connect(keypair.address, keypair);
      
      setRecoveryResult({
        newAddress: keypair.address,
        previousAddress: oldAddress || null,
      });
      setStep('done');

      // Clean up recovery state
      localStorage.removeItem('proofi_recovery_token');
      localStorage.removeItem('proofi_recovery_salt');
      localStorage.removeItem('proofi_recovery_old_address');

    } catch (e: any) {
      setError(e.message || 'Recovery failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    useAuthStore.setState({ isAuthenticated: true, email });
  };

  return (
    <div className="min-h-full flex flex-col justify-center px-6 py-12 bg-[#000]">
      <div className="w-full max-w-sm mx-auto">
        {/* Header */}
        <div className="mb-8 fade-in">
          <button
            onClick={onBack}
            className="text-mono text-xs text-[#4A4A4A] hover:text-white transition-colors mb-6 py-3 px-4"
          >
            ← BACK
          </button>
          <div className="text-label mb-4 text-[#FFB800]">Recovery</div>
          <h1 className="text-display text-display-lg text-white mb-3">
            {step === 'email' && 'RECOVER'}
            {step === 'otp' && 'VERIFY'}
            {step === 'pin' && (pinStep === 1 ? 'NEW PIN' : 'CONFIRM')}
            {step === 'done' && 'RECOVERED'}
          </h1>
          <p className="text-body text-[#8A8A8A]">
            {step === 'email' && 'Enter your email to recover your wallet with a new PIN.'}
            {step === 'otp' && `Verification code sent to ${email}`}
            {step === 'pin' && (pinStep === 1 ? 'Choose a new PIN for your wallet' : 'Confirm your new PIN')}
            {step === 'done' && 'Your wallet has been recovered with a new keypair.'}
          </p>
        </div>

        {/* Warning */}
        {step === 'email' && (
          <div className="mb-6 p-4 border border-[#FFB800]/30 bg-[#FFB800]/5 slide-up">
            <p className="text-mono text-sm text-[#FFB800]">
              ⚠️ Recovery creates a NEW wallet address. Your old credentials are preserved on DDC and linked via a recovery credential.
            </p>
          </div>
        )}

        {/* Email Step */}
        {step === 'email' && (
          <form onSubmit={handleSendOtp} className="space-y-6 slide-up">
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
              <div className="p-4 bg-[#FF3366]/10 border-2 border-[#FF3366]/30">
                <p className="text-mono text-sm text-[#FF3366]">{error}</p>
              </div>
            )}
            <button type="submit" disabled={!email || loading} className="btn-primary w-full rounded-none h-14">
              {loading ? 'SENDING...' : 'SEND VERIFICATION'}
            </button>
          </form>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <div className="space-y-6 slide-up">
            <OtpInput length={6} onComplete={handleVerifyOtp} disabled={loading} />
            {error && (
              <div className="p-4 bg-[#FF3366]/10 border-2 border-[#FF3366]/30">
                <p className="text-mono text-sm text-[#FF3366]">{error}</p>
              </div>
            )}
            {loading && (
              <div className="flex items-center justify-center gap-3 text-[#00E5FF]">
                <span className="text-mono text-sm">VERIFYING</span>
              </div>
            )}
          </div>
        )}

        {/* PIN Step */}
        {step === 'pin' && (
          <form onSubmit={handlePinSubmit} className="space-y-6 slide-up">
            <div>
              <label className="text-label block mb-3">
                {pinStep === 1 ? 'NEW 6-8 DIGIT PIN' : 'RE-ENTER PIN'}
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pinStep === 1 ? newPin : confirmPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                  pinStep === 1 ? setNewPin(val) : setConfirmPin(val);
                  setError(null);
                }}
                placeholder="••••••"
                className="input-brutal w-full rounded-none text-center text-2xl tracking-[0.5em]"
                autoFocus
                disabled={loading}
              />
            </div>
            <div className="flex justify-center gap-2">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 transition-all duration-150 ${
                    i < (pinStep === 1 ? newPin : confirmPin).length
                      ? 'bg-[#FFB800] shadow-[0_0_10px_rgba(255,184,0,0.5)]'
                      : i < 6 ? 'bg-[#2A2A2A]' : 'bg-[#1A1A1A]'
                  }`}
                />
              ))}
            </div>
            {error && (
              <div className="p-4 bg-[#FF3366]/10 border-2 border-[#FF3366]/30">
                <p className="text-mono text-sm text-[#FF3366]">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={(pinStep === 1 ? newPin : confirmPin).length < 6 || loading}
              className="btn-primary w-full rounded-none h-14"
            >
              {loading ? 'RECOVERING...' : pinStep === 1 ? 'CONTINUE' : 'RECOVER WALLET'}
            </button>
            {pinStep === 2 && (
              <button type="button" onClick={() => { setPinStep(1); setConfirmPin(''); }} className="btn-secondary w-full rounded-none">
                ← CHANGE PIN
              </button>
            )}
          </form>
        )}

        {/* Done Step */}
        {step === 'done' && recoveryResult && (
          <div className="space-y-6 slide-up">
            <div className="p-4 border border-[#00FF88]/30 bg-[#00FF88]/5">
              <div className="text-label mb-2">NEW ADDRESS</div>
              <div className="text-mono text-xs text-[#00FF88] break-all">{recoveryResult.newAddress}</div>
            </div>
            {recoveryResult.previousAddress && (
              <div className="p-4 border border-[#4A4A4A]">
                <div className="text-label mb-2">PREVIOUS ADDRESS</div>
                <div className="text-mono text-xs text-[#8A8A8A] break-all">{recoveryResult.previousAddress}</div>
                <div className="text-mono text-xs text-[#4A4A4A] mt-2">
                  A recovery credential has been stored on DDC linking your old and new addresses.
                </div>
              </div>
            )}
            <button onClick={handleDone} className="btn-primary w-full rounded-none h-14">
              OPEN WALLET
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
