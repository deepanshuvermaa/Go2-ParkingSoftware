// Vehicle types according to Indian norms
export type VehicleType =
  | 'TWO_WHEELER'      // Motorcycles, Scooters
  | 'AUTO_RICKSHAW'    // Three-wheelers
  | 'CAR'              // Cars, SUVs
  | 'MINIBUS'          // Vans, Minibuses
  | 'BUS'              // Large buses
  | 'TRUCK'            // Trucks, Lorries
  | 'HEAVY_VEHICLE';   // Trailers, Heavy machinery

export type VehicleSubType =
  // Two Wheeler Types
  | 'MOTORCYCLE'
  | 'SCOOTER'
  | 'ELECTRIC_SCOOTER'
  | 'BICYCLE'
  // Three Wheeler Types
  | 'AUTO_RICKSHAW'
  | 'E_RICKSHAW'
  | 'GOODS_CARRIER_3W'
  // Car Types
  | 'HATCHBACK'
  | 'SEDAN'
  | 'SUV'
  | 'MUV'
  | 'LUXURY_CAR'
  | 'ELECTRIC_CAR'
  // Commercial Vehicle Types
  | 'TAXI'
  | 'MINIVAN'
  | 'TEMPO'
  | 'MINIBUS'
  | 'SCHOOL_BUS'
  | 'TOURIST_BUS'
  | 'VOLVO_BUS'
  | 'MINI_TRUCK'
  | 'MEDIUM_TRUCK'
  | 'HEAVY_TRUCK'
  | 'TRAILER'
  | 'CONTAINER';

export interface VehicleCategory {
  id: string;
  type: VehicleType;
  subType?: VehicleSubType;
  name: string;
  nameHindi?: string;
  description: string;
  icon?: string;
  color?: string;
  priority: number;
  active: boolean;
}

export type PricingPeriod =
  | 'HOURLY'
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'CUSTOM';

export interface TimeSlot {
  id: string;
  name: string;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  multiplier: number; // Rate multiplier for this time slot
}

export interface VehicleRate {
  id: string;
  vehicleType: VehicleType;
  vehicleSubType?: VehicleSubType;

  // Basic rates (in INR)
  firstHourRate: number;      // First hour rate
  additionalHourRate: number; // Rate per hour after first hour
  dailyRate: number;          // Full day rate
  weeklyRate: number;         // Weekly rate
  monthlyRate: number;        // Monthly pass rate

  // Time-based pricing
  nightCharges?: number;      // Extra charges for overnight parking
  nightStartTime?: string;    // HH:MM format (e.g., "22:00")
  nightEndTime?: string;      // HH:MM format (e.g., "06:00")

  // Progressive pricing
  progressiveRates?: {
    hours: number;
    rate: number;
  }[];

  // Special rates
  weekendMultiplier?: number; // 1.5 means 50% extra on weekends
  holidayMultiplier?: number;

  // Caps and minimums
  minCharge: number;          // Minimum charge
  maxDailyCharge?: number;    // Maximum charge per day

  // Grace period
  gracePeriodMinutes: number; // Free minutes before charging starts

  // Penalties
  lostTicketFee?: number;     // Fee for lost parking ticket

  // Status
  active: boolean;
  effectiveFrom: string;
  effectiveTo?: string;

  createdAt: string;
  updatedAt: string;
}

// Predefined Indian vehicle rates (can be customized)
export const DEFAULT_VEHICLE_RATES: Partial<VehicleRate>[] = [
  {
    vehicleType: 'TWO_WHEELER',
    firstHourRate: 10,
    additionalHourRate: 5,
    dailyRate: 50,
    weeklyRate: 250,
    monthlyRate: 800,
    minCharge: 10,
    maxDailyCharge: 50,
    gracePeriodMinutes: 10,
    nightCharges: 20,
    lostTicketFee: 100,
  },
  {
    vehicleType: 'AUTO_RICKSHAW',
    firstHourRate: 15,
    additionalHourRate: 10,
    dailyRate: 80,
    weeklyRate: 400,
    monthlyRate: 1200,
    minCharge: 15,
    maxDailyCharge: 80,
    gracePeriodMinutes: 10,
    nightCharges: 30,
    lostTicketFee: 150,
  },
  {
    vehicleType: 'CAR',
    firstHourRate: 20,
    additionalHourRate: 15,
    dailyRate: 150,
    weeklyRate: 700,
    monthlyRate: 2000,
    minCharge: 20,
    maxDailyCharge: 150,
    gracePeriodMinutes: 10,
    nightCharges: 50,
    lostTicketFee: 200,
  },
  {
    vehicleType: 'MINIBUS',
    firstHourRate: 40,
    additionalHourRate: 30,
    dailyRate: 300,
    weeklyRate: 1500,
    monthlyRate: 4000,
    minCharge: 40,
    maxDailyCharge: 300,
    gracePeriodMinutes: 15,
    nightCharges: 100,
    lostTicketFee: 300,
  },
  {
    vehicleType: 'BUS',
    firstHourRate: 50,
    additionalHourRate: 40,
    dailyRate: 400,
    weeklyRate: 2000,
    monthlyRate: 5000,
    minCharge: 50,
    maxDailyCharge: 400,
    gracePeriodMinutes: 15,
    nightCharges: 150,
    lostTicketFee: 400,
  },
  {
    vehicleType: 'TRUCK',
    firstHourRate: 60,
    additionalHourRate: 50,
    dailyRate: 500,
    weeklyRate: 2500,
    monthlyRate: 7000,
    minCharge: 60,
    maxDailyCharge: 500,
    gracePeriodMinutes: 15,
    nightCharges: 200,
    lostTicketFee: 500,
  },
  {
    vehicleType: 'HEAVY_VEHICLE',
    firstHourRate: 100,
    additionalHourRate: 80,
    dailyRate: 800,
    weeklyRate: 4000,
    monthlyRate: 10000,
    minCharge: 100,
    maxDailyCharge: 800,
    gracePeriodMinutes: 20,
    nightCharges: 300,
    lostTicketFee: 800,
  },
];

