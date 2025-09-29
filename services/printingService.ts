// Using Bluetooth Classic for thermal printer support (same as Quickbill)
import { bluetoothPrinter, ThermalPrinter } from './bluetoothThermalPrinter';
import { PrinterConnectionState, PrinterDevice, PrinterProfile } from '@/types';
import { logger } from '@/utils/logger';
import { storage, storageKeys } from '@/utils/storage';
import { isoNow } from '@/utils/date';

type Listener<T> = (value: T) => void;

class PrintingService {
  private devices: PrinterDevice[] = [];
  private state: PrinterConnectionState = 'DISCONNECTED';
  private selected?: PrinterDevice;
  private profile?: PrinterProfile;
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

    try {
      const printers = await bluetoothPrinter.scanForPrinters();

      // Convert ThermalPrinter to PrinterDevice format
      this.devices = printers.map(p => ({
        id: p.id,
        name: p.name,
        model: p.name,
        bonded: p.bonded
      }));

      this.emitDevices();
      this.setState(this.selected ? 'CONNECTED' : 'DISCONNECTED');
      return;
    } catch (error) {
      logger.error('Printer scan error', { error });
      this.setState('ERROR');
      throw error;
    }
  }

  // Device discovery is now handled by bluetoothPrinter.scanForPrinters()

  async connectToPrinter(deviceId: string) {
    try {
      this.setState('CONNECTING');

      // Find the printer in our devices list
      const printerDevice = this.devices.find(d => d.id === deviceId);
      if (!printerDevice) {
        throw new Error('Printer not found');
      }

      // Create ThermalPrinter object for connection
      const printer: ThermalPrinter = {
        id: printerDevice.id,
        name: printerDevice.name,
        address: deviceId, // Using ID as address
        bonded: printerDevice.bonded || false,
        connected: false
      };

      const connected = await bluetoothPrinter.connectToPrinter(printer);

      if (connected) {
        this.selected = printerDevice;
        this.profile = {
          deviceId: printerDevice.id,
          name: printerDevice.name,
          preferred: true,
          paperWidth: 58,
          density: 3,
          autoPrint: true,
          lastConnectedAt: isoNow()
        };

        await storage.set(storageKeys.printerProfile, this.profile);
        this.setState('CONNECTED');
        this.emitSelection();
      } else {
        throw new Error('Failed to connect');
      }
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
      await bluetoothPrinter.disconnect();
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

    try {
      await bluetoothPrinter.printText(payload);
      this.setState('CONNECTED');
    } catch (error) {
      logger.error('Printing failed', { error });
      this.setState('ERROR');
      throw error;
    }
  }

  // New method to print parking tickets
  async printParkingTicket(ticket: any, isCheckout: boolean = false) {
    if (!this.selected) {
      throw new Error('No printer connected');
    }

    try {
      await bluetoothPrinter.printParkingTicket(ticket, isCheckout);
      this.setState('CONNECTED');
    } catch (error) {
      logger.error('Printing ticket failed', { error });
      this.setState('ERROR');
      throw error;
    }
  }

  // Test print method
  async testPrint() {
    if (!this.selected) {
      throw new Error('No printer connected');
    }

    try {
      await bluetoothPrinter.testPrint();
      this.setState('CONNECTED');
    } catch (error) {
      logger.error('Test print failed', { error });
      this.setState('ERROR');
      throw error;
    }
  }
}

export const printingService = new PrintingService();
