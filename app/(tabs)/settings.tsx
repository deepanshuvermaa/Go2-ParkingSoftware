import { View, StyleSheet, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/common/SectionHeader';
import { useAuth } from '@/hooks/useAuth';
import { useSettingsStore } from '@/stores/settingsStore';
import { palette } from '@/constants/colors';

const SettingsScreen = () => {
  const router = useRouter();
  const { user, logout, hasRole } = useAuth();
  const autoSync = useSettingsStore((state) => state.autoSync);
  const setAutoSync = useSettingsStore((state) => state.setAutoSync);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <Screen>
      <Card style={{ gap: 12 }}>
        <Text variant="subtitle">Profile</Text>
        {user ? (
          <View>
            <Text variant="body">{user.name}</Text>
            <Text variant="small" style={{ color: palette.textSecondary }}>
              {user.email}
            </Text>
            <Text variant="small" style={{ color: palette.textSecondary, marginTop: 4 }}>
              Role: {user.role}
            </Text>
          </View>
        ) : (
          <Text variant="body">Not signed in</Text>
        )}
        <Button label="Sign out" variant="secondary" onPress={handleLogout} />
      </Card>

      <Card style={{ gap: 16 }}>
        <SectionHeader title="Devices" />
        <Button label="Printer settings" onPress={() => router.push('/printer-settings')} />
        <View style={styles.row}>
          <Text variant="body">Auto sync tickets</Text>
          <Switch value={autoSync} onValueChange={setAutoSync} />
        </View>
      </Card>

      {hasRole('OWNER', 'MANAGER') ? (
        <Card style={{ gap: 16 }}>
          <SectionHeader title="Operations" />
          <Button label="Pricing rules" onPress={() => router.push('/pricing-settings')} />
          <Button label="Invite teammates" variant="secondary" onPress={() => router.push('/register')} />
        </Card>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
});

export default SettingsScreen;
