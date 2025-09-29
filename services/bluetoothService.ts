// Bluetooth service wrapper that handles the BLE functionality
// This will work without the react-native-ble-plx plugin in the build config

interface BluetoothDevice {
  id: string;
  name: string;
  isConnected: boolean;
}

interface PrintData {
  ticketNumber: string;
  vehicleNumber: string;
  entryTime: string;
  location: string;
  amount?: number;
}

class BluetoothService {
  private devices: BluetoothDevice[] = [];
  private currentDevice: BluetoothDevice | null = null;

  async scanForDevices(): Promise<BluetoothDevice[]> {
    // In production, this will use the native BLE module
    // For now, return mock devices for testing
    console.log('Scanning for Bluetooth devices...');

    // Simulate device discovery
    this.devices = [
      { id: '1', name: 'Thermal Printer 1', isConnected: false },
      { id: '2', name: 'Receipt Printer', isConnected: false }
    ];

    return this.devices;
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    const device = this.devices.find(d => d.id === deviceId);
    if (device) {
      device.isConnected = true;
      this.currentDevice = device;
      console.log(`Connected to ${device.name}`);
      return true;
    }
    return false;
  }

  async printReceipt(data: PrintData): Promise<boolean> {
    if (!this.currentDevice?.isConnected) {
      console.error('No printer connected');
      return false;
    }

    // Format receipt data
    const receipt = `
================================
       GO2 PARKING SYSTEM
================================
Ticket #: ${data.ticketNumber}
Vehicle: ${data.vehicleNumber}
Entry: ${data.entryTime}
Location: ${data.location}
${data.amount ? `Amount: $${data.amount}` : 'Status: ACTIVE'}
================================
        Thank You!
================================
    `.trim();

    console.log('Printing receipt:', receipt);

    // In production, this sends data to the printer
    // For now, simulate successful print
    return true;
  }

  async disconnect(): Promise<void> {
    if (this.currentDevice) {
      this.currentDevice.isConnected = false;
      console.log(`Disconnected from ${this.currentDevice.name}`);
      this.currentDevice = null;
    }
  }

  isConnected(): boolean {
    return this.currentDevice?.isConnected || false;
  }

  getCurrentDevice(): BluetoothDevice | null {
    return this.currentDevice;
  }
}

export default new BluetoothService();