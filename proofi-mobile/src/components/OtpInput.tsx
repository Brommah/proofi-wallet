import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { Colors, Fonts } from '../constants/theme';

interface OtpInputProps {
  length?: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
}

export function OtpInput({ length = 6, onComplete, disabled = false }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const refs = useRef<(TextInput | null)[]>([]);

  const focusAt = (i: number) => refs.current[i]?.focus();

  const update = (idx: number, digit: string) => {
    const next = [...values];
    next[idx] = digit;
    setValues(next);

    if (digit && idx < length - 1) {
      focusAt(idx + 1);
    }

    const code = next.join('');
    if (code.length === length && next.every(Boolean)) {
      onComplete(code);
    }
  };

  const handleKeyPress = (
    idx: number,
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (values[idx]) {
        update(idx, '');
      } else if (idx > 0) {
        update(idx - 1, '');
        focusAt(idx - 1);
      }
    }
  };

  return (
    <View style={styles.container}>
      {values.map((v, i) => (
        <TextInput
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          style={[
            styles.input,
            v ? styles.inputFilled : null,
            disabled ? styles.inputDisabled : null,
          ]}
          value={v}
          editable={!disabled}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          onChangeText={(text) => {
            const digit = text.replace(/\D/g, '').slice(-1);
            update(i, digit);
          }}
          onKeyPress={(e) => handleKeyPress(i, e)}
          autoFocus={i === 0}
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
  input: {
    width: 44,
    height: 56,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surface,
    textAlign: 'center',
    fontSize: 20,
    color: Colors.white,
    fontFamily: Fonts.mono,
  },
  inputFilled: {
    borderColor: Colors.cyan,
    shadowColor: Colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  inputDisabled: {
    opacity: 0.4,
  },
});
