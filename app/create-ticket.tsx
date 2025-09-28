import { useState } from 'react';
import { Alert, View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTicketStore } from '@/stores/ticketStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuth } from '@/hooks/useAuth';
import { ticketSchema, TicketFormValues } from '@/utils/validation';
import { isoNow } from '@/utils/date';
import { ZodError } from 'zod';
import { palette } from '@/constants/colors';

const CreateTicketScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const createTicket = useTicketStore((state) => state.createTicket);
  const pricingRules = useSettingsStore((state) => state.pricingRules);

  const defaultRuleId = pricingRules[0]?.id ?? '';
  const [form, setForm] = useState<TicketFormValues>({
    vehiclePlate: '',
    bayNumber: '',
    vehicleMake: '',
    vehicleColor: '',
    driverName: '',
    notes: '',
    pricingRuleId: defaultRuleId
  });
  const [errors, setErrors] = useState<Partial<Record<keyof TicketFormValues, string>>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof TicketFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = () => {
    if (!user) {
      Alert.alert('Unavailable', 'You must be authenticated to create tickets.');
      return;
    }
    try {
      setLoading(true);
      const parsed = ticketSchema.parse(form);
      const selectedRule = pricingRules.find((rule) => rule.id === parsed.pricingRuleId);
      const ticket = createTicket(
        {
          ...parsed,
          bayNumber: parsed.bayNumber || undefined,
          vehicleMake: parsed.vehicleMake || undefined,
          vehicleColor: parsed.vehicleColor || undefined,
          driverName: parsed.driverName || undefined,
          notes: parsed.notes || undefined,
          locationId: user.locationId,
          checkInAt: isoNow()
        },
        user.id,
        selectedRule?.baseRate ?? 0
      );
      Alert.alert('Ticket created', 'Ticket has been created successfully.', [
        {
          text: 'View ticket',
          onPress: () => router.push({ pathname: '/ticket-details', params: { id: ticket.id } })
        }
      ]);
      setForm({
        vehiclePlate: '',
        bayNumber: '',
        vehicleMake: '',
        vehicleColor: '',
        driverName: '',
        notes: '',
        pricingRuleId: pricingRules[0]?.id ?? ''
      });
      setErrors({});
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const fieldErrors: Partial<Record<keyof TicketFormValues, string>> = {};
        error.issues.forEach((issue) => {
          const field = issue.path[0] as keyof TicketFormValues;
          fieldErrors[field] = issue.message;
        });
        setErrors(fieldErrors);
      } else if (error instanceof Error) {
        Alert.alert('Ticket error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={{ gap: 16 }}>
        <Text variant="title">New ticket</Text>
        <Text variant="body">Capture vehicle and bay details to issue a parking ticket.</Text>
      </View>

      <View style={{ gap: 16 }}>
        <Input
          label="Vehicle plate"
          autoCapitalize="characters"
          value={form.vehiclePlate}
          onChangeText={(value) => handleChange('vehiclePlate', value.toUpperCase())}
          error={errors.vehiclePlate}
        />
        <Input
          label="Bay number"
          value={form.bayNumber}
          onChangeText={(value) => handleChange('bayNumber', value)}
        />
        <Input
          label="Vehicle make"
          value={form.vehicleMake ?? ''}
          onChangeText={(value) => handleChange('vehicleMake', value)}
        />
        <Input
          label="Vehicle color"
          value={form.vehicleColor ?? ''}
          onChangeText={(value) => handleChange('vehicleColor', value)}
        />
        <Input
          label="Driver name"
          value={form.driverName ?? ''}
          onChangeText={(value) => handleChange('driverName', value)}
        />
        <Input
          label="Notes"
          value={form.notes ?? ''}
          onChangeText={(value) => handleChange('notes', value)}
          multiline
          numberOfLines={3}
        />

        <View style={{ gap: 8 }}>
          <Text variant="small">Pricing rule</Text>
          {pricingRules.length ? (
            <View style={styles.ruleRow}>
              {pricingRules.map((rule) => (
                <Pressable
                  key={rule.id}
                  style={[styles.chip, form.pricingRuleId === rule.id && styles.chipActive]}
                  onPress={() => handleChange('pricingRuleId', rule.id)}
                >
                  <Text
                    variant="small"
                    style={form.pricingRuleId === rule.id ? styles.chipTextActive : styles.chipText}
                  >
                    {rule.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text variant="body" style={{ color: palette.danger }}>
              No pricing rules available. Head to Settings → Pricing to add.
            </Text>
          )}
          {errors.pricingRuleId ? (
            <Text variant="small" style={{ color: palette.danger }}>
              {errors.pricingRuleId}
            </Text>
          ) : null}
        </View>

        <Button label={loading ? 'Saving…' : 'Create Ticket'} onPress={handleSubmit} disabled={loading} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  ruleRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface
  },
  chipActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary
  },
  chipText: {
    color: palette.textSecondary
  },
  chipTextActive: {
    color: palette.textPrimary
  }
});

export default CreateTicketScreen;
