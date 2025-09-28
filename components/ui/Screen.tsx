import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { palette } from '@/constants/colors';

interface ScreenProps {
  children: ReactNode;
  scrollable?: boolean;
  testID?: string;
}

export const Screen = ({ children, scrollable = true, testID }: ScreenProps) => {
  if (scrollable) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} testID={testID}>
        {children}
      </ScrollView>
    );
  }
  return (
    <View style={[styles.container, styles.content]} testID={testID}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
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
