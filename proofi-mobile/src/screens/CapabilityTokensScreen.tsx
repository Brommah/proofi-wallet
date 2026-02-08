import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Colors, Fonts, FontSize, Spacing } from '../constants/theme';
import { HealthScope } from './HealthScopesScreen';

/**
 * Capability Token Management - Matches CLI "proofi grant" command
 * View, create, and revoke tokens for AI agents
 */

export interface CapabilityToken {
  id: string;
  agentId: string;
  agentName: string;
  scopes: string[];
  issuedAt: number;
  expiresAt: number;
  status: 'active' | 'expired' | 'revoked';
  lastUsed?: number;
  usageCount: number;
}

const STORAGE_KEY = 'proofi_capability_tokens';

// Mock agents that might request access
const KNOWN_AGENTS = [
  {
    id: 'proofi-health-analyzer',
    name: 'Health Analyzer',
    description: 'AI-powered health insights from your data',
    icon: '🏥',
  },
  {
    id: 'proofi-cross-source-intel',
    name: 'Cross-Source Intel',
    description: 'Correlate data across multiple health sources',
    icon: '🔗',
  },
  {
    id: 'proofi-sleep-coach',
    name: 'Sleep Coach',
    description: 'Personalized sleep improvement recommendations',
    icon: '🌙',
  },
  {
    id: 'proofi-fitness-tracker',
    name: 'Fitness Tracker',
    description: 'Workout analysis and progress tracking',
    icon: '💪',
  },
];

interface Props {
  enabledScopes?: HealthScope[];
}

