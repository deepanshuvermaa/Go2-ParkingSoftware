import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';

const NotFound = () => {
  const router = useRouter();

  return (
    <Screen>
      <Card style={{ gap: 12 }}>
        <Text variant="title">Page not found</Text>
        <Text variant="body">
          Sorry, the screen you requested does not exist or may have been removed.
        </Text>
        <Button label="Go home" onPress={() => router.replace('/(tabs)/dashboard')} />
      </Card>
    </Screen>
  );
};

export default NotFound;
