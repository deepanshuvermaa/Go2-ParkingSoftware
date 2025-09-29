import { useState, useEffect } from 'react';
import { View, ScrollView, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { vehicleService } from '@/services/vehicleService';
import { VehicleRate, VehicleCategory, DEFAULT_VEHICLE_CATEGORIES } from '@/types/vehicle';
import { useAuth } from '@/hooks/useAuth';
import { palette } from '@/constants/colors';
import { logger } from '@/utils/logger';

export default function VehicleRatesScreen() {
  const router = useRouter();
  const { user, hasRole } = useAuth();
  const [rates, setRates] = useState<VehicleRate[]>([]);
  const [categories] = useState<VehicleCategory[]>(DEFAULT_VEHICLE_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      setLoading(true);
      const vehicleRates = await vehicleService.fetchVehicleRates();
      setRates(vehicleRates);
    } catch (error) {
      logger.error('Failed to load vehicle rates', { error });
      Alert.alert('Error', 'Failed to load vehicle rates');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRate = (rate: VehicleRate) => {
    setEditingRate(rate.id);
    setFormValues({
      [`${rate.id}_firstHour`]: rate.firstHourRate.toString(),
      [`${rate.id}_additional`]: rate.additionalHourRate.toString(),
      [`${rate.id}_daily`]: rate.dailyRate.toString(),
      [`${rate.id}_weekly`]: rate.weeklyRate.toString(),
      [`${rate.id}_monthly`]: rate.monthlyRate.toString(),
      [`${rate.id}_night`]: rate.nightCharges?.toString() || '0',
      [`${rate.id}_grace`]: rate.gracePeriodMinutes.toString(),
      [`${rate.id}_lost`]: rate.lostTicketFee?.toString() || '0',
    });
  };

  const handleSaveRate = async (rateId: string) => {
    try {
      const rate = rates.find(r => r.id === rateId);
      if (!rate) return;

      const updatedRate: VehicleRate = {
        ...rate,
        firstHourRate: parseFloat(formValues[`${rateId}_firstHour`]) || rate.firstHourRate,
        additionalHourRate: parseFloat(formValues[`${rateId}_additional`]) || rate.additionalHourRate,
        dailyRate: parseFloat(formValues[`${rateId}_daily`]) || rate.dailyRate,
        weeklyRate: parseFloat(formValues[`${rateId}_weekly`]) || rate.weeklyRate,
        monthlyRate: parseFloat(formValues[`${rateId}_monthly`]) || rate.monthlyRate,
        nightCharges: parseFloat(formValues[`${rateId}_night`]) || 0,
        gracePeriodMinutes: parseInt(formValues[`${rateId}_grace`]) || 10,
        lostTicketFee: parseFloat(formValues[`${rateId}_lost`]) || 0,
      };

      await vehicleService.updateVehicleRate(updatedRate);

      setRates(prevRates =>
        prevRates.map(r => r.id === rateId ? updatedRate : r)
      );

      setEditingRate(null);
      Alert.alert('Success', 'Vehicle rates updated successfully');
    } catch (error) {
      logger.error('Failed to update rate', { error });
      Alert.alert('Error', 'Failed to update vehicle rate');
    }
  };

  const getCategoryForType = (vehicleType: string) => {
    return categories.find(cat => cat.type === vehicleType);
  };

  const formatCurrency = (amount: number) => `₹${amount}`;

  if (!hasRole('OWNER', 'MANAGER')) {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <Text variant="body">You don't have permission to manage vehicle rates</Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            style={{ marginTop: 20 }}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable={true}>
      <View style={styles.header}>
        <Text variant="title">Vehicle Rates Management</Text>
        <Text variant="body" style={styles.subtitle}>
          Customize parking rates for different vehicle categories
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {rates.map((rate) => {
          const category = getCategoryForType(rate.vehicleType);
          const isEditing = editingRate === rate.id;

          return (
            <Card key={rate.id} style={styles.rateCard}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryIcon}>{category?.icon}</Text>
                <View style={styles.categoryInfo}>
                  <Text variant="subtitle">{category?.name}</Text>
                  {category?.nameHindi && (
                    <Text variant="caption" style={styles.hindiName}>
                      {category.nameHindi}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => isEditing ? handleSaveRate(rate.id) : handleEditRate(rate)}
                  style={[styles.editButton, isEditing && styles.saveButton]}
                >
                  <Text style={styles.editButtonText}>
                    {isEditing ? 'Save' : 'Edit'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.rateGrid}>
                {/* Hourly Rates */}
                <View style={styles.rateSection}>
                  <Text variant="caption" style={styles.sectionTitle}>Hourly Rates</Text>
                  <View style={styles.rateRow}>
                    <Text style={styles.rateLabel}>First Hour:</Text>
                    {isEditing ? (
                      <Input
                        value={formValues[`${rate.id}_firstHour`]}
                        onChangeText={(value) =>
                          setFormValues(prev => ({...prev, [`${rate.id}_firstHour`]: value}))
                        }
                        keyboardType="numeric"
                        style={styles.rateInput}
                      />
                    ) : (
                      <Text style={styles.rateValue}>{formatCurrency(rate.firstHourRate)}</Text>
                    )}
                  </View>
                  <View style={styles.rateRow}>
                    <Text style={styles.rateLabel}>Additional:</Text>
                    {isEditing ? (
                      <Input
                        value={formValues[`${rate.id}_additional`]}
                        onChangeText={(value) =>
                          setFormValues(prev => ({...prev, [`${rate.id}_additional`]: value}))
                        }
                        keyboardType="numeric"
                        style={styles.rateInput}
                      />
                    ) : (
                      <Text style={styles.rateValue}>{formatCurrency(rate.additionalHourRate)}/hr</Text>
                    )}
                  </View>
                </View>

                {/* Pass Rates */}
                <View style={styles.rateSection}>
                  <Text variant="caption" style={styles.sectionTitle}>Pass Rates</Text>
                  <View style={styles.rateRow}>
                    <Text style={styles.rateLabel}>Daily:</Text>
                    {isEditing ? (
                      <Input
                        value={formValues[`${rate.id}_daily`]}
                        onChangeText={(value) =>
                          setFormValues(prev => ({...prev, [`${rate.id}_daily`]: value}))
                        }
                        keyboardType="numeric"
                        style={styles.rateInput}
                      />
                    ) : (
                      <Text style={styles.rateValue}>{formatCurrency(rate.dailyRate)}</Text>
                    )}
                  </View>
                  <View style={styles.rateRow}>
                    <Text style={styles.rateLabel}>Weekly:</Text>
                    {isEditing ? (
                      <Input
                        value={formValues[`${rate.id}_weekly`]}
                        onChangeText={(value) =>
                          setFormValues(prev => ({...prev, [`${rate.id}_weekly`]: value}))
                        }
                        keyboardType="numeric"
                        style={styles.rateInput}
                      />
                    ) : (
                      <Text style={styles.rateValue}>{formatCurrency(rate.weeklyRate)}</Text>
                    )}
                  </View>
                  <View style={styles.rateRow}>
                    <Text style={styles.rateLabel}>Monthly:</Text>
                    {isEditing ? (
                      <Input
                        value={formValues[`${rate.id}_monthly`]}
                        onChangeText={(value) =>
                          setFormValues(prev => ({...prev, [`${rate.id}_monthly`]: value}))
                        }
                        keyboardType="numeric"
                        style={styles.rateInput}
                      />
                    ) : (
                      <Text style={styles.rateValue}>{formatCurrency(rate.monthlyRate)}</Text>
                    )}
                  </View>
                </View>

                {/* Additional Charges */}
                <View style={styles.rateSection}>
                  <Text variant="caption" style={styles.sectionTitle}>Additional</Text>
                  <View style={styles.rateRow}>
                    <Text style={styles.rateLabel}>Night Charge:</Text>
                    {isEditing ? (
                      <Input
                        value={formValues[`${rate.id}_night`]}
                        onChangeText={(value) =>
                          setFormValues(prev => ({...prev, [`${rate.id}_night`]: value}))
                        }
                        keyboardType="numeric"
                        style={styles.rateInput}
                      />
                    ) : (
                      <Text style={styles.rateValue}>{formatCurrency(rate.nightCharges || 0)}</Text>
                    )}
                  </View>
                  <View style={styles.rateRow}>
                    <Text style={styles.rateLabel}>Grace Period:</Text>
                    {isEditing ? (
                      <Input
                        value={formValues[`${rate.id}_grace`]}
                        onChangeText={(value) =>
                          setFormValues(prev => ({...prev, [`${rate.id}_grace`]: value}))
                        }
                        keyboardType="numeric"
                        style={styles.rateInput}
                      />
                    ) : (
                      <Text style={styles.rateValue}>{rate.gracePeriodMinutes} min</Text>
                    )}
                  </View>
                  <View style={styles.rateRow}>
                    <Text style={styles.rateLabel}>Lost Ticket:</Text>
                    {isEditing ? (
                      <Input
                        value={formValues[`${rate.id}_lost`]}
                        onChangeText={(value) =>
                          setFormValues(prev => ({...prev, [`${rate.id}_lost`]: value}))
                        }
                        keyboardType="numeric"
                        style={styles.rateInput}
                      />
                    ) : (
                      <Text style={styles.rateValue}>{formatCurrency(rate.lostTicketFee || 0)}</Text>
                    )}
                  </View>
                </View>
              </View>

              {isEditing && (
                <TouchableOpacity
                  onPress={() => setEditingRate(null)}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </Card>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Sync with Server"
          onPress={async () => {
            try {
              await vehicleService.syncRates();
              Alert.alert('Success', 'Rates synced with server');
            } catch (error) {
              Alert.alert('Error', 'Failed to sync rates');
            }
          }}
          variant="secondary"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
  },
  subtitle: {
    marginTop: 8,
    color: palette.gray[600],
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rateCard: {
    marginBottom: 16,
    padding: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.gray[200],
  },
  categoryIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  hindiName: {
    color: palette.gray[600],
    marginTop: 2,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: palette.primary,
  },
  saveButton: {
    backgroundColor: palette.success,
  },
  editButtonText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '600',
  },
  rateGrid: {
    gap: 16,
  },
  rateSection: {
    gap: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    color: palette.gray[700],
    marginBottom: 4,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rateLabel: {
    fontSize: 14,
    color: palette.gray[600],
  },
  rateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.gray[900],
  },
  rateInput: {
    width: 100,
    height: 32,
    fontSize: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: palette.gray[300],
    borderRadius: 4,
    backgroundColor: palette.white,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: palette.danger,
    fontSize: 14,
  },
  footer: {
    marginTop: 20,
  },
});