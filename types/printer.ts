export type PrinterConnectionState = 'DISCONNECTED' | 'SCANNING' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export interface PrinterDevice {
  id: string;
  name: string;
  model?: string;
  manufacturer?: string;
  rssi?: number;
  bonded?: boolean;
}

export interface PrinterProfile {
  deviceId: string;
  name?: string;
  preferred: boolean;
  paperWidth: number;
  density: number;
  autoPrint: boolean;
  lastConnectedAt?: string;
}
