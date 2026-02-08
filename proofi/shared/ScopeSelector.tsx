/**
 * Proofi Health Data Scope Selector
 * React/React Native component for mobile apps
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============ Types ============

export interface HealthScope {
  id: string;
  name: string;
  description: string;
  icon: string;
  sensitivity: 'low' | 'medium' | 'high';
  category: string;
  sampleData: Record<string, string | number>;
}

export interface ScopeSelectorProps {
  /** Initially selected scope IDs */
  initialSelection?: string[];
  /** Callback when selection changes */
  onSelectionChange?: (scopes: string[]) => void;
  /** Callback when user saves preferences */
  onSave?: (scopes: string[]) => void;
  /** Show sample data previews */
  showPreview?: boolean;
  /** Enable persistent storage */
  persistPreferences?: boolean;
  /** Custom storage key */
  storageKey?: string;
}

// ============ Data ============

export const HEALTH_SCOPES: HealthScope[] = [
  {
    id: 'sleep',
    name: 'Sleep',
    description: 'Sleep duration, quality, and stages',
    icon: '🌙',
    sensitivity: 'low',
    category: 'recovery',
    sampleData: { duration: '7h 23m', quality: 'Good', deepSleep: '1h 45m' },
  },
  {
    id: 'steps',
    name: 'Steps',
    description: 'Daily step count and distance walked',
    icon: '👟',
    sensitivity: 'low',
    category: 'activity',
    sampleData: { daily: 8432, distance: '6.2 km', floors: 12 },
  },
  {
    id: 'heart_rate',
    name: 'Heart Rate',
    description: 'Resting and active heart rate',
    icon: '❤️',
    sensitivity: 'medium',
    category: 'vitals',
    sampleData: { resting: '62 bpm', average: '74 bpm', max: '142 bpm' },
  },
  {
    id: 'hrv',
    name: 'Heart Rate Variability',
    description: 'HRV indicating recovery and stress',
    icon: '📈',
    sensitivity: 'medium',
    category: 'vitals',
    sampleData: { average: '45 ms', trend: 'Improving', lastNight: '52 ms' },
  },
  {
    id: 'workouts',
    name: 'Workouts',
    description: 'Exercise sessions and intensity',
    icon: '🏃',
    sensitivity: 'low',
    category: 'activity',
    sampleData: { thisWeek: 4, totalMinutes: 185, calories: 1240 },
  },
  {
    id: 'body_mass',
    name: 'Body Mass',
    description: 'Weight and body composition',
    icon: '⚖️',
    sensitivity: 'high',
    category: 'body',
    sampleData: { weight: '75.2 kg', bmi: 23.4, trend: 'Stable' },
  },
  {
    id: 'blood_oxygen',
    name: 'Blood Oxygen',
    description: 'SpO2 and oxygen saturation',
    icon: '🫁',
    sensitivity: 'medium',
    category: 'vitals',
    sampleData: { average: '98%', min: '95%', nightAvg: '97%' },
  },
  {
    id: 'respiratory_rate',
    name: 'Respiratory Rate',
    description: 'Breathing rate during rest',
    icon: '💨',
    sensitivity: 'medium',
    category: 'vitals',
    sampleData: { resting: '14 br/min', sleeping: '12 br/min' },
  },
  {
    id: 'nutrition',
    name: 'Nutrition',
    description: 'Calorie and macronutrient tracking',
    icon: '🍎',
    sensitivity: 'medium',
    category: 'lifestyle',
    sampleData: { calories: 2150, protein: '95g', carbs: '240g' },
  },
  {
    id: 'menstrual',
    name: 'Menstrual Cycle',
    description: 'Cycle tracking and predictions',
    icon: '🩸',
    sensitivity: 'high',
    category: 'reproductive',
    sampleData: { cycleDay: 14, phase: 'Ovulation', predicted: 'May 28' },
  },
  {
    id: 'mindfulness',
    name: 'Mindfulness',
    description: 'Meditation sessions',
    icon: '🧘',
    sensitivity: 'low',
    category: 'mental',
    sampleData: { thisWeek: '45 min', streak: '7 days', sessions: 12 },
  },
  {
    id: 'stress',
    name: 'Stress Levels',
    description: 'Stress and recovery metrics',
    icon: '😰',
    sensitivity: 'high',
    category: 'mental',
    sampleData: { current: 'Moderate', weeklyAvg: 42, recoveryTime: '2.5h' },
  },
];

const SENSITIVITY_COLORS = {
  low: { bg: '#dcfce7', text: '#16a34a', dot: '#22c55e' },
  medium: { bg: '#fef3c7', text: '#d97706', dot: '#f59e0b' },
  high: { bg: '#fee2e2', text: '#dc2626', dot: '#ef4444' },
};

