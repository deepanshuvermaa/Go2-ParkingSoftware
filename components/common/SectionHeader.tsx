import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export const SectionHeader = ({ title, actionLabel, onActionPress }: SectionHeaderProps) => (
  <View style={styles.container}>
    <Text variant="subtitle" style={styles.title}>
      {title}
    </Text>
    {actionLabel && onActionPress ? (
      <Button variant="ghost" label={actionLabel} onPress={onActionPress} />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontWeight: '600'
  }
});
