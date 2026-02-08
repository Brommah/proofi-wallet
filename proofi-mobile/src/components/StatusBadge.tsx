import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, FontSize } from '../constants/theme';

interface StatusBadgeProps {
  label: string;
  color?: string;
  dotColor?: string;
}

export function StatusBadge({
  label,
  color = Colors.textSecondary,
  dotColor,
}: StatusBadgeProps) {
  return (
    <View style={styles.container}>
      {dotColor && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    letterSpacing: 1,
  },
});
