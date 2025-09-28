import { forwardRef } from 'react';
import { TextInput, TextInputProps, StyleSheet, View } from 'react-native';
import { palette, theme } from '@/constants/colors';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(({ label, error, style, ...rest }, ref) => {
  return (
    <View style={styles.wrapper}>
      <Text variant="small" style={styles.label}>
        {label}
      </Text>
      <TextInput
        ref={ref}
        placeholderTextColor={palette.muted}
        style={[styles.input, style, error ? styles.inputError : undefined]}
        {...rest}
      />
      {error ? (
        <Text variant="small" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    width: '100%'
  },
  label: {
    marginBottom: 4
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: palette.textPrimary,
    backgroundColor: palette.surface
  },
  inputError: {
    borderColor: palette.danger
  },
  errorText: {
    color: palette.danger,
    marginTop: 4
  }
});

Input.displayName = 'Input';
