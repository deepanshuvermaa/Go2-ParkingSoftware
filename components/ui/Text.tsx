import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { palette, theme } from '@/constants/colors';

type Variant = 'title' | 'subtitle' | 'body' | 'small';

interface TextProps extends RNTextProps {
  variant?: Variant;
  weight?: 'regular' | 'medium' | 'bold';
  color?: string;
}

export const Text = ({ variant = 'body', weight = 'regular', style, color, ...rest }: TextProps) => {
  return (
    <RNText
      style={[
        styles.base,
        styles[variant],
        weightStyles[weight],
        color ? { color } : undefined,
        style
      ]}
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    color: palette.textPrimary
  },
  title: {
    fontSize: theme.typography.title,
    fontWeight: '700'
  },
  subtitle: {
    fontSize: theme.typography.subtitle,
    fontWeight: '600'
  },
  body: {
    fontSize: theme.typography.body
  },
  small: {
    fontSize: theme.typography.small,
    color: palette.textSecondary
  }
});

const weightStyles = StyleSheet.create({
  regular: {
    fontWeight: '400'
  },
  medium: {
    fontWeight: '500'
  },
  bold: {
    fontWeight: '700'
  }
});
