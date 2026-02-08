import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

interface PinDotsProps {
  length: number;
  filled: number;
  maxLength?: number;
}

export function PinDots({ length, filled, maxLength = 8 }: PinDotsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: maxLength }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < filled && styles.dotFilled,
            i >= length && styles.dotOptional,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    backgroundColor: Colors.borderLight,
  },
  dotFilled: {
    backgroundColor: Colors.cyan,
    shadowColor: Colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  dotOptional: {
    backgroundColor: Colors.card,
  },
});
