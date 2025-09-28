import { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { palette } from '@/constants/colors';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
}

export const Card = ({ children, style }: CardProps) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    borderColor: palette.border,
    borderWidth: 1
  }
});
