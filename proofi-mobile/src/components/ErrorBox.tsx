import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, FontSize, Spacing } from '../constants/theme';

interface ErrorBoxProps {
  message: string;
}

export function ErrorBox({ message }: ErrorBoxProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

interface SuccessBoxProps {
  message: string;
}

export function SuccessBox({ message }: SuccessBoxProps) {
  return (
    <View style={styles.successContainer}>
      <Text style={styles.successText}>✓ {message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.magentaAlpha(0.1),
    borderWidth: 2,
    borderColor: Colors.magentaAlpha(0.3),
    padding: Spacing.lg,
  },
  text: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.sm,
    color: Colors.magenta,
  },
  successContainer: {
    backgroundColor: Colors.greenAlpha(0.1),
    borderWidth: 2,
    borderColor: Colors.greenAlpha(0.3),
    padding: Spacing.lg,
  },
  successText: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.sm,
    color: Colors.green,
  },
});
