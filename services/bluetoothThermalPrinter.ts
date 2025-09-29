import { Platform, PermissionsAndroid } from 'react-native';
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';
import { ParkingTicket } from '@/types';

// ESC/POS Commands for thermal printers
const Commands = {
  ESC: '\x1B',
  GS: '\x1D',
  INIT: '\x1B\x40',
  ALIGN_CENTER: '\x1B\x61\x01',
  ALIGN_LEFT: '\x1B\x61\x00',
  ALIGN_RIGHT: '\x1B\x61\x02',
  BOLD_ON: '\x1B\x45\x01',
  BOLD_OFF: '\x1B\x45\x00',
  TEXT_BOLD_ON: '\x1B\x45\x01',
  TEXT_BOLD_OFF: '\x1B\x45\x00',
  FONT_SIZE_NORMAL: '\x1D\x21\x00',
  FONT_SIZE_LARGE: '\x1D\x21\x11',
  FONT_SIZE_DOUBLE_HEIGHT: '\x1D\x21\x10',
  FONT_SIZE_DOUBLE_WIDTH: '\x1D\x21\x20',
  FONT_SIZE_DOUBLE: '\x1D\x21\x30',
  LINE_FEED: '\n',
  CUT_PAPER: '\x1D\x56\x00',
  PAPER_FULL_CUT: '\x1D\x56\x00',
  PAPER_PARTIAL_CUT: '\x1D\x56\x01',
  // QR Code commands
  QR_CODE_MODEL: '\x1D\x28\x6B\x04\x00\x31\x41',  // Select QR Code model
  QR_CODE_SIZE: '\x1D\x28\x6B\x03\x00\x31\x43',    // Set QR Code size
  QR_CODE_ERROR: '\x1D\x28\x6B\x03\x00\x31\x45',   // Set error correction level
  QR_CODE_STORE: '\x1D\x28\x6B',                   // Store QR Code data
  QR_CODE_PRINT: '\x1D\x28\x6B\x03\x00\x31\x51\x30', // Print QR Code
};

export interface ThermalPrinter {
  id: string;
  name: string;
  address: string;
  bonded: boolean;
  connected: boolean;
}

