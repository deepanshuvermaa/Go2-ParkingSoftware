import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PricingRule, PrinterProfile, TaxSettings } from '@/types';
import { isoNow } from '@/utils/date';
import { uuid } from '@/utils/uuid';

interface SettingsState {
  printer?: PrinterProfile;
  pricingRules: PricingRule[];
  tax: TaxSettings;
  autoSync: boolean;
  lastSyncedAt?: string;
  setPrinter: (profile: PrinterProfile | undefined) => void;
  upsertPricingRule: (rule: Omit<PricingRule, 'id'> & { id?: string }) => void;
  removePricingRule: (id: string) => void;
  setAutoSync: (autoSync: boolean) => void;
  markSynced: () => void;
  ensureDefaultRules: () => void;
}

const defaultRules: PricingRule[] = [
  {
    id: 'default-hourly',
    name: 'Standard Hourly',
    description: 'First hour $5, $3 each additional hour',
    baseRate: 5,
    hourlyRate: 3,
    maxRate: 25,
    gracePeriodMinutes: 10,
    active: true
  },
  {
    id: 'overnight',
    name: 'Overnight Flat',
    description: 'Flat overnight rate',
    baseRate: 15,
    hourlyRate: 0,
    overnightFlatRate: 15,
    gracePeriodMinutes: 0,
    active: true
  }
];

const defaultTax: TaxSettings = {
  taxRate: 0.0825,
  serviceFee: 0.02
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      printer: undefined,
      pricingRules: defaultRules,
      tax: defaultTax,
      autoSync: true,
      lastSyncedAt: undefined,

      setPrinter: (profile) => set({ printer: profile }),

      upsertPricingRule: (ruleInput) => {
        set((state) => {
          const id = ruleInput.id ?? uuid();
          const nextRule: PricingRule = { ...ruleInput, id } as PricingRule;
          const exists = state.pricingRules.find((item) => item.id === id);
          if (exists) {
            return {
              pricingRules: state.pricingRules.map((item) => (item.id === id ? nextRule : item))
            };
          }
          return {
            pricingRules: [...state.pricingRules, nextRule]
          };
        });
      },

      removePricingRule: (id) => {
        set((state) => ({
          pricingRules: state.pricingRules.filter((rule) => rule.id !== id)
        }));
      },

      setAutoSync: (autoSync) => set({ autoSync }),

      markSynced: () => set({ lastSyncedAt: isoNow() }),

      ensureDefaultRules: () => {
        const { pricingRules } = get();
        if (!pricingRules.length) {
          set({ pricingRules: defaultRules });
        }
      }
    }),
    {
      name: 'go2-settings-store',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);