const STORAGE_KEY = 'proofi_health_scopes';

// ============ Component ============

export const ScopeSelector: React.FC<ScopeSelectorProps> = ({
  initialSelection = [],
  onSelectionChange,
  onSave,
  showPreview = true,
  persistPreferences = true,
  storageKey = STORAGE_KEY,
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelection));
  const [filter, setFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [showSaved, setShowSaved] = useState(false);

  // Load saved preferences
  useEffect(() => {
    if (!persistPreferences) return;
    
    AsyncStorage.getItem(storageKey).then((data) => {
      if (data) {
        try {
          const { scopes } = JSON.parse(data);
          if (scopes?.length) {
            setSelected(new Set(scopes));
          }
        } catch {}
      }
    });
  }, [persistPreferences, storageKey]);

  // Notify parent of changes
  useEffect(() => {
    onSelectionChange?.(Array.from(selected));
  }, [selected, onSelectionChange]);

  const toggleScope = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(HEALTH_SCOPES.map((s) => s.id)));
  }, []);

  const selectNone = useCallback(() => {
    setSelected(new Set());
  }, []);

  const savePreferences = useCallback(async () => {
    const scopes = Array.from(selected);
    
    if (persistPreferences) {
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify({ scopes, updatedAt: new Date().toISOString() })
      );
    }
    
    onSave?.(scopes);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  }, [selected, persistPreferences, storageKey, onSave]);

  const filteredScopes = useMemo(() => {
    if (filter === 'all') return HEALTH_SCOPES;
    return HEALTH_SCOPES.filter((s) => s.sensitivity === filter);
  }, [filter]);

  const formatLabel = (str: string) =>
    str.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🔐 Select Health Data</Text>
        <Text style={styles.subtitle}>Choose which metrics to include in your proof</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.btn} onPress={selectAll}>
          <Text style={styles.btnText}>Select All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={selectNone}>
          <Text style={styles.btnText}>Select None</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {(['all', 'low', 'medium', 'high'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f === 'low' ? '🟢 Low' : f === 'medium' ? '🟡 Medium' : '🔴 High'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Scope List */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filteredScopes.map((scope) => (
          <TouchableOpacity
            key={scope.id}
            style={[styles.card, selected.has(scope.id) && styles.cardSelected]}
            onPress={() => toggleScope(scope.id)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.icon}>{scope.icon}</Text>
              <View style={styles.cardInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle}>{scope.name}</Text>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: SENSITIVITY_COLORS[scope.sensitivity].bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: SENSITIVITY_COLORS[scope.sensitivity].text },
                      ]}
                    >
                      {scope.sensitivity.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardDesc}>{scope.description}</Text>
              </View>
              <View style={[styles.checkbox, selected.has(scope.id) && styles.checkboxSelected]}>
                {selected.has(scope.id) && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </View>

            {showPreview && (
              <View style={styles.preview}>
                <Text style={styles.previewTitle}>📊 SAMPLE DATA</Text>
                <View style={styles.previewGrid}>
                  {Object.entries(scope.sampleData).map(([key, value]) => (
                    <View key={key} style={styles.previewItem}>
                      <Text style={styles.previewLabel}>{formatLabel(key)}</Text>
                      <Text style={styles.previewValue}>{String(value)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {selected.size} scope{selected.size !== 1 ? 's' : ''} selected
        </Text>
        <TouchableOpacity style={styles.saveBtn} onPress={savePreferences}>
          <Text style={styles.saveBtnText}>💾 Save Preferences</Text>
        </TouchableOpacity>
      </View>

      {/* Toast */}
      {showSaved && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>✓ Preferences saved!</Text>
        </View>
      )}
    </View>
  );
};

// ============ Styles ============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  filterRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  filterBtnActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterText: {
    fontSize: 13,
    color: '#64748b',
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 12,
  },
  cardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#fafaff',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748b',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  preview: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  previewTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  previewItem: {
    minWidth: 80,
  },
  previewLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  previewValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  summary: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  summaryText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ScopeSelector;

// ============ Hook for programmatic access ============

export function useScopeSelector(storageKey = STORAGE_KEY) {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then((data) => {
      if (data) {
        try {
          const { scopes } = JSON.parse(data);
          setSelected(scopes || []);
        } catch {}
      }
    });
  }, [storageKey]);

  const save = useCallback(async (scopes: string[]) => {
    await AsyncStorage.setItem(
      storageKey,
      JSON.stringify({ scopes, updatedAt: new Date().toISOString() })
    );
    setSelected(scopes);
  }, [storageKey]);

  return { selected, save };
}
