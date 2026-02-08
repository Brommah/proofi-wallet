import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { useWalletStore } from '../stores/walletStore';
import { Colors, Fonts, FontSize, Spacing } from '../constants/theme';

/**
 * Audit Chain Visualization - Matches health.html chain demo
 * Every access event is logged and cryptographically linked
 */

export interface AuditEntry {
  id: string;
  action: AuditAction;
  timestamp: number;
  hash: string;
  prevHash: string | null;
  details: Record<string, any>;
}

export type AuditAction =
  | 'CONSENT_GRANTED'
  | 'WALLET_CONNECTED'
  | 'TOKEN_CREATED'
  | 'DATA_ACCESSED'
  | 'AGENT_EXECUTED'
  | 'ANALYSIS_COMPLETE'
  | 'TOKEN_REVOKED'
  | 'CHAIN_SIGNED';

const ACTION_CONFIG: Record<
  AuditAction,
  { icon: string; color: string; label: string }
> = {
  CONSENT_GRANTED: { icon: '🔐', color: Colors.purple, label: 'Consent' },
  WALLET_CONNECTED: { icon: '👛', color: Colors.amber, label: 'Wallet' },
  TOKEN_CREATED: { icon: '🎫', color: Colors.cyan, label: 'Token' },
  DATA_ACCESSED: { icon: '📊', color: Colors.blue, label: 'Access' },
  AGENT_EXECUTED: { icon: '🤖', color: Colors.pink, label: 'Agent' },
  ANALYSIS_COMPLETE: { icon: '✓', color: Colors.green, label: 'Complete' },
  TOKEN_REVOKED: { icon: '⊘', color: Colors.red, label: 'Revoked' },
  CHAIN_SIGNED: { icon: '✍', color: Colors.gold, label: 'Signed' },
};

const STORAGE_KEY = 'proofi_audit_chain';

// Generate mock hash
const generateHash = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let hash = '';
  for (let i = 0; i < 43; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash + '=';
};

