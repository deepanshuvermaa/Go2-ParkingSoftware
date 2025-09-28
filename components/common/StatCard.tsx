import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { palette } from '@/constants/colors';
import { Card } from '@/components/ui/Card';

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
}

export const StatCard = ({ label, value, trend }: StatCardProps) => (
  <Card style={styles.card}>
    <Text variant="small" style={styles.label}>
      {label}
    </Text>
    <Text variant="title">{value}</Text>
    {trend ? (
      <View style={styles.trendWrapper}>
        <Text variant="small" style={styles.trend}>
          {trend}
        </Text>
      </View>
    ) : null}
  </Card>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140
  },
  label: {
    color: palette.textSecondary
  },
  trendWrapper: {
    marginTop: 8
  },
  trend: {
    color: palette.success
  }
});
