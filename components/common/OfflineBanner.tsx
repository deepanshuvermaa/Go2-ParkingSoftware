import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { palette } from '@/constants/colors';

export const OfflineBanner = () => (
  <View style={styles.container}>
    <Text variant="small" style={styles.text}>
      You are offline. Ticket updates will sync once connectivity is restored.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.warning,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  text: {
    color: '#1F2937',
    fontWeight: '600'
  }
});