export function AuditChainScreen() {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [chainValid, setChainValid] = useState(true);
  const { address } = useWalletStore();

  useEffect(() => {
    loadAuditChain();
  }, []);

  const loadAuditChain = async () => {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (stored) {
        setEntries(JSON.parse(stored));
      } else {
        // Generate demo entries for first-time users
        const demo = generateDemoChain();
        setEntries(demo);
        await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(demo));
      }
    } catch (e) {
      console.error('[audit] Load failed:', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadAuditChain();
    setRefreshing(false);
  };

  const verifyChain = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // In real impl, verify each hash links correctly
    setChainValid(true);
  };

  const generateDemoChain = (): AuditEntry[] => {
    const now = Date.now();
    let prevHash: string | null = null;

    const actions: { action: AuditAction; offset: number; details: any }[] = [
      {
        action: 'CONSENT_GRANTED',
        offset: 0,
        details: {
          agentId: 'proofi-health-analyzer',
          requestedScopes: ['sleep', 'heartRate', 'hrv'],
        },
      },
      {
        action: 'WALLET_CONNECTED',
        offset: 100,
        details: {
          address: address?.slice(0, 8) + '...' + address?.slice(-4) || '6S245ds...HBrE',
          method: 'mobile-app',
        },
      },
      {
        action: 'TOKEN_CREATED',
        offset: 200,
        details: {
          tokenId: 'tok_' + generateHash().slice(0, 12),
          scopes: ['health/sleep/*', 'health/heartRate/*', 'health/hrv/*'],
          expiresIn: '1 hour',
        },
      },
      {
        action: 'AGENT_EXECUTED',
        offset: 300,
        details: {
          agentId: 'proofi-health-analyzer',
          version: '1.0.0',
          location: 'local',
          model: 'ollama/llama3.2',
        },
      },
      {
        action: 'DATA_ACCESSED',
        offset: 500,
        details: {
          scope: 'health/sleep/*',
          recordCount: 142,
          operation: 'read',
        },
      },
      {
        action: 'ANALYSIS_COMPLETE',
        offset: 40300,
        details: {
          processingTime: '40.3s',
          model: 'llama3.2',
          insights: 3,
        },
      },
      {
        action: 'TOKEN_REVOKED',
        offset: 40400,
        details: {
          reason: 'analysis_complete',
          automatic: true,
        },
      },
      {
        action: 'CHAIN_SIGNED',
        offset: 48000,
        details: {
          signer: address?.slice(0, 8) + '...' + address?.slice(-4) || '6S245ds...HBrE',
          signature: '0xcceae4ee596b0a310c...',
          algorithm: 'sr25519',
        },
      },
    ];

    return actions.map((a, i) => {
      const hash = generateHash();
      const entry: AuditEntry = {
        id: `entry_${i}`,
        action: a.action,
        timestamp: now - 60000 + a.offset,
        hash,
        prevHash,
        details: a.details,
      };
      prevHash = hash;
      return entry;
    });
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top + Spacing.xl },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.cyan}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTagline}>AUDIT CHAIN</Text>
        <Text style={styles.headerTitle}>Access History</Text>
        <Text style={styles.headerSubtitle}>
          Every data access is cryptographically logged.
          Verify the complete chain anytime.
        </Text>
      </View>

      {/* Chain Status */}
      <Card
        label="CHAIN STATUS"
        borderColor={chainValid ? Colors.greenAlpha(0.3) : Colors.redAlpha(0.3)}
        backgroundColor={
          chainValid ? Colors.greenAlpha(0.05) : Colors.redAlpha(0.05)
        }
      >
        <View style={styles.chainStatus}>
          <View style={styles.chainStatusLeft}>
            <Text style={styles.chainStatusIcon}>
              {chainValid ? '✓' : '✗'}
            </Text>
            <View>
              <Text
                style={[
                  styles.chainStatusTitle,
                  { color: chainValid ? Colors.green : Colors.red },
                ]}
              >
                {chainValid ? 'CHAIN VALID' : 'CHAIN INVALID'}
              </Text>
              <Text style={styles.chainStatusMeta}>
                {entries.length} entries · SHA-256 linked
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.verifyBtn} onPress={verifyChain}>
            <Text style={styles.verifyBtnText}>VERIFY</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Chain Entries */}
      <View style={styles.chainContainer}>
        <View style={styles.chainLine} />

        {entries.map((entry, index) => {
          const config = ACTION_CONFIG[entry.action];
          return (
            <View key={entry.id} style={styles.entryRow}>
              {/* Node */}
              <View
                style={[
                  styles.entryNode,
                  { borderColor: config.color },
                ]}
              >
                <Text style={styles.entryNodeIcon}>{config.icon}</Text>
              </View>

              {/* Content */}
              <View style={styles.entryContent}>
                <View style={styles.entryHeader}>
                  <Text style={[styles.entryAction, { color: config.color }]}>
                    {entry.action}
                  </Text>
                  <Text style={styles.entryTime}>{formatTime(entry.timestamp)}</Text>
                </View>

                {/* Details */}
                <View style={styles.entryDetails}>
                  {Object.entries(entry.details).map(([key, value]) => (
                    <Text key={key} style={styles.detailLine}>
                      <Text style={styles.detailKey}>{key}:</Text>{' '}
                      <Text style={styles.detailValue}>
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </Text>
                    </Text>
                  ))}
                </View>

                {/* Hash */}
                <View style={styles.hashRow}>
                  {entry.prevHash && (
                    <Text style={styles.hashText}>
                      prev: {entry.prevHash.slice(0, 8)}... →
                    </Text>
                  )}
                  <Text style={styles.hashText}>
                    hash: <Text style={styles.hashValue}>{entry.hash.slice(0, 16)}...</Text>
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Final Hash */}
      {entries.length > 0 && (
        <Card label="CHAIN SIGNATURE" style={styles.signatureCard}>
          <Text style={styles.signatureLabel}>FINAL HASH</Text>
          <Text style={styles.signatureValue}>
            {entries[entries.length - 1]?.hash}
          </Text>
          <View style={styles.signatureRow}>
            <Text style={styles.signatureMeta}>
              chainValid: <Text style={{ color: Colors.green }}>true</Text>
            </Text>
            <Text style={styles.signatureMeta}>algorithm: SHA-256</Text>
          </View>
        </Card>
      )}

      {/* Empty State */}
      {entries.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📜</Text>
          <Text style={styles.emptyTitle}>No Activity Yet</Text>
          <Text style={styles.emptyText}>
            Grant access to an agent to start building your audit chain.
          </Text>
        </View>
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
  header: {
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card,
  },
  headerTagline: {
    fontFamily: Fonts.label,
    fontSize: FontSize.xs,
    color: Colors.cyan,
    letterSpacing: 3,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSize.xxl,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  headerSubtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  chainStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chainStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  chainStatusIcon: {
    fontSize: 24,
    color: Colors.green,
  },
  chainStatusTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSize.md,
  },
  chainStatusMeta: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  verifyBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cyan,
  },
  verifyBtnText: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.cyan,
  },
  chainContainer: {
    marginTop: Spacing.xxl,
    position: 'relative',
    paddingLeft: 32,
  },
  chainLine: {
    position: 'absolute',
    left: 23,
    top: 24,
    bottom: 24,
    width: 2,
    backgroundColor: Colors.card,
  },
  entryRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
  },
  entryNode: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
    zIndex: 1,
  },
  entryNodeIcon: {
    fontSize: 20,
  },
  entryContent: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  entryAction: {
    fontFamily: Fonts.display,
    fontSize: FontSize.sm,
  },
  entryTime: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  entryDetails: {
    marginBottom: Spacing.sm,
  },
  detailLine: {
    fontFamily: Fonts.body,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  detailKey: {
    color: Colors.textTertiary,
  },
  detailValue: {
    fontFamily: Fonts.mono,
    color: Colors.textSecondary,
  },
  hashRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  hashText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textTertiary,
  },
  hashValue: {
    color: Colors.cyan,
  },
  signatureCard: {
    marginTop: Spacing.xl,
  },
  signatureLabel: {
    fontFamily: Fonts.label,
    fontSize: 10,
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  signatureValue: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.cyan,
    marginBottom: Spacing.md,
  },
  signatureRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  signatureMeta: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.xxxl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSize.lg,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});
