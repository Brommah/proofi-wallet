import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/authStore';
import { OtpInput } from '../components/OtpInput';
import { Button } from '../components/Button';
import { ErrorBox } from '../components/ErrorBox';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Colors, Fonts, FontSize, Spacing } from '../constants/theme';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const { otpSent, sendOtp, verifyOtp, loading, error, clearError } = useAuthStore();
  const insets = useSafeAreaInsets();

  const handleSendOtp = async () => {
    clearError();
    await sendOtp(email);
  };

  const handleVerifyOtp = async (code: string) => {
    clearError();
    await verifyOtp(code);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand */}
        <View style={styles.brand}>
          <Text style={styles.tagline}>DATA OWNERSHIP PROTOCOL</Text>
          <Text style={styles.title}>PROOFI</Text>
          <Text style={styles.subtitle}>
            Self-custodial credentials verified on-chain. Your data, your keys, your proof.
          </Text>
        </View>

        {/* Auth Card */}
        {!otpSent ? (
          <View style={styles.form}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            {error && <ErrorBox message={error} />}

            <Button
              title={loading ? 'SENDING' : 'CONTINUE'}
              onPress={handleSendOtp}
              loading={loading}
              disabled={!email}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>VERIFICATION CODE</Text>
            <Text style={styles.helperText}>
              Sent to <Text style={styles.emailHighlight}>{email}</Text>
            </Text>

            <View style={styles.otpContainer}>
              <OtpInput length={6} onComplete={handleVerifyOtp} disabled={loading} />
            </View>

            {error && <ErrorBox message={error} />}

            {loading && <LoadingSpinner label="VERIFYING" />}

            <Button
              title="← DIFFERENT EMAIL"
              onPress={() => useAuthStore.setState({ otpSent: false, error: null })}
              variant="secondary"
            />
          </View>
        )}

        {/* Features */}
        <View style={styles.features}>
          <FeatureBlock label="CUSTODY" value="SELF" accent />
          <FeatureBlock label="NETWORK" value="CERE" />
          <FeatureBlock label="STORAGE" value="DDC" />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Your keys never leave your device</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FeatureBlock({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View
      style={[
        styles.featureBlock,
        accent && {
          borderColor: Colors.cyanAlpha(0.3),
          backgroundColor: Colors.cyanAlpha(0.05),
        },
      ]}
    >
      <Text style={styles.featureLabel}>{label}</Text>
      <Text
        style={[styles.featureValue, accent && { color: Colors.cyan }]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  brand: {
    marginBottom: Spacing.xxxl,
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
    fontSize: FontSize.display,
    color: Colors.white,
    lineHeight: FontSize.display * 1.1,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    maxWidth: 280,
  },
  form: {
    gap: Spacing.xl,
  },
  label: {
    fontFamily: Fonts.label,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    letterSpacing: 2,
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surface,
    color: Colors.white,
    fontFamily: Fonts.mono,
    fontSize: FontSize.md,
    paddingHorizontal: Spacing.lg,
  },
  helperText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  emailHighlight: {
    fontFamily: Fonts.mono,
    color: Colors.white,
  },
  otpContainer: {
    marginVertical: Spacing.md,
  },
  features: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xxxl,
  },
  featureBlock: {
    flex: 1,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  featureLabel: {
    fontFamily: Fonts.label,
    fontSize: 8,
    color: Colors.textTertiary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  featureValue: {
    fontFamily: Fonts.display,
    fontSize: FontSize.lg,
    color: Colors.white,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.lg,
    marginTop: Spacing.xxl,
  },
  footerText: {
    fontFamily: Fonts.label,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    letterSpacing: 1,
  },
});
