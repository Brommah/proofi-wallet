import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Colors, Fonts, FontSize, Spacing } from '../constants/theme';

/**
 * Health Data Scopes - Matches CLI and web extension
 * Users select which health data categories to share with agents
 */

export interface HealthScope {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  enabled: boolean;
}

const DEFAULT_SCOPES: HealthScope[] = [
  {
    id: 'steps',
    name: 'Steps',
    description: 'Daily step count and walking distance',
    icon: '👟',
    path: 'health/steps/*',
    enabled: false,
  },
  {
    id: 'heartRate',
    name: 'Heart Rate',
    description: 'Resting and active heart rate measurements',
    icon: '❤️',
    path: 'health/heartRate/*',
    enabled: false,
  },
  {
    id: 'hrv',
    name: 'HRV',
    description: 'Heart rate variability (stress & recovery)',
    icon: '📈',
    path: 'health/hrv/*',
    enabled: false,
  },
  {
    id: 'sleep',
    name: 'Sleep',
    description: 'Sleep duration, stages, and quality',
    icon: '😴',
    path: 'health/sleep/*',
    enabled: false,
  },
  {
    id: 'spo2',
    name: 'Blood Oxygen',
    description: 'SpO2 oxygen saturation levels',
    icon: '🫁',
    path: 'health/spo2/*',
    enabled: false,
  },
  {
    id: 'workouts',
    name: 'Workouts',
    description: 'Exercise sessions and calories burned',
    icon: '🏋️',
    path: 'health/workouts/*',
    enabled: false,
  },
  {
    id: 'nutrition',
    name: 'Nutrition',
    description: 'Food intake and macros (if tracked)',
    icon: '🥗',
    path: 'health/nutrition/*',
    enabled: false,
  },
  {
    id: 'weight',
    name: 'Body Metrics',
    description: 'Weight, BMI, and body composition',
    icon: '⚖️',
    path: 'health/weight/*',
    enabled: false,
  },
];

interface Props {
  onScopesChange?: (scopes: HealthScope[]) => void;
  initialScopes?: HealthScope[];
}

export function HealthScopesScreen({ onScopesChange, initialScopes }: Props) {
  const insets = useSafeAreaInsets();
  const [scopes, setScopes] = useState<HealthScope[]>(
    initialScopes || DEFAULT_SCOPES
  );
  const [selectAll, setSelectAll] = useState(false);

  const toggleScope = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = scopes.map((s) =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    setScopes(updated);
    onScopesChange?.(updated);
    
    // Update select all state
    setSelectAll(updated.every((s) => s.enabled));
  };

  const handleSelectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newValue = !selectAll;
    setSelectAll(newValue);
    const updated = scopes.map((s) => ({ ...s, enabled: newValue }));
    setScopes(updated);
    onScopesChange?.(updated);
  };

  const enabledCount = scopes.filter((s) => s.enabled).length;

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
        <Text style={styles.headerTagline}>DATA SCOPES</Text>
        <Text style={styles.headerTitle}>Your Health Data</Text>
        <Text style={styles.headerSubtitle}>
          Select which categories you want to share with AI agents.
          You control exactly what data is accessed.
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{enabledCount}</Text>
          <Text style={styles.statLabel}>SELECTED</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{scopes.length}</Text>
          <Text style={styles.statLabel}>AVAILABLE</Text>
        </View>
        <TouchableOpacity style={styles.selectAllBtn} onPress={handleSelectAll}>
          <Text style={styles.selectAllText}>
            {selectAll ? 'DESELECT ALL' : 'SELECT ALL'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scope List */}
      <View style={styles.scopeList}>
        {scopes.map((scope) => (
          <TouchableOpacity
            key={scope.id}
            style={[
              styles.scopeItem,
              scope.enabled && styles.scopeItemEnabled,
            ]}
            onPress={() => toggleScope(scope.id)}
            activeOpacity={0.7}
          >
            <View style={styles.scopeLeft}>
              <Text style={styles.scopeIcon}>{scope.icon}</Text>
              <View style={styles.scopeInfo}>
                <Text style={styles.scopeName}>{scope.name}</Text>
                <Text style={styles.scopeDesc}>{scope.description}</Text>
                <Text style={styles.scopePath}>{scope.path}</Text>
              </View>
            </View>
            <Switch
              value={scope.enabled}
              onValueChange={() => toggleScope(scope.id)}
              trackColor={{ false: Colors.card, true: Colors.cyanAlpha(0.3) }}
              thumbColor={scope.enabled ? Colors.cyan : Colors.textTertiary}
              ios_backgroundColor={Colors.card}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Privacy Note */}
      <Card
        label="PRIVACY GUARANTEE"
        borderColor={Colors.greenAlpha(0.3)}
        backgroundColor={Colors.greenAlpha(0.05)}
      >
        <View style={styles.privacyContent}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <Text style={styles.privacyText}>
            Data is processed locally on your device. Only the specific scopes
            you enable will be accessible, and all access is logged in your
            audit chain.
          </Text>
        </View>
      </Card>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Scopes follow the Proofi permission model. Each scope grants read
          access to that category only. Tokens expire automatically.
        </Text>
      </View>
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
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.xl,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: Fonts.display,
    fontSize: FontSize.xl,
    color: Colors.cyan,
  },
  statLabel: {
    fontFamily: Fonts.label,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginTop: 2,
  },
  selectAllBtn: {
    marginLeft: 'auto',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  selectAllText: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  scopeList: {
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  scopeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  scopeItemEnabled: {
    borderColor: Colors.cyanAlpha(0.5),
    backgroundColor: Colors.cyanAlpha(0.05),
  },
  scopeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  scopeIcon: {
    fontSize: 24,
    marginRight: Spacing.lg,
  },
  scopeInfo: {
    flex: 1,
  },
  scopeName: {
    fontFamily: Fonts.display,
    fontSize: FontSize.md,
    color: Colors.white,
    marginBottom: 2,
  },
  scopeDesc: {
    fontFamily: Fonts.body,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  scopePath: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textTertiary,
  },
  privacyContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  privacyIcon: {
    fontSize: 20,
  },
  privacyText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  footerText: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
