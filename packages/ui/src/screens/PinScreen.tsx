import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/Button';

export function PinScreen() {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // 1 = create/enter, 2 = confirm (create only)
  const [localError, setLocalError] = useState<string | null>(null);
  const { email, setupPin, loading, error, clearError, hasExistingWallet, existingAddress } = useAuthStore();
  
  // For existing users, we don't need confirmation step
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

    // Restore flow: no confirmation needed, just verify PIN unlocks correct wallet
    if (isRestoreFlow) {
      console.log('[PIN] Restoring wallet with PIN...');
      await setupPin(pin);
      return;
    }

    // Create flow: need confirmation step
    if (step === 1) {
      setStep(2);
      setConfirmPin(''); // Clear confirm field
      return;
    }

    // Confirm step - check match and create wallet
    if (pin !== confirmPin) {
      setLocalError('PINs don\'t match. Try again.');
      setConfirmPin('');
      return;
    }

    console.log('[PIN] Creating wallet with PIN...');
    await setupPin(pin);
  };

  const handlePinChange = (value: string) => {
    // Only allow digits, max 8 chars
    const cleaned = value.replace(/\D/g, '').slice(0, 8);
    console.log('[PIN] Input changed:', cleaned.length, 'digits, step:', step);
    
    if (step === 1) {
      setPin(cleaned);
    } else {
      setConfirmPin(cleaned);
    }
    setLocalError(null);
  };

  const displayError = localError || error;

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3 ${
            isRestoreFlow 
              ? 'bg-green-500/10 border border-green-500/20' 
              : 'bg-blue-500/10 border border-blue-500/20'
          }`}>
            <svg className={`w-6 h-6 ${isRestoreFlow ? 'text-green-400' : 'text-blue-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-lg font-display font-bold text-white">
            {isRestoreFlow 
              ? 'Welcome Back!' 
              : step === 1 
                ? 'Create Your PIN' 
                : 'Confirm Your PIN'
            }
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isRestoreFlow 
              ? 'Enter your PIN to unlock your wallet.'
              : step === 1 
                ? 'This PIN protects your wallet. You\'ll need it to sign transactions.'
                : 'Enter your PIN again to confirm.'
            }
          </p>
        </div>

        {/* Email badge */}
        <div className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 border border-gray-800 px-3 py-2 mb-4">
          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-gray-400">{email}</span>
        </div>

        {/* Existing wallet address (restore flow) */}
        {isRestoreFlow && existingAddress && (
          <div className="rounded-lg bg-green-500/5 border border-green-500/20 px-3 py-2 mb-6">
            <p className="text-xs text-gray-500 mb-1">Your wallet address:</p>
            <p className="text-xs text-green-400 font-mono break-all">
              {existingAddress.slice(0, 12)}...{existingAddress.slice(-8)}
            </p>
          </div>
        )}

        {/* PIN Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PIN Input */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">
              {isRestoreFlow 
                ? 'Enter your PIN to unlock' 
                : step === 1 
                  ? 'Enter a 6-8 digit PIN' 
                  : 'Re-enter your PIN to confirm'
              }
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={currentPin}
              onChange={(e) => handlePinChange(e.target.value)}
              placeholder="••••••"
              className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white text-center text-2xl tracking-[0.5em] placeholder:tracking-normal placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              autoFocus
              disabled={loading}
            />
            <p className="text-xs text-gray-600 mt-2 text-center">
              {currentPin.length}/6 minimum
            </p>
          </div>

          {/* PIN dots indicator */}
          <div className="flex justify-center gap-2">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-colors ${
                  i < currentPin.length
                    ? 'bg-blue-500'
                    : i < 6
                    ? 'bg-gray-700'
                    : 'bg-gray-800'
                }`}
              />
            ))}
          </div>

          {/* Error */}
          {displayError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
              <p className="text-xs text-red-400">{displayError}</p>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={currentPin.length < 6 || loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {isRestoreFlow ? 'Unlocking...' : 'Creating Wallet...'}
              </span>
            ) : isRestoreFlow ? (
              'Unlock Wallet'
            ) : step === 1 ? (
              'Continue'
            ) : (
              'Create Wallet'
            )}
          </Button>

          {/* Back button for confirm step (create flow only) */}
          {!isRestoreFlow && step === 2 && (
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setConfirmPin('');
                setLocalError(null);
              }}
              className="w-full text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← Change PIN
            </button>
          )}
        </form>

        {/* Security note */}
        <div className="mt-8 p-4 rounded-xl bg-gray-900/50 border border-gray-800">
          <div className="flex items-start gap-3">
            <svg className={`w-5 h-5 mt-0.5 shrink-0 ${isRestoreFlow ? 'text-green-400' : 'text-blue-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <div>
              <p className="text-xs text-gray-400">
                {isRestoreFlow ? (
                  <>
                    <strong className="text-white">Same PIN, same wallet.</strong> Use the PIN you created before 
                    to unlock your existing wallet on this device.
                  </>
                ) : (
                  <>
                    <strong className="text-white">Your keys, your crypto.</strong> Your PIN never leaves this device. 
                    We can't recover it if you forget.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
