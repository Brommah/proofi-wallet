import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/Button';
import { PinDots } from '../components/PinDots';
import { ErrorBox } from '../components/ErrorBox';
import { Card } from '../components/Card';
import {
  isBiometricAvailable,
  getBiometricType,
  getBiometricLabel,
  authenticateWithBiometrics,
  isBiometricEnabled,
  enableBiometricUnlock,
  getPinWithBiometrics,
} from '../lib/biometrics';
import { Colors, Fonts, FontSize, Spacing } from '../constants/theme';

export function PinScreen() {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [localError, setLocalError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometric');

  const {
    email,
    setupPin,
    loading,
    error,
    clearError,
    hasExistingWallet,
    existingAddress,
  } = useAuthStore();

  const isRestoreFlow = hasExistingWallet;
  const currentPin = step === 1 ? pin : confirmPin;

  // Check biometric availability
  useEffect(() => {
    (async () => {
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);
      if (available) {
        const type = await getBiometricType();
        setBiometricType(getBiometricLabel(type));
      }
    })();
  }, []);

  // Try biometric unlock for returning users
  useEffect(() => {
    if (isRestoreFlow) {
      tryBiometricUnlock();
    }
  }, [isRestoreFlow]);

  const tryBiometricUnlock = async () => {
    const enabled = await isBiometricEnabled();
    if (!enabled) return;

    const storedPin = await getPinWithBiometrics();
    if (storedPin) {
      await setupPin(storedPin);
    }
  };

  const handleSubmit = async () => {
    clearError();
    setLocalError(null);

    if (pin.length < 6) {
      setLocalError('PIN must be at least 6 digits');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (isRestoreFlow) {
      await setupPin(pin);
      return;
    }

    if (step === 1) {
      setStep(2);
      setConfirmPin('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    if (pin !== confirmPin) {
      setLocalError("PINs don't match");
      setConfirmPin('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    await setupPin(pin);

    // Offer biometric setup after successful PIN creation
    if (biometricAvailable) {
      const success = await enableBiometricUnlock(pin);
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.tagline}>
            {isRestoreFlow ? 'WELCOME BACK' : step === 1 ? 'STEP 2 OF 2' : 'CONFIRM'}
          </Text>
          <Text style={styles.title}>
            {isRestoreFlow ? 'UNLOCK' : step === 1 ? 'CREATE PIN' : 'CONFIRM PIN'}
          </Text>
          <Text style={styles.subtitle}>
            {isRestoreFlow
              ? 'Enter your PIN to access your wallet'
              : step === 1
              ? 'This PIN protects your wallet'
              : 'Enter your PIN again to confirm'}
          </Text>
        </View>

        {/* Email Badge */}
        <Card label="AUTHENTICATED AS" style={styles.card}>
          <Text style={styles.emailText} numberOfLines={1}>
            {email}
          </Text>
        </Card>

        {/* Existing Wallet (restore flow) */}
        {isRestoreFlow && existingAddress && (
          <Card
            label="WALLET ADDRESS"
            borderColor={Colors.cyanAlpha(0.3)}
            backgroundColor={Colors.cyanAlpha(0.05)}
            style={styles.card}
          >
            <Text style={styles.addressText}>{existingAddress}</Text>
          </Card>
        )}

        {/* PIN Input */}
        <View style={styles.pinSection}>
          <Text style={styles.label}>
            {isRestoreFlow ? 'YOUR PIN' : step === 1 ? '6-8 DIGIT PIN' : 'RE-ENTER PIN'}
          </Text>
          <TextInput
            style={styles.pinInput}
            value={currentPin}
            onChangeText={handlePinChange}
            placeholder="••••••"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={8}
            autoFocus
            editable={!loading}
          />

          <PinDots length={6} filled={currentPin.length} maxLength={8} />
        </View>

        {/* Biometric option for restore flow */}
        {isRestoreFlow && biometricAvailable && (
          <Button
            title={`USE ${biometricType.toUpperCase()}`}
            onPress={tryBiometricUnlock}
            variant="ghost"
          />
        )}

        {/* Error */}
        {displayError && <ErrorBox message={displayError} />}

        {/* Submit */}
        <Button
          title={
            loading
              ? isRestoreFlow
                ? 'UNLOCKING'
                : 'CREATING'
              : isRestoreFlow
              ? 'UNLOCK WALLET'
              : step === 1
              ? 'CONTINUE'
              : 'CREATE WALLET'
          }
          onPress={handleSubmit}
          loading={loading}
          disabled={currentPin.length < 6}
        />

        {/* Back (create flow step 2) */}
        {!isRestoreFlow && step === 2 && (
          <Button
            title="← CHANGE PIN"
            onPress={() => {
              setStep(1);
              setConfirmPin('');
              setLocalError(null);
            }}
            variant="secondary"
          />
        )}

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Text style={styles.securityIcon}>⚡</Text>
          <Text style={styles.securityText}>
            {isRestoreFlow
              ? 'Same PIN unlocks the same wallet. Your keys are derived locally from your email + PIN combination.'
              : 'Your PIN never leaves this device. We cannot recover it. Store it safely.'}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
    gap: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.md,
  },
  tagline: {
    fontFamily: Fonts.label,
    fontSize: FontSize.xs,
    color: Colors.cyan,
    letterSpacing: 3,
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: FontSize.xxxl,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  card: {
    marginBottom: 0,
  },
  emailText: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  addressText: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.cyan,
  },
  pinSection: {
    gap: Spacing.lg,
  },
  label: {
    fontFamily: Fonts.label,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    letterSpacing: 2,
  },
  pinInput: {
    height: 56,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surface,
    color: Colors.white,
    fontFamily: Fonts.mono,
    fontSize: FontSize.xxl,
    textAlign: 'center',
    letterSpacing: 12,
  },
  securityNote: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.card,
    marginTop: Spacing.md,
  },
  securityIcon: {
    fontSize: FontSize.lg,
    color: Colors.cyan,
  },
  securityText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    lineHeight: 16,
  },
});
