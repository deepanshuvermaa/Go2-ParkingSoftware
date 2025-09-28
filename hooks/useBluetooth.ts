import { useEffect, useState } from 'react';
import { PrinterDevice, PrinterConnectionState } from '@/types/printer';
import { printingService } from '@/services/printingService';
import { useSettingsStore } from '@/stores/settingsStore';

interface UseBluetoothReturn {
  devices: PrinterDevice[];
  selectedDevice?: PrinterDevice;
  state: PrinterConnectionState;
  scan: () => Promise<void>;
  connect: (deviceId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  printTest: (payload: string) => Promise<void>;
}

export const useBluetooth = (): UseBluetoothReturn => {
  const [devices, setDevices] = useState<PrinterDevice[]>(printingService.getKnownDevices());
  const [selectedDevice, setSelectedDevice] = useState<PrinterDevice | undefined>(
    printingService.getSelectedDevice()
  );
  const [state, setState] = useState<PrinterConnectionState>(printingService.getState());
  const setPrinterProfile = useSettingsStore((store) => store.setPrinter);

  useEffect(() => {
    const unsubscribeState = printingService.onStateChange(setState);
    const unsubscribeDevices = printingService.onDevicesChange(setDevices);
    const unsubscribeSelection = printingService.onSelectionChange((device) => {
      setSelectedDevice(device);
      const profile = printingService.getProfile();
      setPrinterProfile(profile);
    });

    const profile = printingService.getProfile();
    setPrinterProfile(profile);

    return () => {
      unsubscribeState();
      unsubscribeDevices();
      unsubscribeSelection();
    };
  }, [setPrinterProfile]);

  const scan = async () => {
    await printingService.scanForPrinters();
  };

  const connect = async (deviceId: string) => {
    await printingService.connectToPrinter(deviceId);
  };

  const disconnect = async () => {
    await printingService.disconnect();
  };

  const printTest = async (payload: string) => {
    await printingService.print(payload);
  };

  return { devices, selectedDevice, state, scan, connect, disconnect, printTest };
};
