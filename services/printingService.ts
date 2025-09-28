import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';
import { PrinterConnectionState, PrinterDevice, PrinterProfile } from '@/types';
import { logger } from '@/utils/logger';
import { storage, storageKeys } from '@/utils/storage';
import { isoNow } from '@/utils/date';

const SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

type Listener<T> = (value: T) => void;

const toBase64 = (value: string) => Buffer.from(value, 'utf8').toString('base64');

class PrintingService {
  private manager = new BleManager();
  private devices: PrinterDevice[] = [];
  private state: PrinterConnectionState = 'DISCONNECTED';
  private selected?: PrinterDevice;
  private profile?: PrinterProfile;
  private subscriptions: Subscription[] = [];
  private stateListeners = new Set<Listener<PrinterConnectionState>>();
  private devicesListeners = new Set<Listener<PrinterDevice[]>>();
  private selectionListeners = new Set<Listener<PrinterDevice | undefined>>();

  constructor() {
    void this.restoreProfile();
  }

  private async restoreProfile() {
    try {
      const stored = await storage.get<PrinterProfile>(storageKeys.printerProfile);
      if (stored) {
        this.profile = stored;
        this.selected = {
          id: stored.deviceId,
          name: stored.name ?? 'Saved printer'
        };
        this.setState('DISCONNECTED');
        this.emitSelection();
      }
    } catch (error) {
      logger.warn('Failed to restore printer profile', { error });
    }
  }

  private setState(next: PrinterConnectionState) {
    this.state = next;
    this.stateListeners.forEach((listener) => listener(next));
  }

  private emitDevices() {
    this.devicesListeners.forEach((listener) => listener(this.devices));
  }

  private emitSelection() {
    this.selectionListeners.forEach((listener) => listener(this.selected));
  }

  getState() {
    return this.state;
  }

  getKnownDevices() {
    return this.devices;
  }

  getSelectedDevice() {
    return this.selected;
  }

  getProfile() {
    return this.profile;
  }

  onStateChange(listener: Listener<PrinterConnectionState>) {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  onDevicesChange(listener: Listener<PrinterDevice[]>) {
    this.devicesListeners.add(listener);
    return () => this.devicesListeners.delete(listener);
  }

  onSelectionChange(listener: Listener<PrinterDevice | undefined>) {
    this.selectionListeners.add(listener);
    return () => this.selectionListeners.delete(listener);
  }

  async scanForPrinters(timeoutMs = 10000) {
    this.setState('SCANNING');
    this.devices = [];
    this.emitDevices();

    await this.manager.stopDeviceScan();

    return new Promise<void>((resolve, reject) => {
      let resolved = false;

      this.manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
        if (error) {
          logger.error('Printer scan error', { error: error.message });
          this.setState('ERROR');
          this.manager.stopDeviceScan();
          if (!resolved) {
            resolved = true;
            reject(error);
          }
          return;
        }

        if (device) {
          this.handleDeviceDiscovered(device);
        }
      });

      setTimeout(() => {
        this.manager.stopDeviceScan();
        if (!resolved) {
          resolved = true;
          this.setState(this.selected ? 'CONNECTED' : 'DISCONNECTED');
          resolve();
        }
      }, timeoutMs);
    });
  }

  private handleDeviceDiscovered(device: Device) {
    const candidate: PrinterDevice = {
      id: device.id,
      name: device.name ?? 'Unnamed printer',
      model: device.localName ?? undefined,
      manufacturer: device.manufacturerData ?? undefined,
      rssi: device.rssi ?? undefined,
      bonded: Boolean(device.isBonded)
    };

    if (!this.devices.some((existing) => existing.id === candidate.id)) {
      this.devices = [...this.devices, candidate];
      this.emitDevices();
    }
  }

  async connectToPrinter(deviceId: string) {
    try {
      this.setState('CONNECTING');
      await this.manager.stopDeviceScan();

      const device = await this.manager.connectToDevice(deviceId, {
        requestMTU: 512
      });

      const connected = await device.discoverAllServicesAndCharacteristics();
      this.selected = {
        id: connected.id,
        name: connected.name ?? 'Printer',
        model: connected.localName ?? undefined,
        bonded: Boolean(connected.isBonded)
      };

      if (Platform.OS === 'android') {
        await connected.requestConnectionPriority(1);
      }

      this.profile = {
        deviceId: connected.id,
        name: this.selected.name,
        preferred: true,
        paperWidth: 58,
        density: 3,
        autoPrint: true,
        lastConnectedAt: isoNow()
      };

      await storage.set(storageKeys.printerProfile, this.profile);

      this.subscriptions.forEach((sub) => sub.remove());
      this.subscriptions = [
        connected.onDisconnected(() => {
          logger.warn('Printer disconnected');
          this.selected = undefined;
          this.setState('DISCONNECTED');
          this.emitSelection();
        })
      ];

      this.setState('CONNECTED');
      this.emitSelection();
    } catch (error) {
      this.setState('ERROR');
      logger.error('Failed to connect printer', { error });
      throw error;
    }
  }

  async disconnect() {
    if (!this.selected) {
      return;
    }
    try {
      await this.manager.cancelDeviceConnection(this.selected.id);
    } catch (error) {
      logger.warn('Error disconnecting printer', { error });
    } finally {
      this.selected = undefined;
      this.profile = undefined;
      await storage.remove(storageKeys.printerProfile);
      this.setState('DISCONNECTED');
      this.emitSelection();
    }
  }

  async print(payload: string) {
    if (!this.selected) {
      throw new Error('No printer connected');
    }
    this.setState('CONNECTING');
    try {
      const device = await this.manager.connectToDevice(this.selected.id, { autoConnect: true });
      const data = `${payload}\n\n\n`;
      const base64 = toBase64(data);
      await device.writeCharacteristicWithoutResponseForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        base64
      );
      this.setState('CONNECTED');
    } catch (error) {
      logger.error('Printing failed', { error });
      this.setState('ERROR');
      throw error;
    }
  }
}

export const printingService = new PrintingService();
