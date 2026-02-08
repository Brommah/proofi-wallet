import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useWalletStore } from '../stores/walletStore';
import { Button } from '../components/Button';
import { ErrorBox, SuccessBox } from '../components/ErrorBox';
import { StatusBadge } from '../components/StatusBadge';
import {
  getDdcStatus,
  listDdcItems,
  storeMemo,
  storeCredential,
  type StoredItem,
  type DdcStatus,
} from '../lib/api';
import { Colors, Fonts, FontSize, Spacing } from '../constants/theme';

type Tab = 'memo' | 'credential';

const CREDENTIAL_TYPES = [
  'ProofOfIdentity',
  'ProofOfOwnership',
  'ProofOfMembership',
  'ProofOfCompletion',
  'Custom',
];

export function DataVaultScreen() {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<DdcStatus | null>(null);
  const [memo, setMemo] = useState('');
  const [credType, setCredType] = useState('ProofOfIdentity');
  const [credData, setCredData] = useState('');
  const [storedItems, setStoredItems] = useState<StoredItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('memo');

  const address = useWalletStore((s) => s.address);

  // Load DDC status
  useEffect(() => {
    getDdcStatus().then(setStatus);
  }, []);

  // Load items
  const loadItems = useCallback(async () => {
    if (!address) return;
    const items = await listDdcItems(address);
    setStoredItems(items);
  }, [address]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Auto-refresh when tab gets focus (e.g. after playing game)
  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const handleStoreMemo = async () => {
    if (!memo.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const item = await storeMemo(memo);
      setStoredItems((prev) => [item, ...prev]);
      setSuccess('Stored on DDC');
      setMemo('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setError(e.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoreCredential = async () => {
    if (!credType || !credData.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      let claimData: any;
      try {
        claimData = JSON.parse(credData);
      } catch {
        claimData = { value: credData };
      }
      const item = await storeCredential(credType, claimData);
      setStoredItems((prev) => [item, ...prev]);
      setSuccess('Credential issued');
      setCredData('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setError(e.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + Spacing.xl }]}
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
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>DATA VAULT</Text>
          {status && (
            <StatusBadge label="LIVE" color={Colors.green} dotColor={Colors.green} />
          )}
        </View>

        {status && (
          <View style={styles.headerMeta}>
            <View>
              <Text style={styles.metaLabel}>NETWORK</Text>
              <Text style={styles.metaValue}>CERE MAINNET</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>BUCKET</Text>
              <Text style={[styles.metaValue, { color: Colors.cyan }]}>
                #{status.bucket}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'memo' && styles.tabActive]}
          onPress={() => setTab('memo')}
        >
          <Text style={[styles.tabText, tab === 'memo' && styles.tabTextActive]}>
            MEMO
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'credential' && styles.tabActive]}
          onPress={() => setTab('credential')}
        >
          <Text
            style={[styles.tabText, tab === 'credential' && styles.tabTextActive]}
          >
            CREDENTIAL
          </Text>
        </TouchableOpacity>
      </View>

      {/* Memo Form */}
      {tab === 'memo' && (
        <View style={styles.form}>
          <Text style={styles.formLabel}>STORE DATA ON DDC</Text>
          <TextInput
            style={styles.textArea}
            value={memo}
            onChangeText={setMemo}
            placeholder="Enter your memo..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Button
            title={loading ? 'STORING...' : 'STORE ON DDC'}
            onPress={handleStoreMemo}
            loading={loading}
            disabled={!memo.trim()}
          />
        </View>
      )}

      {/* Credential Form */}
      {tab === 'credential' && (
        <View style={styles.form}>
          <Text style={styles.formLabel}>CREDENTIAL TYPE</Text>
          <View style={styles.credTypeContainer}>
            {CREDENTIAL_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.credTypeChip,
                  credType === type && styles.credTypeChipActive,
                ]}
                onPress={() => setCredType(type)}
              >
                <Text
                  style={[
                    styles.credTypeText,
                    credType === type && styles.credTypeTextActive,
                  ]}
                >
                  {type.replace(/([A-Z])/g, ' $1').trim()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.formLabel}>CLAIM DATA</Text>
          <TextInput
            style={[styles.textArea, { fontFamily: Fonts.mono }]}
            value={credData}
            onChangeText={setCredData}
            placeholder='{"name": "...", "role": "..."}'
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Button
            title={loading ? 'ISSUING...' : 'ISSUE CREDENTIAL'}
            onPress={handleStoreCredential}
            loading={loading}
            disabled={!credData.trim()}
          />
        </View>
      )}

      {/* Status Messages */}
      {success && <SuccessBox message={success} />}
      {error && <ErrorBox message={error} />}

      {/* Stored Items */}
      {storedItems.length > 0 && (
        <View style={styles.storedSection}>
          <View style={styles.storedHeader}>
            <Text style={styles.storedTitle}>STORED</Text>
            <Text style={styles.storedCount}>{storedItems.length} ITEMS</Text>
          </View>

          {storedItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.storedItem,
                item.credentialType === 'GameAchievement' && styles.storedItemGame,
              ]}
              onPress={() => Linking.openURL(item.cdnUrl)}
            >
              <View style={styles.storedItemHeader}>
                <View
                  style={[
                    styles.typeBadge,
                    item.type === 'credential' && styles.typeBadgeCredential,
                    item.credentialType === 'GameAchievement' && styles.typeBadgeGame,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeBadgeText,
                      item.type === 'credential' && { color: Colors.cyan },
                      item.credentialType === 'GameAchievement' && {
                        color: Colors.yellow,
                      },
                    ]}
                  >
                    {item.credentialType === 'GameAchievement'
                      ? '🎮 ACHIEVEMENT'
                      : item.type === 'memo'
                      ? 'MEMO'
                      : item.credentialType?.toUpperCase() || 'CREDENTIAL'}
                  </Text>
                </View>
                {item.createdAt && (
                  <Text style={styles.timestamp}>
                    {new Date(item.createdAt).toLocaleTimeString()}
                  </Text>
                )}
              </View>
              <Text style={styles.cidText} numberOfLines={1}>
                {item.cid}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Empty State */}
      {storedItems.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>∅</Text>
          <Text style={styles.emptyText}>No data stored yet</Text>
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
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSize.xxl,
    color: Colors.white,
  },
  headerMeta: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  metaLabel: {
    fontFamily: Fonts.label,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  metaValue: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  tabActive: {
    borderColor: Colors.cyan,
    backgroundColor: Colors.cyanAlpha(0.05),
  },
  tabText: {
    fontFamily: Fonts.display,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    letterSpacing: 2,
  },
  tabTextActive: {
    color: Colors.cyan,
  },
  form: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  formLabel: {
    fontFamily: Fonts.label,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    letterSpacing: 2,
  },
  textArea: {
    minHeight: 100,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surface,
    color: Colors.white,
    fontFamily: Fonts.body,
    fontSize: FontSize.md,
    padding: Spacing.lg,
  },
  credTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  credTypeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  credTypeChipActive: {
    borderColor: Colors.cyan,
    backgroundColor: Colors.cyanAlpha(0.1),
  },
  credTypeText: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  credTypeTextActive: {
    color: Colors.cyan,
  },
  storedSection: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xxl,
  },
  storedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  storedTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSize.lg,
    color: Colors.white,
  },
  storedCount: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.cyan,
  },
  storedItem: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  storedItemGame: {
    borderColor: Colors.cyanAlpha(0.3),
    backgroundColor: Colors.cyanAlpha(0.05),
  },
  storedItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: Colors.borderLight,
  },
  typeBadgeCredential: {
    backgroundColor: Colors.cyanAlpha(0.1),
  },
  typeBadgeGame: {
    backgroundColor: Colors.cyanAlpha(0.1),
  },
  typeBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  timestamp: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  cidText: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.xxxl * 2,
  },
  emptyIcon: {
    fontFamily: Fonts.display,
    fontSize: FontSize.display,
    color: Colors.card,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
});
