import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { HealthScopesScreen, HealthScope } from './HealthScopesScreen';
import { CapabilityTokensScreen } from './CapabilityTokensScreen';
import { AuditChainScreen } from './AuditChainScreen';
import { useWalletStore } from '../stores/walletStore';
import { Colors, Fonts, FontSize, Spacing } from '../constants/theme';

/**
 * Unified Proofi Screen - Main hub for health data management
 * Combines: Data Scopes + Capability Tokens + Audit Chain
 * Aligned with web extension and CLI experience
 */

type ProofiTab = 'overview' | 'scopes' | 'tokens' | 'audit';

const DEFAULT_SCOPES: HealthScope[] = [
  { id: 'steps', name: 'Steps', description: 'Daily step count', icon: '👟', path: 'health/steps/*', enabled: false },
  { id: 'heartRate', name: 'Heart Rate', description: 'Heart rate data', icon: '❤️', path: 'health/heartRate/*', enabled: false },
  { id: 'hrv', name: 'HRV', description: 'Heart rate variability', icon: '📈', path: 'health/hrv/*', enabled: false },
  { id: 'sleep', name: 'Sleep', description: 'Sleep analysis', icon: '😴', path: 'health/sleep/*', enabled: false },
  { id: 'spo2', name: 'Blood Oxygen', description: 'SpO2 levels', icon: '🫁', path: 'health/spo2/*', enabled: false },
  { id: 'workouts', name: 'Workouts', description: 'Exercise data', icon: '🏋️', path: 'health/workouts/*', enabled: false },
];

