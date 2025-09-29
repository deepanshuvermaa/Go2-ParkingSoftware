import { useState, useEffect } from 'react';
import { View, ScrollView, Alert, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { storage, storageKeys } from '@/utils/storage';
import { useAuth } from '@/hooks/useAuth';
import { palette } from '@/constants/colors';
import { logger } from '@/utils/logger';

interface PrintSettings {
  paperSize: '2inch' | '3inch';
  businessName: string;
  businessNameHindi?: string;
  address: string;
  phone: string;
  gstNumber?: string;
  showLogo: boolean;
  showQRCode: boolean;
  showTerms: boolean;
  termsText: string;
  thankYouMessage: string;
  fontSize: 'small' | 'medium' | 'large';
  autoprint: boolean;
  printCopies: number;
}

const DEFAULT_SETTINGS: PrintSettings = {
  paperSize: '2inch',
  businessName: 'Go2 Parking',
  businessNameHindi: 'गो2 पार्किंग',
  address: 'Your Address Here',
  phone: '+91-9999999999',
  gstNumber: '',
  showLogo: true,
  showQRCode: true,
  showTerms: true,
  termsText: 'Vehicle parked at owner\'s risk. No responsibility for theft or damage.',
  thankYouMessage: 'Thank you for parking with us!',
  fontSize: 'medium',
  autoprint: false,
  printCopies: 1,
};

export default function PrintSettingsScreen() {
  const router = useRouter();
  const { user, hasRole } = useAuth();
  const [settings, setSettings] = useState<PrintSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await storage.get<PrintSettings>('printSettings');
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      logger.error('Failed to load print settings', { error });
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      await storage.set('printSettings', settings);
      Alert.alert('Success', 'Print settings saved successfully');
    } catch (error) {
      logger.error('Failed to save print settings', { error });
      Alert.alert('Error', 'Failed to save print settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    Alert.alert(
      'Print Preview',
      `Paper Size: ${settings.paperSize === '2inch' ? '58mm (2")' : '80mm (3")'}\n` +
      `Business: ${settings.businessName}\n` +
      `Font Size: ${settings.fontSize}\n` +
      `Auto Print: ${settings.autoprint ? 'Yes' : 'No'}\n` +
      `Copies: ${settings.printCopies}`
    );
  };

  const updateSetting = <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!hasRole('OWNER', 'MANAGER')) {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <Text variant="body">You don't have permission to manage print settings</Text>
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
        <Text variant="title">Print Settings</Text>
        <Text variant="body" style={styles.subtitle}>
          Customize receipt format for thermal printers
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Paper Size Selection */}
        <Card style={styles.section}>
          <Text variant="subtitle" style={styles.sectionTitle}>Paper Size</Text>
          <View style={styles.paperSizeContainer}>
            <TouchableOpacity
              style={[
                styles.paperOption,
                settings.paperSize === '2inch' && styles.paperOptionActive
              ]}
              onPress={() => updateSetting('paperSize', '2inch')}
            >
              <Text style={styles.paperIcon}>📄</Text>
              <Text style={styles.paperText}>58mm</Text>
              <Text style={styles.paperSubtext}>2 inch</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paperOption,
                settings.paperSize === '3inch' && styles.paperOptionActive
              ]}
              onPress={() => updateSetting('paperSize', '3inch')}
            >
              <Text style={styles.paperIcon}>📋</Text>
              <Text style={styles.paperText}>80mm</Text>
              <Text style={styles.paperSubtext}>3 inch</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Business Information */}
        <Card style={styles.section}>
          <Text variant="subtitle" style={styles.sectionTitle}>Business Information</Text>

          <Input
            label="Business Name"
            value={settings.businessName}
            onChangeText={(value) => updateSetting('businessName', value)}
            style={styles.input}
          />

          <Input
            label="Business Name (Hindi)"
            value={settings.businessNameHindi}
            onChangeText={(value) => updateSetting('businessNameHindi', value)}
            placeholder="व्यापार का नाम"
            style={styles.input}
          />

          <Input
            label="Address"
            value={settings.address}
            onChangeText={(value) => updateSetting('address', value)}
            multiline
            numberOfLines={2}
            style={styles.input}
          />

          <Input
            label="Phone Number"
            value={settings.phone}
            onChangeText={(value) => updateSetting('phone', value)}
            keyboardType="phone-pad"
            style={styles.input}
          />

          <Input
            label="GST Number (Optional)"
            value={settings.gstNumber}
            onChangeText={(value) => updateSetting('gstNumber', value)}
            style={styles.input}
          />
        </Card>

        {/* Display Options */}
        <Card style={styles.section}>
          <Text variant="subtitle" style={styles.sectionTitle}>Display Options</Text>

          <View style={styles.switchRow}>
            <Text>Show Logo</Text>
            <Switch
              value={settings.showLogo}
              onValueChange={(value) => updateSetting('showLogo', value)}
              trackColor={{ false: palette.gray[300], true: palette.primary }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text>Show QR Code</Text>
            <Switch
              value={settings.showQRCode}
              onValueChange={(value) => updateSetting('showQRCode', value)}
              trackColor={{ false: palette.gray[300], true: palette.primary }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text>Show Terms & Conditions</Text>
            <Switch
              value={settings.showTerms}
              onValueChange={(value) => updateSetting('showTerms', value)}
              trackColor={{ false: palette.gray[300], true: palette.primary }}
            />
          </View>
        </Card>

        {/* Font Settings */}
        <Card style={styles.section}>
          <Text variant="subtitle" style={styles.sectionTitle}>Font Settings</Text>

          <Text style={styles.label}>Font Size</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={settings.fontSize}
              onValueChange={(value) => updateSetting('fontSize', value)}
              style={styles.picker}
            >
              <Picker.Item label="Small" value="small" />
              <Picker.Item label="Medium" value="medium" />
              <Picker.Item label="Large" value="large" />
            </Picker>
          </View>
        </Card>

        {/* Custom Messages */}
        <Card style={styles.section}>
          <Text variant="subtitle" style={styles.sectionTitle}>Custom Messages</Text>

          {settings.showTerms && (
            <Input
              label="Terms & Conditions"
              value={settings.termsText}
              onChangeText={(value) => updateSetting('termsText', value)}
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          )}

          <Input
            label="Thank You Message"
            value={settings.thankYouMessage}
            onChangeText={(value) => updateSetting('thankYouMessage', value)}
            multiline
            numberOfLines={2}
            style={styles.input}
          />
        </Card>

        {/* Print Behavior */}
        <Card style={styles.section}>
          <Text variant="subtitle" style={styles.sectionTitle}>Print Behavior</Text>

          <View style={styles.switchRow}>
            <Text>Auto Print on Check-in</Text>
            <Switch
              value={settings.autoprint}
              onValueChange={(value) => updateSetting('autoprint', value)}
              trackColor={{ false: palette.gray[300], true: palette.primary }}
            />
          </View>

          <Text style={styles.label}>Number of Copies</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={settings.printCopies}
              onValueChange={(value) => updateSetting('printCopies', value)}
              style={styles.picker}
            >
              <Picker.Item label="1 Copy" value={1} />
              <Picker.Item label="2 Copies" value={2} />
              <Picker.Item label="3 Copies" value={3} />
            </Picker>
          </View>
        </Card>

        {/* Sample Receipt Preview */}
        <Card style={[styles.section, styles.previewCard]}>
          <Text variant="subtitle" style={styles.sectionTitle}>Receipt Preview</Text>
          <View style={[
            styles.receipt,
            settings.paperSize === '2inch' ? styles.receipt2inch : styles.receipt3inch
          ]}>
            {settings.showLogo && (
              <Text style={styles.receiptLogo}>🅿️</Text>
            )}
            <Text style={[styles.receiptTitle, styles[`font${settings.fontSize}`]]}>
              {settings.businessName}
            </Text>
            {settings.businessNameHindi && (
              <Text style={[styles.receiptSubtitle, styles[`font${settings.fontSize}`]]}>
                {settings.businessNameHindi}
              </Text>
            )}
            <Text style={styles.receiptDivider}>{'─'.repeat(settings.paperSize === '2inch' ? 24 : 32)}</Text>
            <Text style={styles.receiptText}>Vehicle: MH12AB1234</Text>
            <Text style={styles.receiptText}>Type: CAR</Text>
            <Text style={styles.receiptText}>Entry: 10:30 AM</Text>
            <Text style={styles.receiptText}>Token: PRK-001</Text>
            <Text style={styles.receiptDivider}>{'─'.repeat(settings.paperSize === '2inch' ? 24 : 32)}</Text>
            {settings.showQRCode && (
              <View style={styles.qrCode}>
                <Text>[ QR Code ]</Text>
              </View>
            )}
            {settings.showTerms && (
              <Text style={styles.receiptTerms}>{settings.termsText}</Text>
            )}
            <Text style={styles.receiptThankYou}>{settings.thankYouMessage}</Text>
            <Text style={styles.receiptFooter}>{settings.phone}</Text>
          </View>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Test Print"
          onPress={handlePreview}
          variant="secondary"
          style={styles.footerButton}
        />
        <Button
          title="Save Settings"
          onPress={saveSettings}
          loading={loading}
          style={styles.footerButton}
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
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    color: palette.gray[900],
  },
  input: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: palette.gray[700],
    marginBottom: 8,
  },
  paperSizeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  paperOption: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: palette.gray[300],
    alignItems: 'center',
    backgroundColor: palette.white,
  },
  paperOptionActive: {
    borderColor: palette.primary,
    backgroundColor: palette.primary + '10',
  },
  paperIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  paperText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.gray[900],
  },
  paperSubtext: {
    fontSize: 12,
    color: palette.gray[600],
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.gray[200],
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: palette.gray[300],
    borderRadius: 8,
    backgroundColor: palette.white,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  previewCard: {
    backgroundColor: palette.gray[50],
  },
  receipt: {
    backgroundColor: palette.white,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  receipt2inch: {
    width: 200,
  },
  receipt3inch: {
    width: 280,
  },
  receiptLogo: {
    fontSize: 32,
    marginBottom: 8,
  },
  receiptTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  receiptSubtitle: {
    marginBottom: 8,
    color: palette.gray[600],
  },
  receiptDivider: {
    fontSize: 10,
    color: palette.gray[400],
    marginVertical: 8,
  },
  receiptText: {
    fontSize: 12,
    marginBottom: 4,
  },
  receiptTerms: {
    fontSize: 10,
    color: palette.gray[600],
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  receiptThankYou: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
  },
  receiptFooter: {
    fontSize: 10,
    color: palette.gray[600],
    marginTop: 4,
  },
  qrCode: {
    marginVertical: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.gray[300],
    borderRadius: 4,
  },
  fontsmall: {
    fontSize: 10,
  },
  fontmedium: {
    fontSize: 14,
  },
  fontlarge: {
    fontSize: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  footerButton: {
    flex: 1,
  },
});