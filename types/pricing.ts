export interface PricingRule {
  id: string;
  name: string;
  description?: string;
  baseRate: number;
  hourlyRate: number;
  maxRate?: number;
  gracePeriodMinutes: number;
  overnightFlatRate?: number;
  active: boolean;
}

export interface TaxSettings {
  taxRate: number;
  serviceFee: number;
}
