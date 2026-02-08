import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Fonts, FontSize, Spacing } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  label?: string;
  borderColor?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export function Card({
  children,
  label,
  borderColor = Colors.borderLight,
  backgroundColor = 'transparent',
  style,
}: CardProps) {
  return (
    <View style={[styles.card, { borderColor, backgroundColor }, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: Spacing.lg,
  },
  label: {
    fontFamily: Fonts.label,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
});