export function CapabilityTokensScreen({ enabledScopes = [] }: Props) {
  const insets = useSafeAreaInsets();
  const [tokens, setTokens] = useState<CapabilityToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [expiryHours, setExpiryHours] = useState(24);

  // Load tokens from storage
  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CapabilityToken[];
        // Update status based on expiry
        const updated = parsed.map((t) => ({
          ...t,
          status:
            t.status === 'revoked'
              ? 'revoked'
              : t.expiresAt < Date.now()
              ? 'expired'
              : 'active',
        })) as CapabilityToken[];
        setTokens(updated);
      }
    } catch (e) {
      console.error('[tokens] Load failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveTokens = async (newTokens: CapabilityToken[]) => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(newTokens));
      setTokens(newTokens);
    } catch (e) {
      console.error('[tokens] Save failed:', e);
    }
  };

  const grantToken = async (agentId: string) => {
    const agent = KNOWN_AGENTS.find((a) => a.id === agentId);
    if (!agent) return;

    const scopePaths = enabledScopes
      .filter((s) => s.enabled)
      .map((s) => s.path);

    if (scopePaths.length === 0) {
      Alert.alert(
        'No Scopes Selected',
        'Please enable at least one health data scope before granting access.'
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newToken: CapabilityToken = {
      id: `tok_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      agentId: agent.id,
      agentName: agent.name,
      scopes: scopePaths,
      issuedAt: Date.now(),
      expiresAt: Date.now() + expiryHours * 60 * 60 * 1000,
      status: 'active',
      usageCount: 0,
    };

    await saveTokens([newToken, ...tokens]);
    setShowGrantModal(false);
    setSelectedAgent(null);
  };

  const revokeToken = (tokenId: string) => {
    Alert.alert(
      'Revoke Token',
      'This will immediately revoke access for this agent. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            const updated = tokens.map((t) =>
              t.id === tokenId ? { ...t, status: 'revoked' as const } : t
            );
            await saveTokens(updated);
          },
        },
      ]
    );
  };

  const formatExpiry = (timestamp: number) => {
    const diff = timestamp - Date.now();
    if (diff < 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const activeTokens = tokens.filter((t) => t.status === 'active');
  const inactiveTokens = tokens.filter((t) => t.status !== 'active');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top + Spacing.xl },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTagline}>CAPABILITY TOKENS</Text>
        <Text style={styles.headerTitle}>Agent Access</Text>
        <Text style={styles.headerSubtitle}>
          Manage which AI agents can access your health data.
          All tokens auto-expire and access is logged.
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{activeTokens.length}</Text>
          <Text style={styles.statLabel}>ACTIVE</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: Colors.textTertiary }]}>
            {inactiveTokens.length}
          </Text>
          <Text style={styles.statLabel}>EXPIRED</Text>
        </View>
      </View>

      {/* Grant New Token */}
      {!showGrantModal ? (
        <Button
          title="GRANT NEW ACCESS"
          onPress={() => setShowGrantModal(true)}
          style={styles.grantButton}
        />
      ) : (
        <Card
          label="GRANT ACCESS TO AGENT"
          borderColor={Colors.cyanAlpha(0.5)}
          backgroundColor={Colors.cyanAlpha(0.05)}
        >
          <View style={styles.grantModal}>
            <Text style={styles.grantLabel}>SELECT AGENT</Text>
            <View style={styles.agentList}>
              {KNOWN_AGENTS.map((agent) => (
                <TouchableOpacity
                  key={agent.id}
                  style={[
                    styles.agentItem,
                    selectedAgent === agent.id && styles.agentItemSelected,
                  ]}
                  onPress={() => setSelectedAgent(agent.id)}
                >
                  <Text style={styles.agentIcon}>{agent.icon}</Text>
                  <View style={styles.agentInfo}>
                    <Text style={styles.agentName}>{agent.name}</Text>
                    <Text style={styles.agentDesc}>{agent.description}</Text>
                  </View>
                  {selectedAgent === agent.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.grantLabel}>TOKEN EXPIRY</Text>
            <View style={styles.expiryOptions}>
              {[1, 24, 168, 720].map((hours) => (
                <TouchableOpacity
                  key={hours}
                  style={[
                    styles.expiryOption,
                    expiryHours === hours && styles.expiryOptionSelected,
                  ]}
                  onPress={() => setExpiryHours(hours)}
                >
                  <Text
                    style={[
                      styles.expiryText,
                      expiryHours === hours && styles.expiryTextSelected,
                    ]}
                  >
                    {hours === 1
                      ? '1 HOUR'
                      : hours === 24
                      ? '24 HOURS'
                      : hours === 168
                      ? '7 DAYS'
                      : '30 DAYS'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.grantActions}>
              <Button
                title="GRANT ACCESS"
                onPress={() => selectedAgent && grantToken(selectedAgent)}
                disabled={!selectedAgent}
              />
              <Button
                title="CANCEL"
                variant="ghost"
                onPress={() => {
                  setShowGrantModal(false);
                  setSelectedAgent(null);
                }}
              />
            </View>
          </View>
        </Card>
      )}

      {/* Active Tokens */}
      {activeTokens.length > 0 && (
        <View style={styles.tokenSection}>
          <Text style={styles.sectionTitle}>ACTIVE TOKENS</Text>
          {activeTokens.map((token) => (
            <View key={token.id} style={styles.tokenCard}>
              <View style={styles.tokenHeader}>
                <View>
                  <Text style={styles.tokenAgent}>{token.agentName}</Text>
                  <Text style={styles.tokenId}>{token.id}</Text>
                </View>
                <StatusBadge
                  label={formatExpiry(token.expiresAt)}
                  color={Colors.green}
                  dotColor={Colors.green}
                />
              </View>

              <View style={styles.tokenScopes}>
                <Text style={styles.scopesLabel}>SCOPES</Text>
                <View style={styles.scopeChips}>
                  {token.scopes.slice(0, 3).map((scope, i) => (
                    <View key={i} style={styles.scopeChip}>
                      <Text style={styles.scopeChipText}>
                        {scope.split('/')[1]}
                      </Text>
                    </View>
                  ))}
                  {token.scopes.length > 3 && (
                    <Text style={styles.moreScopes}>
                      +{token.scopes.length - 3}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.tokenMeta}>
                <Text style={styles.tokenMetaText}>
                  Issued: {new Date(token.issuedAt).toLocaleDateString()}
                </Text>
                <Text style={styles.tokenMetaText}>
                  Used: {token.usageCount}x
                </Text>
              </View>

              <TouchableOpacity
                style={styles.revokeBtn}
                onPress={() => revokeToken(token.id)}
              >
                <Text style={styles.revokeBtnText}>REVOKE ACCESS</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Inactive Tokens */}
      {inactiveTokens.length > 0 && (
        <View style={styles.tokenSection}>
          <Text style={styles.sectionTitle}>EXPIRED / REVOKED</Text>
          {inactiveTokens.map((token) => (
            <View
              key={token.id}
              style={[styles.tokenCard, styles.tokenCardInactive]}
            >
              <View style={styles.tokenHeader}>
                <View>
                  <Text style={[styles.tokenAgent, { color: Colors.textTertiary }]}>
                    {token.agentName}
                  </Text>
                  <Text style={styles.tokenId}>{token.id}</Text>
                </View>
                <StatusBadge
                  label={token.status.toUpperCase()}
                  color={token.status === 'revoked' ? Colors.red : Colors.textTertiary}
                  dotColor={token.status === 'revoked' ? Colors.red : Colors.textTertiary}
                />
              </View>
              <Text style={styles.tokenMetaText}>
                {token.status === 'revoked' ? 'Manually revoked' : 'Auto-expired'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Empty State */}
      {tokens.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎫</Text>
          <Text style={styles.emptyTitle}>No Tokens Yet</Text>
          <Text style={styles.emptyText}>
            Grant access to an AI agent to get started. All access is temporary
            and cryptographically signed.
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
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xxl,
    paddingVertical: Spacing.xl,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: Fonts.display,
    fontSize: FontSize.xl,
    color: Colors.green,
  },
  statLabel: {
    fontFamily: Fonts.label,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginTop: 2,
  },
  grantButton: {
    marginBottom: Spacing.xxl,
  },
  grantModal: {
    gap: Spacing.lg,
  },
  grantLabel: {
    fontFamily: Fonts.label,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    letterSpacing: 2,
  },
  agentList: {
    gap: Spacing.sm,
  },
  agentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  agentItemSelected: {
    borderColor: Colors.cyan,
    backgroundColor: Colors.cyanAlpha(0.1),
  },
  agentIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontFamily: Fonts.display,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  agentDesc: {
    fontFamily: Fonts.body,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  checkmark: {
    fontSize: 18,
    color: Colors.cyan,
  },
  expiryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  expiryOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  expiryOptionSelected: {
    borderColor: Colors.cyan,
    backgroundColor: Colors.cyanAlpha(0.1),
  },
  expiryText: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  expiryTextSelected: {
    color: Colors.cyan,
  },
  grantActions: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  tokenSection: {
    marginTop: Spacing.xxl,
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSize.md,
    color: Colors.white,
    marginBottom: Spacing.lg,
  },
  tokenCard: {
    borderWidth: 2,
    borderColor: Colors.greenAlpha(0.3),
    backgroundColor: Colors.greenAlpha(0.05),
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  tokenCardInactive: {
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surface,
    opacity: 0.6,
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  tokenAgent: {
    fontFamily: Fonts.display,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  tokenId: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  tokenScopes: {
    marginBottom: Spacing.md,
  },
  scopesLabel: {
    fontFamily: Fonts.label,
    fontSize: 10,
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  scopeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  scopeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: Colors.cyanAlpha(0.1),
  },
  scopeChipText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.cyan,
  },
  moreScopes: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textTertiary,
  },
  tokenMeta: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginBottom: Spacing.md,
  },
  tokenMetaText: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  revokeBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.redAlpha(0.5),
  },
  revokeBtnText: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.red,
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
