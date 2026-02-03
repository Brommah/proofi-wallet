import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';

export function PinScreen() {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [localError, setLocalError] = useState<string | null>(null);
  const { email, setupPin, loading, error, clearError, hasExistingWallet, existingAddress } = useAuthStore();
  
  const isRestoreFlow = hasExistingWallet;
  const currentPin = step === 1 ? pin : confirmPin;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (pin.length < 6) {
      setLocalError('PIN must be at least 6 digits');
      return;
    }

    if (isRestoreFlow) {
      await setupPin(pin);
      return;
    }

    if (step === 1) {
      setStep(2);
      setConfirmPin('');
      return;
    }

    if (pin !== confirmPin) {
      setLocalError('PINs don\'t match');
      setConfirmPin('');
      return;
    }

    await setupPin(pin);
  };

  const handlePinChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 8);
    if (step === 1) {
      setPin(cleaned);
    } else {
      setConfirmPin(cleaned);
    }
    setLocalError(null);
  };

  const displayError = localError || error;

  return (
    <div className="min-h-full flex flex-col justify-center px-6 py-12 bg-[#000]">
      <div className="w-full max-w-sm mx-auto">
        {/* Header */}
        <div className="mb-10 fade-in">
          <div className="text-label mb-4 text-[#00E5FF]">
            {isRestoreFlow ? 'Welcome Back' : step === 1 ? 'Step 2 of 2' : 'Confirm'}
          </div>
          <h1 className="text-display text-display-lg text-white mb-3">
            {isRestoreFlow 
              ? 'UNLOCK' 
              : step === 1 
                ? 'CREATE PIN' 
                : 'CONFIRM PIN'
            }
          </h1>
          <p className="text-body text-[#8A8A8A]">
            {isRestoreFlow 
              ? 'Enter your PIN to access your wallet'
              : step === 1 
                ? 'This PIN protects your wallet'
                : 'Enter your PIN again to confirm'
            }
          </p>
        </div>

        {/* Email Badge */}
        <div className="mb-6 p-4 border border-[#2A2A2A] slide-up">
          <div className="text-label mb-1">AUTHENTICATED AS</div>
          <div className="text-mono text-sm text-white truncate">{email}</div>
        </div>

        {/* Existing Wallet (restore flow) */}
        {isRestoreFlow && existingAddress && (
          <div className="mb-6 p-4 border border-[#00E5FF]/30 bg-[#00E5FF]/5 slide-up" style={{ animationDelay: '0.05s' }}>
            <div className="text-label mb-1">WALLET ADDRESS</div>
            <div className="text-mono text-xs text-[#00E5FF] break-all">
              {existingAddress}
            </div>
          </div>
        )}

        {/* PIN Form */}
        <form onSubmit={handleSubmit} className="space-y-6 slide-up" style={{ animationDelay: '0.1s' }}>
          <div>
            <label className="text-label block mb-3">
              {isRestoreFlow ? 'YOUR PIN' : step === 1 ? '6-8 DIGIT PIN' : 'RE-ENTER PIN'}
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={currentPin}
              onChange={(e) => handlePinChange(e.target.value)}
              placeholder="••••••"
              className="input-brutal w-full rounded-none text-center text-2xl tracking-[0.5em] placeholder:tracking-normal"
              autoFocus
              disabled={loading}
            />
          </div>

          {/* PIN Progress */}
          <div className="flex justify-center gap-2">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 transition-all duration-150 ${
                  i < currentPin.length
                    ? 'bg-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.5)]'
                    : i < 6
                    ? 'bg-[#2A2A2A]'
                    : 'bg-[#1A1A1A]'
                }`}
              />
            ))}
          </div>

          {/* Error */}
          {displayError && (
            <div className="p-4 bg-[#FF3366]/10 border-2 border-[#FF3366]/30">
              <p className="text-mono text-sm text-[#FF3366]">{displayError}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={currentPin.length < 6 || loading}
            className="btn-primary w-full rounded-none h-14"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <LoadingSpinner />
                {isRestoreFlow ? 'UNLOCKING' : 'CREATING'}
              </span>
            ) : isRestoreFlow ? (
              'UNLOCK WALLET'
            ) : step === 1 ? (
              'CONTINUE'
            ) : (
              'CREATE WALLET'
            )}
          </button>

          {/* Back (create flow step 2) */}
          {!isRestoreFlow && step === 2 && (
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setConfirmPin('');
                setLocalError(null);
              }}
              className="btn-secondary w-full rounded-none"
            >
              ← CHANGE PIN
            </button>
          )}
        </form>

        {/* Security Note */}
        <div className="mt-10 pt-6 border-t border-[#1A1A1A]">
          <div className="flex gap-3">
            <div className="text-[#00E5FF] text-lg">⚡</div>
            <p className="text-body-xs text-[#4A4A4A]">
              {isRestoreFlow ? (
                <>Same PIN unlocks the same wallet. Your keys are derived locally from your email + PIN combination.</>
              ) : (
                <>Your PIN never leaves this device. We cannot recover it. Store it safely.</>
              )}
            </p>
          </div>
        </div>
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