export class BluetoothThermalPrinter {
  private currentDevice: BluetoothDevice | null = null;
  private isScanning: boolean = false;

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return true;
    }

    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];

      const results = await PermissionsAndroid.requestMultiple(permissions);

      return Object.values(results).every(
        result => result === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.error('Permission error:', err);
      return false;
    }
  }

  async isBluetoothEnabled(): Promise<boolean> {
    try {
      return await RNBluetoothClassic.isBluetoothEnabled();
    } catch (error) {
      console.error('Bluetooth check error:', error);
      return false;
    }
  }

  async enableBluetooth(): Promise<boolean> {
    try {
      return await RNBluetoothClassic.requestBluetoothEnabled();
    } catch (error) {
      console.error('Enable Bluetooth error:', error);
      return false;
    }
  }

  async scanForPrinters(): Promise<ThermalPrinter[]> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Bluetooth permissions not granted');
    }

    const isEnabled = await this.isBluetoothEnabled();
    if (!isEnabled) {
      const enabled = await this.enableBluetooth();
      if (!enabled) {
        throw new Error('Bluetooth is not enabled');
      }
    }

    try {
      // First get bonded devices
      const paired = await RNBluetoothClassic.getBondedDevices();
      const printers: ThermalPrinter[] = paired.map(device => ({
        id: device.id,
        name: device.name || 'Unknown Printer',
        address: device.address,
        bonded: true,
        connected: false,
      }));

      // Check connected status for paired devices
      for (const printer of printers) {
        try {
          const device = await RNBluetoothClassic.getConnectedDevice(printer.address);
          if (device) {
            printer.connected = true;
          }
        } catch (e) {
          // Device not connected, ignore
        }
      }

      // Try to discover new devices
      if (!this.isScanning) {
        this.isScanning = true;
        try {
          // Cancel any existing discovery first
          try {
            await RNBluetoothClassic.cancelDiscovery();
          } catch (e) {
            // Ignore if not discovering
          }

          const discovered = await RNBluetoothClassic.startDiscovery();
          discovered.forEach(device => {
            if (!printers.find(p => p.address === device.address)) {
              printers.push({
                id: device.id,
                name: device.name || 'Unknown Device',
                address: device.address,
                bonded: false,
                connected: false,
              });
            }
          });
        } finally {
          this.isScanning = false;
          // Stop discovery after scanning
          try {
            await RNBluetoothClassic.cancelDiscovery();
          } catch (e) {
            // Ignore
          }
        }
      }

      return printers;
    } catch (error) {
      console.error('Scan error:', error);
      throw error;
    }
  }

  async connectToPrinter(printer: ThermalPrinter): Promise<boolean> {
    try {
      // Disconnect from current device if any
      if (this.currentDevice) {
        await this.disconnect();
      }

      // Connect to new device
      const device = await RNBluetoothClassic.connectToDevice(printer.address);
      this.currentDevice = device;

      return device.isConnected();
    } catch (error) {
      console.error('Connect error:', error);
      throw new Error(`Failed to connect to ${printer.name}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.currentDevice) {
      try {
        await this.currentDevice.disconnect();
      } catch (error) {
        console.error('Disconnect error:', error);
      }
      this.currentDevice = null;
    }
  }

  isConnected(): boolean {
    return this.currentDevice !== null && this.currentDevice.isConnected !== undefined;
  }

  async write(data: string): Promise<void> {
    if (!this.currentDevice) {
      throw new Error('No printer connected');
    }

    try {
      await this.currentDevice.write(data);
    } catch (error) {
      console.error('Write error:', error);
      throw error;
    }
  }

  async printParkingTicket(ticket: ParkingTicket, isCheckout: boolean = false): Promise<void> {
    if (!this.currentDevice) {
      throw new Error('No printer connected');
    }

    try {
      await this.write(Commands.INIT);

      // Header
      await this.write(Commands.ALIGN_CENTER);
      await this.write(Commands.TEXT_BOLD_ON);
      await this.write(Commands.FONT_SIZE_LARGE);
      await this.write('GO2 PARKING\n');
      await this.write(Commands.FONT_SIZE_NORMAL);
      await this.write('================================\n');
      await this.write(Commands.TEXT_BOLD_OFF);

      // Ticket Type
      await this.write(Commands.FONT_SIZE_LARGE);
      await this.write(isCheckout ? 'CHECKOUT RECEIPT\n' : 'PARKING TICKET\n');
      await this.write(Commands.FONT_SIZE_NORMAL);
      await this.write('================================\n\n');

      // Ticket Details
      await this.write(Commands.ALIGN_LEFT);
      await this.write(`Ticket #: ${ticket.ticketNumber}\n`);
      await this.write(`Vehicle: ${ticket.vehicleNumber}\n`);
      await this.write(`Type: ${ticket.vehicleType}\n`);

      // Date and Time
      const entryDate = new Date(ticket.entryTime);
      await this.write(`Entry Date: ${entryDate.toLocaleDateString('en-IN')}\n`);
      await this.write(`Entry Time: ${this.formatTime(entryDate)}\n`);

      if (isCheckout && ticket.exitTime) {
        const exitDate = new Date(ticket.exitTime);
        await this.write(`Exit Date: ${exitDate.toLocaleDateString('en-IN')}\n`);
        await this.write(`Exit Time: ${this.formatTime(exitDate)}\n`);
        await this.write(`Duration: ${ticket.duration || 'N/A'}\n`);
      }

      await this.write(`Location: ${ticket.location || 'Main Parking'}\n`);
      await this.write('--------------------------------\n');

      // QR Code Section (contains ticket number for quick scan)
      await this.write(Commands.ALIGN_CENTER);
      await this.write('\n');
      await this.printQRCode(ticket.ticketNumber);
      await this.write('\n');
      await this.write(Commands.ALIGN_LEFT);

      // Amount Section
      if (isCheckout && ticket.amount) {
        await this.write(Commands.TEXT_BOLD_ON);
        await this.write(Commands.FONT_SIZE_LARGE);
        await this.write(`Amount: Rs ${ticket.amount}/-\n`);
        await this.write(Commands.FONT_SIZE_NORMAL);
        await this.write(Commands.TEXT_BOLD_OFF);
        await this.write(`Payment: ${ticket.paymentMethod || 'Cash'}\n`);
        await this.write('--------------------------------\n');
      }

      // Footer
      await this.write(Commands.ALIGN_CENTER);
      await this.write(Commands.TEXT_BOLD_ON);
      if (!isCheckout) {
        await this.write('PLEASE KEEP THIS TICKET SAFE\n');
        await this.write('REQUIRED FOR CHECKOUT\n');
      } else {
        await this.write('THANK YOU FOR YOUR VISIT\n');
        await this.write('DRIVE SAFELY\n');
      }
      await this.write(Commands.TEXT_BOLD_OFF);

      // Contact Info
      await this.write('\n');
      await this.write('Support: +91 9876543210\n');
      await this.write('www.go2parking.com\n');

      await this.write('\n\n\n\n');
      await this.write(Commands.CUT_PAPER);

    } catch (error) {
      console.error('Print ticket error:', error);
      throw new Error('Failed to print ticket');
    }
  }

  async printQRCode(data: string): Promise<void> {
    if (!this.currentDevice) {
      throw new Error('No printer connected');
    }

    try {
      // Initialize QR Code mode
      await this.write(Commands.QR_CODE_MODEL + '\x32\x00'); // Model 2
      await this.write(Commands.QR_CODE_SIZE + '\x06');      // Size 6
      await this.write(Commands.QR_CODE_ERROR + '\x30');     // Error correction L

      // Store QR code data
      const dataLength = data.length + 3;
      const pL = dataLength % 256;
      const pH = Math.floor(dataLength / 256);

      await this.write(Commands.QR_CODE_STORE);
      await this.write(String.fromCharCode(pL));
      await this.write(String.fromCharCode(pH));
      await this.write('\x31\x50\x30');
      await this.write(data);

      // Print the QR code
      await this.write(Commands.QR_CODE_PRINT);
    } catch (error) {
      console.error('QR Code print error:', error);
      // Continue without QR code if it fails
    }
  }

  async testPrint(): Promise<void> {
    if (!this.currentDevice) {
      throw new Error('No printer connected');
    }

    try {
      await this.write(Commands.INIT);
      await this.write(Commands.ALIGN_CENTER);
      await this.write(Commands.FONT_SIZE_DOUBLE);
      await this.write('PRINTER TEST\n');
      await this.write(Commands.FONT_SIZE_NORMAL);
      await this.write('--------------------------------\n');
      await this.write('GO2 PARKING SYSTEM\n');
      await this.write('Test print successful\n');
      await this.write('--------------------------------\n');
      const now = new Date();
      await this.write(`Date: ${now.toLocaleDateString('en-IN')}\n`);
      await this.write(`Time: ${this.formatTime(now)}\n`);
      await this.write('\n');
      await this.write('Printer is working correctly!\n');
      await this.write('\n\n\n');
      await this.write(Commands.CUT_PAPER);
    } catch (error) {
      console.error('Test print error:', error);
      throw error;
    }
  }

  async printDailySummary(summary: any): Promise<void> {
    if (!this.currentDevice) {
      throw new Error('No printer connected');
    }

    try {
      await this.write(Commands.INIT);

      // Header
      await this.write(Commands.ALIGN_CENTER);
      await this.write(Commands.TEXT_BOLD_ON);
      await this.write(Commands.FONT_SIZE_LARGE);
      await this.write('DAILY SUMMARY\n');
      await this.write(Commands.FONT_SIZE_NORMAL);
      await this.write('================================\n');
      await this.write(Commands.TEXT_BOLD_OFF);

      // Date
      await this.write(Commands.ALIGN_LEFT);
      await this.write(`Date: ${new Date().toLocaleDateString('en-IN')}\n`);
      await this.write(`Time: ${this.formatTime(new Date())}\n`);
      await this.write('--------------------------------\n');

      // Summary Stats
      await this.write('VEHICLE SUMMARY:\n');
      await this.write(`Total Check-ins: ${summary.totalCheckIns || 0}\n`);
      await this.write(`Total Check-outs: ${summary.totalCheckOuts || 0}\n`);
      await this.write(`Currently Parked: ${summary.currentlyParked || 0}\n`);
      await this.write('--------------------------------\n');

      // Revenue
      await this.write('REVENUE SUMMARY:\n');
      await this.write(`Cash Collected: Rs ${summary.cashAmount || 0}/-\n`);
      await this.write(`Online Payments: Rs ${summary.onlineAmount || 0}/-\n`);
      await this.write(Commands.TEXT_BOLD_ON);
      await this.write(`Total Revenue: Rs ${summary.totalRevenue || 0}/-\n`);
      await this.write(Commands.TEXT_BOLD_OFF);
      await this.write('--------------------------------\n');

      // Vehicle Type Breakdown
      if (summary.vehicleTypes) {
        await this.write('BY VEHICLE TYPE:\n');
        Object.entries(summary.vehicleTypes).forEach(([type, count]) => {
          this.write(`${type}: ${count}\n`);
        });
        await this.write('--------------------------------\n');
      }

      // Footer
      await this.write(Commands.ALIGN_CENTER);
      await this.write('END OF SUMMARY\n');
      await this.write('\n\n\n\n');
      await this.write(Commands.CUT_PAPER);

    } catch (error) {
      console.error('Print summary error:', error);
      throw new Error('Failed to print summary');
    }
  }

  async printText(text: string): Promise<void> {
    if (!this.currentDevice) {
      throw new Error('No printer connected');
    }

    try {
      await this.write(Commands.INIT);
      await this.write(Commands.ALIGN_LEFT);
      await this.write(Commands.FONT_SIZE_NORMAL);
      await this.write(text);
      await this.write('\n\n\n\n');
      await this.write(Commands.CUT_PAPER);
    } catch (error) {
      console.error('Print text error:', error);
      throw error;
    }
  }

  private formatTime(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }
}

// Export singleton instance
export const bluetoothPrinter = new BluetoothThermalPrinter();