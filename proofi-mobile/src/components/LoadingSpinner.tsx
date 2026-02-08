import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, FontSize } from '../constants/theme';

interface LoadingSpinnerProps {
  label?: string;
  color?: string;
}

export function LoadingSpinner({
  label,
  color = Colors.cyan,
}: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={color} />
      {label && <Text style={[styles.label, { color }]}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.sm,
    letterSpacing: 1,
  },
});