export function ProofiScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<ProofiTab>('overview');
  const [scopes, setScopes] = useState<HealthScope[]>(DEFAULT_SCOPES);
  const { address, isConnected } = useWalletStore();

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      // Could refresh tokens/audit entries here
    }, [])
  );

  const switchTab = (tab: ProofiTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const enabledScopesCount = scopes.filter((s) => s.enabled).length;

  // Render sub-screens directly when selected
  if (activeTab === 'scopes') {
    return (
      <View style={styles.container}>
        <View style={[styles.tabHeader, { paddingTop: insets.top + Spacing.md }]}>
          <TouchableOpacity onPress={() => setActiveTab('overview')}>
            <Text style={styles.backBtn}>← OVERVIEW</Text>
          </TouchableOpacity>
        </View>
        <HealthScopesScreen
          initialScopes={scopes}
          onScopesChange={setScopes}
        />
      </View>
    );
  }

  if (activeTab === 'tokens') {
    return (
      <View style={styles.container}>
        <View style={[styles.tabHeader, { paddingTop: insets.top + Spacing.md }]}>
          <TouchableOpacity onPress={() => setActiveTab('overview')}>
            <Text style={styles.backBtn}>← OVERVIEW</Text>
          </TouchableOpacity>
        </View>
        <CapabilityTokensScreen enabledScopes={scopes} />
      </View>
    );
  }

  if (activeTab === 'audit') {
    return (
      <View style={styles.container}>
        <View style={[styles.tabHeader, { paddingTop: insets.top + Spacing.md }]}>
          <TouchableOpacity onPress={() => setActiveTab('overview')}>
            <Text style={styles.backBtn}>← OVERVIEW</Text>
          </TouchableOpacity>
        </View>
        <AuditChainScreen />
      </View>
    );
  }

  // Overview tab
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top + Spacing.xl },
      ]}
    >
      {/* Hero Header */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <View style={styles.headerBadgeDot} />
          <Text style={styles.headerBadgeText}>LOCAL-FIRST AI</Text>
        </View>
        <Text style={styles.headerTitle}>Your Data.{'\n'}Your Control.</Text>
        <Text style={styles.headerSubtitle}>
          Cryptographic proof for every access. AI that works with your data,
          not around it.
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <TouchableOpacity
          style={[styles.statCard, styles.statCardScopes]}
          onPress={() => switchTab('scopes')}
        >
          <Text style={styles.statValue}>{enabledScopesCount}</Text>
          <Text style={styles.statLabel}>SCOPES</Text>
          <Text style={styles.statHint}>enabled →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, styles.statCardTokens]}
          onPress={() => switchTab('tokens')}
        >
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>TOKENS</Text>
          <Text style={styles.statHint}>active →</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionCards}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => switchTab('scopes')}
        >
          <View style={styles.actionCardHeader}>
            <Text style={styles.actionCardIcon}>📊</Text>
            <StatusBadge
              label={`${enabledScopesCount}/${scopes.length}`}
              color={Colors.cyan}
              dotColor={Colors.cyan}
            />
          </View>
          <Text style={styles.actionCardTitle}>Data Scopes</Text>
          <Text style={styles.actionCardDesc}>
            Choose which health data categories AI agents can access
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => switchTab('tokens')}
        >
          <View style={styles.actionCardHeader}>
            <Text style={styles.actionCardIcon}>🎫</Text>
            <StatusBadge
              label="MANAGE"
              color={Colors.green}
              dotColor={Colors.green}
            />
          </View>
          <Text style={styles.actionCardTitle}>Capability Tokens</Text>
          <Text style={styles.actionCardDesc}>
            Grant and revoke access for AI agents with auto-expiring tokens
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => switchTab('audit')}
        >
          <View style={styles.actionCardHeader}>
            <Text style={styles.actionCardIcon}>📜</Text>
            <StatusBadge
              label="VERIFIED"
              color={Colors.purple}
              dotColor={Colors.purple}
            />
          </View>
          <Text style={styles.actionCardTitle}>Audit Chain</Text>
          <Text style={styles.actionCardDesc}>
            Every access cryptographically logged and verifiable
          </Text>
        </TouchableOpacity>
      </View>

      {/* Privacy Comparison */}
      <View style={styles.compareSection}>
        <Text style={styles.compareTitle}>Not "trust us" — verify.</Text>
        
        <View style={styles.compareGrid}>
          <View style={[styles.compareCard, styles.compareCardThem]}>
            <Text style={styles.compareCardTitle}>🍎 Others</Text>
            <Text style={styles.compareItem}>✕ Data on remote servers</Text>
            <Text style={styles.compareItem}>✕ No audit trail</Text>
            <Text style={styles.compareItem}>✕ Permanent access</Text>
          </View>

          <View style={[styles.compareCard, styles.compareCardUs]}>
            <Text style={styles.compareCardTitle}>🔒 Proofi</Text>
            <Text style={styles.compareItemGood}>✓ 100% local processing</Text>
            <Text style={styles.compareItemGood}>✓ Cryptographic audit</Text>
            <Text style={styles.compareItemGood}>✓ Auto-expiring tokens</Text>
          </View>
        </View>
      </View>

      {/* Footer Info */}
      {address && (
        <Card label="CONNECTED WALLET" style={styles.walletCard}>
          <Text style={styles.walletAddress} numberOfLines={1}>
            {address}
          </Text>
          <Text style={styles.walletNetwork}>CERE MAINNET</Text>
        </Card>
      )}
    </ScrollView>
  );
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
  tabHeader: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card,
  },
  backBtn: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  header: {
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignSelf: 'flex-start',
    marginBottom: Spacing.lg,
  },
  headerBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.green,
  },
  headerBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSize.xxxl,
    color: Colors.white,
    lineHeight: FontSize.xxxl * 1.1,
    marginBottom: Spacing.md,
  },
  headerSubtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    borderWidth: 2,
  },
  statCardScopes: {
    borderColor: Colors.cyanAlpha(0.3),
    backgroundColor: Colors.cyanAlpha(0.05),
  },
  statCardTokens: {
    borderColor: Colors.greenAlpha(0.3),
    backgroundColor: Colors.greenAlpha(0.05),
  },
  statValue: {
    fontFamily: Fonts.display,
    fontSize: FontSize.xxl,
    color: Colors.white,
  },
  statLabel: {
    fontFamily: Fonts.label,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginTop: 2,
  },
  statHint: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.cyan,
    marginTop: Spacing.sm,
  },
  actionCards: {
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  actionCard: {
    borderWidth: 2,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
  },
  actionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  actionCardIcon: {
    fontSize: 24,
  },
  actionCardTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSize.lg,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  actionCardDesc: {
    fontFamily: Fonts.body,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  compareSection: {
    marginBottom: Spacing.xxl,
  },
  compareTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSize.lg,
    color: Colors.white,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  compareGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  compareCard: {
    flex: 1,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  compareCardThem: {
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surface,
    opacity: 0.6,
  },
  compareCardUs: {
    borderColor: Colors.green,
    backgroundColor: Colors.greenAlpha(0.05),
  },
  compareCardTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSize.sm,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  compareItem: {
    fontFamily: Fonts.body,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  compareItemGood: {
    fontFamily: Fonts.body,
    fontSize: FontSize.xs,
    color: Colors.green,
    marginBottom: 4,
  },
  walletCard: {
    marginTop: Spacing.lg,
  },
  walletAddress: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.cyan,
    marginBottom: Spacing.sm,
  },
  walletNetwork: {
    fontFamily: Fonts.label,
    fontSize: 10,
    color: Colors.textTertiary,
    letterSpacing: 1,
  },
});
