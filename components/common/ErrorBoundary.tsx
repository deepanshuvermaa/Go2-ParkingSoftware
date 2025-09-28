import { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { palette } from '@/constants/colors';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: undefined
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  reset = () => {
    this.setState({ hasError: false, message: undefined });
  };

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('Unhandled error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text variant="title">Something went wrong</Text>
            <Text variant="body" style={styles.message}>
              {this.state.message ?? 'An unexpected error occurred.'}
            </Text>
            <Button label="Try again" onPress={this.reset} />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  card: {
    width: '100%',
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 24,
    gap: 12
  },
  message: {
    color: palette.textSecondary
  }
});
