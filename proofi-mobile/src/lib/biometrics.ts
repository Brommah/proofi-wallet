/**
 * Biometric authentication support (Face ID / Touch ID / Fingerprint)
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export type BiometricType = 'faceid' | 'fingerprint' | 'iris' | 'none';

/**
 * Check if biometric authentication is available on this device.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;

  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

/**
 * Get the type of biometric available.
 */
export async function getBiometricType(): Promise<BiometricType> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'faceid';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'fingerprint';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'iris';
  }
  return 'none';
}

/**
 * Get a human-readable label for the biometric type.
 */
export function getBiometricLabel(type: BiometricType): string {
  switch (type) {
    case 'faceid':
      return 'Face ID';
    case 'fingerprint':
      return 'Fingerprint';
    case 'iris':
      return 'Iris';
    default:
      return 'Biometric';
  }
}

/**
 * Authenticate with biometrics.
 */
export async function authenticateWithBiometrics(
  prompt: string = 'Unlock your Proofi wallet',
): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: prompt,
      cancelLabel: 'Use PIN',
      disableDeviceFallback: true,
      fallbackLabel: 'Use PIN',
    });
    return result.success;
  } catch {
    return false;
  }
}

/**
 * Check if user has enabled biometric unlock.
 */
export async function isBiometricEnabled(): Promise<boolean> {
  const enabled = await SecureStore.getItemAsync('proofi_biometric_enabled');
  return enabled === 'true';
}

/**
 * Enable biometric unlock — stores the PIN encrypted with device biometrics.
 */
export async function enableBiometricUnlock(pin: string): Promise<boolean> {
  try {
    // Store PIN in secure store with biometric protection
    await SecureStore.setItemAsync('proofi_biometric_pin', pin, {
      requireAuthentication: true,
      authenticationPrompt: 'Enable biometric unlock for Proofi',
    });
    await SecureStore.setItemAsync('proofi_biometric_enabled', 'true');
    return true;
  } catch {
    return false;
  }
}

/**
 * Disable biometric unlock.
 */
export async function disableBiometricUnlock(): Promise<void> {
  await SecureStore.deleteItemAsync('proofi_biometric_pin');
  await SecureStore.setItemAsync('proofi_biometric_enabled', 'false');
}

/**
 * Get PIN using biometric authentication.
 */
export async function getPinWithBiometrics(): Promise<string | null> {
  try {
    const pin = await SecureStore.getItemAsync('proofi_biometric_pin', {
      requireAuthentication: true,
      authenticationPrompt: 'Unlock your Proofi wallet',
    });
    return pin;
  } catch {
    return null;
  }
}
