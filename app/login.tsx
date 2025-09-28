import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ZodError } from 'zod';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, LoginFormValues } from '@/utils/validation';

const LoginScreen = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState<LoginFormValues>({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormValues, string>>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof LoginFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const parsed = loginSchema.parse(form);
      await login(parsed.email, parsed.password);
      router.replace('/(tabs)/dashboard');
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const fieldErrors: Partial<Record<keyof LoginFormValues, string>> = {};
        error.issues.forEach((issue) => {
          const field = issue.path[0] as keyof LoginFormValues;
          fieldErrors[field] = issue.message;
        });
        setErrors(fieldErrors);
      } else if (error instanceof Error) {
        Alert.alert('Login failed', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scrollable={false}>
      <View style={{ marginTop: 40, gap: 24 }}>
        <View>
          <Text variant="title">Welcome back</Text>
          <Text variant="body" style={{ marginTop: 8 }}>
            Sign in with your email and password to continue managing your parking operations.
          </Text>
        </View>

        <View style={{ gap: 16 }}>
          <Input
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(value) => handleChange('email', value)}
            error={errors.email}
          />
          <Input
            label="Password"
            secureTextEntry
            value={form.password}
            onChangeText={(value) => handleChange('password', value)}
            error={errors.password}
          />
          <Button label={loading ? 'Signing in…' : 'Sign In'} onPress={handleSubmit} disabled={loading} />
        </View>

        <View>
          <Text variant="body">
            Don't have an account?{' '}
            <Link href="/register" style={{ color: '#22D3EE' }}>
              Register here
            </Link>
          </Text>
        </View>
      </View>
    </Screen>
  );
};

export default LoginScreen;
