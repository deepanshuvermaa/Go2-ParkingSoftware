import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { palette } from '@/constants/colors';

interface EmptyStateProps {
  title: string;
  description?: string;
}

export const EmptyState = ({ title, description }: EmptyStateProps) => (
  <View style={styles.container}>
    <Text variant="subtitle" style={styles.title}>
      {title}
    </Text>
    {description ? (
      <Text variant="body" style={styles.description}>
        {description}
      </Text>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    alignItems: 'center'
  },
  title: {
    marginBottom: 4
  },
  description: {
    color: palette.textSecondary,
    textAlign: 'center'
  }
});