// Popular vehicle categories in India
export const DEFAULT_VEHICLE_CATEGORIES: VehicleCategory[] = [
  // Two Wheelers
  {
    id: 'cat-2w-bike',
    type: 'TWO_WHEELER',
    subType: 'MOTORCYCLE',
    name: 'Motorcycle',
    nameHindi: 'मोटरसाइकिल',
    description: 'Bikes, Motorcycles',
    icon: '🏍️',
    color: '#4CAF50',
    priority: 1,
    active: true,
  },
  {
    id: 'cat-2w-scooter',
    type: 'TWO_WHEELER',
    subType: 'SCOOTER',
    name: 'Scooter',
    nameHindi: 'स्कूटर',
    description: 'Scooters, Activa, etc.',
    icon: '🛵',
    color: '#8BC34A',
    priority: 2,
    active: true,
  },

  // Three Wheelers
  {
    id: 'cat-3w-auto',
    type: 'AUTO_RICKSHAW',
    subType: 'AUTO_RICKSHAW',
    name: 'Auto Rickshaw',
    nameHindi: 'ऑटो रिक्शा',
    description: 'Auto, CNG Rickshaw',
    icon: '🛺',
    color: '#FFC107',
    priority: 3,
    active: true,
  },

  // Cars
  {
    id: 'cat-4w-car',
    type: 'CAR',
    subType: 'SEDAN',
    name: 'Car',
    nameHindi: 'कार',
    description: 'Cars, Sedans, Hatchbacks',
    icon: '🚗',
    color: '#2196F3',
    priority: 4,
    active: true,
  },
  {
    id: 'cat-4w-suv',
    type: 'CAR',
    subType: 'SUV',
    name: 'SUV',
    nameHindi: 'एसयूवी',
    description: 'SUVs, MUVs, Large Cars',
    icon: '🚙',
    color: '#1976D2',
    priority: 5,
    active: true,
  },

  // Commercial Vehicles
  {
    id: 'cat-cv-minibus',
    type: 'MINIBUS',
    subType: 'MINIBUS',
    name: 'Van/Minibus',
    nameHindi: 'वैन/मिनीबस',
    description: 'Vans, Tempo Traveller',
    icon: '🚐',
    color: '#9C27B0',
    priority: 6,
    active: true,
  },
  {
    id: 'cat-cv-bus',
    type: 'BUS',
    subType: 'TOURIST_BUS',
    name: 'Bus',
    nameHindi: 'बस',
    description: 'Buses, Coaches',
    icon: '🚌',
    color: '#E91E63',
    priority: 7,
    active: true,
  },
  {
    id: 'cat-cv-truck',
    type: 'TRUCK',
    subType: 'MEDIUM_TRUCK',
    name: 'Truck',
    nameHindi: 'ट्रक',
    description: 'Trucks, Lorries',
    icon: '🚚',
    color: '#FF5722',
    priority: 8,
    active: true,
  },
  {
    id: 'cat-cv-heavy',
    type: 'HEAVY_VEHICLE',
    subType: 'TRAILER',
    name: 'Heavy Vehicle',
    nameHindi: 'भारी वाहन',
    description: 'Trailers, Containers',
    icon: '🚛',
    color: '#795548',
    priority: 9,
    active: true,
  },
];

export interface VehicleRateCalculation {
  vehicleType: VehicleType;
  entryTime: Date;
  exitTime: Date;
  baseAmount: number;
  nightCharges: number;
  weekendCharges: number;
  totalHours: number;
  totalAmount: number;
  breakdown: {
    description: string;
    amount: number;
  }[];
}