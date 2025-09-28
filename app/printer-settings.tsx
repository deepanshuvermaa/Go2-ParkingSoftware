import { View, StyleSheet, FlatList, ActivityIndicator, Alert, Pressable } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useBluetooth } from '@/hooks/useBluetooth';
import { palette } from '@/constants/colors';

const PrinterSettingsScreen = () => {
  const { devices, selectedDevice, state, scan, connect, disconnect, printTest } = useBluetooth();

  const handleScan = async () => {
    try {
      await scan();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to scan for printers.';
      Alert.alert('Scan failed', message);
    }
  };

  const handleConnect = async (deviceId: string) => {
    try {
      await connect(deviceId);
      Alert.alert('Printer connected');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to connect to printer.';
      Alert.alert('Connection failed', message);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to disconnect from printer.';
      Alert.alert('Disconnect failed', message);
    }
  };

  const handleTestPrint = async () => {
    try {
      await printTest('*** Go2 Parking ***\nTest receipt\nHave a great day!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to print test receipt.';
      Alert.alert('Print failed', message);
    }
  };

  return (
    <Screen>
      <View style={{ gap: 16 }}>
        <Card style={{ gap: 12 }}>
          <Text variant="subtitle">Bluetooth printer</Text>
          <Text variant="body" style={{ color: palette.textSecondary }}>
            Current status: {state}
          </Text>
          {state === 'SCANNING' || state === 'CONNECTING' ? (
            <ActivityIndicator color={palette.primary} />
          ) : null}
          <Button label="Scan for printers" onPress={handleScan} />
          {selectedDevice ? (
            <View style={styles.selected}>
              <Text variant="body">Connected to {selectedDevice.name}</Text>
              <View style={styles.row}>
                <Button variant="secondary" label="Disconnect" onPress={handleDisconnect} />
                <Button label="Test print" onPress={handleTestPrint} />
              </View>
            </View>
          ) : (
            <Text variant="body" style={{ color: palette.textSecondary }}>
              Select a printer below to connect.
            </Text>
          )}
        </Card>

        <Card style={{ gap: 12 }}>
          <Text variant="subtitle">Discovered printers</Text>
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.device, pressed && styles.devicePressed]}
                onPress={() => handleConnect(item.id)}
              >
                <View>
                  <Text variant="body">{item.name}</Text>
                  <Text variant="small" style={{ color: palette.textSecondary }}>
                    {item.id}
                  </Text>
                </View>
                <Text variant="small" style={{ color: palette.textSecondary }}>
                  RSSI: {item.rssi ?? 'n/a'}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text variant="body" style={{ color: palette.textSecondary }}>
                No devices scanned yet. Tap "Scan for printers" to begin.
              </Text>
            }
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            contentContainerStyle={{ gap: 8 }}
          />
        </Card>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  selected: {
    gap: 12
  },
  row: {
    flexDirection: 'row',
    gap: 12
  },
  device: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  devicePressed: {
    opacity: 0.8
  }
});

export default PrinterSettingsScreen;
