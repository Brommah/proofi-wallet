import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { useAuthStore } from '../stores/authStore';
import { transfer, parseAmount, isValidAddress, estimateFee } from '../lib/cere';
import { useWalletStore } from '../stores/walletStore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorBox, SuccessBox } from '../components/ErrorBox';
import { Colors, Fonts, FontSize, Spacing } from '../constants/theme';

type WalletView = 'main' | 'send' | 'receive';

export function WalletScreen() {
  const [view, setView] = useState<WalletView>('main');
  const { email, logout } = useAuthStore();
  const { address, isUnlocked, balance, balanceLoading, fetchBalance } = useWalletStore();
  const insets = useSafeAreaInsets();

  // Send state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const copyAddress = async () => {
    if (address) {
      await Clipboard.setStringAsync(address);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Copied', 'Address copied to clipboard');
    }
  };

  const handleDisconnect = () => {
    Alert.alert('Disconnect', 'Are you sure you want to disconnect your wallet?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  // --- Main View ---
  if (view === 'main') {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + Spacing.xl }]}
      >
        {/* Balance Header */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>BALANCE</Text>
          <Text style={styles.balanceAmount}>
            {balanceLoading ? '...' : (balance?.replace(' CERE', '') || '--')}
          </Text>
          <Text style={styles.balanceCurrency}>CERE</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setView('send')}
          >
            <Text style={styles.actionIcon}>↑</Text>
            <Text style={[styles.actionLabel, { color: Colors.cyan }]}>SEND</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonGreen]}
            onPress={() => setView('receive')}
          >
            <Text style={styles.actionIcon}>↓</Text>
            <Text style={[styles.actionLabel, { color: Colors.green }]}>RECEIVE</Text>
          </TouchableOpacity>
        </View>

        {/* Address */}
        <TouchableOpacity onPress={copyAddress}>
          <Card label="ADDRESS">
            <View style={styles.addressRow}>
              <Text style={styles.addressText} numberOfLines={2}>
                {address}
              </Text>
              <Text style={styles.copyHint}>COPY</Text>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card label="STATUS" style={styles.statCard}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isUnlocked ? Colors.green : Colors.amber },
                ]}
              />
              <Text style={styles.statusText}>
                {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
              </Text>
            </View>
          </Card>
          <Card label="NETWORK" style={styles.statCard}>
            <Text style={[styles.statusText, { color: Colors.cyan }]}>MAINNET</Text>
          </Card>
        </View>

        {/* Email */}
        <Card label="ACCOUNT">
          <Text style={styles.emailText} numberOfLines={1}>
            {email}
          </Text>
        </Card>

        {/* Disconnect */}
        <View style={styles.disconnectSection}>
          <Button title="DISCONNECT" onPress={handleDisconnect} variant="danger" />
        </View>
      </ScrollView>
    );
  }

  // --- Send View ---
  if (view === 'send') {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + Spacing.xl }]}
      >
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setView('main')}>
            <Text style={styles.backButton}>← BACK</Text>
          </TouchableOpacity>
          <Text style={styles.subTitle}>SEND CERE</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formLabel}>RECIPIENT ADDRESS</Text>
          <TextInput
            style={styles.input}
            value={recipient}
            onChangeText={setRecipient}
            placeholder="5..."
            placeholderTextColor={Colors.textTertiary}
            autoCapitalize="none"
            editable={!sending}
          />

          <Text style={styles.formLabel}>AMOUNT</Text>
          <View style={styles.amountContainer}>
            <TextInput
              style={[styles.input, styles.amountInput]}
              value={amount}
              onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="decimal-pad"
              editable={!sending}
            />
            <Text style={styles.currencyLabel}>CERE</Text>
          </View>

          {sendError && <ErrorBox message={sendError} />}
          {sendSuccess && <SuccessBox message={sendSuccess} />}

          <Button
            title={sending ? 'SENDING...' : 'SEND'}
            onPress={async () => {
              setSendError(null);
              setSendSuccess(null);

              if (!isValidAddress(recipient)) {
                setSendError('Invalid recipient address');
                return;
              }

              const { seedHex } = useWalletStore.getState();
              if (!seedHex) {
                setSendError('Wallet is locked. Please unlock with your PIN first.');
                return;
              }

              const amountPlanck = parseAmount(amount);
              if (amountPlanck <= 0n) {
                setSendError('Amount must be greater than 0');
                return;
              }

              setSending(true);
              try {
                const result = await transfer(
                  seedHex,
                  recipient,
                  amountPlanck,
                  (status) => console.log('[send]', status),
                );
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setSendSuccess(`Sent! TX: ${result.hash.slice(0, 18)}...`);
                setRecipient('');
                setAmount('');
                // Refresh balance
                fetchBalance();
              } catch (e: any) {
                console.error('[send] Transfer failed:', e);
                setSendError(e.message || 'Transfer failed');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              } finally {
                setSending(false);
              }
            }}
            loading={sending}
            disabled={!recipient || !amount}
          />
        </View>
      </ScrollView>
    );
  }

  // --- Receive View ---
  if (view === 'receive') {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, styles.receiveContent, { paddingTop: insets.top + Spacing.xl }]}
      >
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setView('main')}>
            <Text style={styles.backButton}>← BACK</Text>
          </TouchableOpacity>
          <Text style={styles.subTitle}>RECEIVE CERE</Text>
        </View>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          <View style={styles.qrWrapper}>
            {address && (
              <QRCode
                value={address}
                size={184}
                backgroundColor="#FFFFFF"
                color="#000000"
              />
            )}
          </View>
        </View>

        {/* Address */}
        <View style={styles.receiveAddress}>
          <Text style={styles.receiveAddressLabel}>YOUR ADDRESS</Text>
          <Text style={styles.receiveAddressText}>{address}</Text>
        </View>

        <Button title="COPY ADDRESS" onPress={copyAddress} />

        <Text style={styles.receiveWarning}>
          Only send CERE tokens to this address
        </Text>
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  contentContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100,
  },
  balanceSection: {
    paddingVertical: Spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card,
  },
  balanceLabel: {
    fontFamily: Fonts.label,
    fontSize: FontSize.xs,
    color: Colors.cyan,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  balanceAmount: {
    fontFamily: Fonts.display,
    fontSize: FontSize.display,
    color: Colors.white,
    lineHeight: FontSize.display * 1.1,
  },
  balanceCurrency: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.sm,
    color: Colors.cyan,
    marginTop: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  actionButton: {
    flex: 1,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.cyanAlpha(0.3),
    backgroundColor: Colors.cyanAlpha(0.05),
    alignItems: 'center',
  },
  actionButtonGreen: {
    borderColor: Colors.greenAlpha(0.3),
    backgroundColor: Colors.greenAlpha(0.05),
  },
  actionIcon: {
    fontSize: FontSize.xxl,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    fontFamily: Fonts.display,
    fontSize: FontSize.sm,
    letterSpacing: 2,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  addressText: {
    flex: 1,
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginRight: Spacing.md,
  },
  copyHint: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginVertical: Spacing.lg,
  },
  statCard: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
  },
  statusText: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  emailText: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  disconnectSection: {
    marginTop: Spacing.xxl,
  },
  // Sub views
  subHeader: {
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card,
    marginBottom: Spacing.xl,
  },
  backButton: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginBottom: Spacing.lg,
  },
  subTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSize.xxl,
    color: Colors.white,
  },
  form: {
    gap: Spacing.xl,
  },
  formLabel: {
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
  amountContainer: {
    position: 'relative',
  },
  amountInput: {
    fontSize: FontSize.xxl,
    paddingRight: 80,
  },
  currencyLabel: {
    position: 'absolute',
    right: Spacing.lg,
    top: 16,
    fontFamily: Fonts.mono,
    fontSize: FontSize.md,
    color: Colors.textTertiary,
  },
  // Receive view
  receiveContent: {
    alignItems: 'center',
  },
  qrContainer: {
    marginVertical: Spacing.xxl,
  },
  qrWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  receiveAddress: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  receiveAddressLabel: {
    fontFamily: Fonts.label,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  receiveAddressText: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  receiveWarning: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
