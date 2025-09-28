import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { palette, theme } from '@/constants/colors';

interface ButtonProps {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button = ({ label, onPress, variant = 'primary', disabled, style }: ButtonProps) => {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled ? styles.disabled : null,
        pressed ? styles.pressed : null,
        style
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: 'center'
  },
  primary: {
    backgroundColor: palette.primary
  },
  secondary: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border
  },
  ghost: {
    backgroundColor: 'transparent'
  },
  disabled: {
    opacity: 0.5
  },
  pressed: {
    opacity: 0.85
  },
  label: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '600'
  }
});
