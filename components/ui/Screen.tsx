import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from '@/constants/colors';

interface ScreenProps {
  children: ReactNode;
  scrollable?: boolean;
  testID?: string;
}

export const Screen = ({ children, scrollable = true, testID }: ScreenProps) => {
  if (scrollable) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} testID={testID}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={[styles.container, styles.content]} testID={testID}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  container: {
    flex: 1,
    backgroundColor: palette.background,
    paddingHorizontal: 20
  },
  content: {
    paddingVertical: 24,
    gap: 16
  }
});
