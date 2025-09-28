import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ZodError } from 'zod';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { registerSchema, RegisterFormValues } from '@/utils/validation';

const RegisterScreen = () => {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState<RegisterFormValues>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormValues, string>>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof RegisterFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const parsed = registerSchema.parse(form);
      await register(parsed.name, parsed.email, parsed.password);
      router.replace('/(tabs)/dashboard');
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const fieldErrors: Partial<Record<keyof RegisterFormValues, string>> = {};
        error.issues.forEach((issue) => {
          const field = issue.path[0] as keyof RegisterFormValues;
          fieldErrors[field] = issue.message;
        });
        setErrors(fieldErrors);
      } else if (error instanceof Error) {
        Alert.alert('Registration failed', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scrollable={false}>
      <View style={{ marginTop: 40, gap: 24 }}>
        <View>
          <Text variant="title">Create your account</Text>
          <Text variant="body" style={{ marginTop: 8 }}>
            Invite teammates and manage parking lots securely across locations.
          </Text>
        </View>

        <View style={{ gap: 16 }}>
          <Input
            label="Full name"
            autoCapitalize="words"
            value={form.name}
            onChangeText={(value) => handleChange('name', value)}
            error={errors.name}
          />
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
          <Input
            label="Confirm password"
            secureTextEntry
            value={form.confirmPassword}
            onChangeText={(value) => handleChange('confirmPassword', value)}
            error={errors.confirmPassword}
          />
          <Button label={loading ? 'Creating account…' : 'Create Account'} onPress={handleSubmit} disabled={loading} />
        </View>

        <View>
          <Text variant="body">
            Already have access?{' '}
            <Link href="/login" style={{ color: '#22D3EE' }}>
              Sign in
            </Link>
          </Text>
        </View>
      </View>
    </Screen>
  );
};

export default RegisterScreen;
