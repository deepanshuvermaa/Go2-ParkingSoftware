import { useEffect, useMemo } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Buffer } from 'buffer';
import { AuthProvider } from '@/contexts/AuthContext';
import { useTicketSync } from '@/hooks/useTicketSync';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const globalWithBuffer = globalThis as typeof globalThis & { Buffer?: typeof Buffer };
if (!globalWithBuffer.Buffer) {
  globalWithBuffer.Buffer = Buffer;
}

const SyncGate = () => {
  useTicketSync();
  return null;
};

const RootLayout = () => {
  const queryClient = useMemo(() => new QueryClient(), []);

  useEffect(() => {
    if (!globalWithBuffer.Buffer) {
      globalWithBuffer.Buffer = Buffer;
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SyncGate />
            <StatusBar style="light" />
            <ErrorBoundary>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="login" />
                <Stack.Screen name="register" />
                <Stack.Screen name="create-ticket" />
                <Stack.Screen name="ticket-details" />
                <Stack.Screen name="printer-settings" />
                <Stack.Screen name="pricing-settings" />
              </Stack>
            </ErrorBoundary>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default RootLayout;
