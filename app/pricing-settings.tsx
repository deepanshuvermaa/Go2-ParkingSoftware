import { useState } from 'react';
import { Alert } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/currency';
import { palette } from '@/constants/colors';

interface PricingFormState {
  name: string;
  baseRate: string;
  hourlyRate: string;
  maxRate: string;
  gracePeriodMinutes: string;
}

const initialForm: PricingFormState = {
  name: '',
  baseRate: '5',
  hourlyRate: '3',
  maxRate: '25',
  gracePeriodMinutes: '10'
};

const PricingSettingsScreen = () => {
  const { hasRole } = useAuth();
  const allowed = hasRole('OWNER', 'MANAGER');
  const pricingRules = useSettingsStore((state) => state.pricingRules);
  const upsertRule = useSettingsStore((state) => state.upsertPricingRule);
  const removeRule = useSettingsStore((state) => state.removePricingRule);
  const ensureDefaults = useSettingsStore((state) => state.ensureDefaultRules);

  const [form, setForm] = useState<PricingFormState>(initialForm);

  if (!allowed) {
    return (
      <Screen>
        <Card>
          <Text variant="subtitle">Restricted</Text>
          <Text variant="body" style={{ color: palette.textSecondary, marginTop: 8 }}>
            Pricing configuration can only be managed by owners or site managers.
          </Text>
        </Card>
      </Screen>
    );
  }

  const handleChange = (field: keyof PricingFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = () => {
    if (!form.name.trim()) {
      Alert.alert('Please name the pricing rule');
      return;
    }

    upsertRule({
      name: form.name,
      description: 'Custom configuration',
      baseRate: Number(form.baseRate) || 0,
      hourlyRate: Number(form.hourlyRate) || 0,
      maxRate: form.maxRate ? Number(form.maxRate) : undefined,
      gracePeriodMinutes: Number(form.gracePeriodMinutes) || 0,
      active: true
    });

    setForm(initialForm);
    Alert.alert('Pricing rule saved');
  };

  const handleRemove = (ruleId: string) => {
    Alert.alert('Remove rule', 'Are you sure you want to delete this pricing rule?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeRule(ruleId)
      }
    ]);
  };

  return (
    <Screen>
      <Card style={{ gap: 12 }}>
        <Text variant="subtitle">New pricing rule</Text>
        <Input label="Name" value={form.name} onChangeText={(value) => handleChange('name', value)} />
        <Input
          label="Base rate"
          keyboardType="decimal-pad"
          value={form.baseRate}
          onChangeText={(value) => handleChange('baseRate', value)}
        />
        <Input
          label="Hourly rate"
          keyboardType="decimal-pad"
          value={form.hourlyRate}
          onChangeText={(value) => handleChange('hourlyRate', value)}
        />
        <Input
          label="Max rate"
          keyboardType="decimal-pad"
          value={form.maxRate}
          onChangeText={(value) => handleChange('maxRate', value)}
        />
        <Input
          label="Grace (minutes)"
          keyboardType="number-pad"
          value={form.gracePeriodMinutes}
          onChangeText={(value) => handleChange('gracePeriodMinutes', value)}
        />
        <Button label="Save pricing rule" onPress={handleCreate} />
        <Button variant="ghost" label="Restore defaults" onPress={ensureDefaults} />
      </Card>

      {pricingRules.map((rule) => (
        <Card key={rule.id} style={{ gap: 8 }}>
          <Text variant="subtitle">{rule.name}</Text>
          {rule.description ? (
            <Text variant="body" style={{ color: palette.textSecondary }}>
              {rule.description}
            </Text>
          ) : null}
          <Text variant="body">Base: {formatCurrency(rule.baseRate)}</Text>
          <Text variant="body">Hourly: {formatCurrency(rule.hourlyRate)}</Text>
          {rule.maxRate ? (
            <Text variant="body">Max: {formatCurrency(rule.maxRate)}</Text>
          ) : null}
          <Text variant="small" style={{ color: palette.textSecondary }}>
            Grace period: {rule.gracePeriodMinutes} min
          </Text>
          <Button variant="secondary" label="Remove" onPress={() => handleRemove(rule.id)} />
        </Card>
      ))}
    </Screen>
  );
};

export default PricingSettingsScreen;
