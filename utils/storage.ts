import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const storageKeys = {
  authToken: 'go2.auth.token',
  refreshToken: 'go2.auth.refresh',
  ticketCache: 'go2.tickets.cache',
  settings: 'go2.settings',
  userProfile: 'go2.auth.profile',
  session: 'go2.auth.session',
  printerProfile: 'go2.printer.profile',
  vehicleRates: 'go2.vehicle.rates',
  vehicleCategories: 'go2.vehicle.categories'
} as const;

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  },
  async set<T>(key: string, value: T) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async remove(key: string) {
    await AsyncStorage.removeItem(key);
  }
};

export const secureStorage = {
  async get(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string) {
    return SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY
    });
  },
  async remove(key: string) {
    return SecureStore.deleteItemAsync(key);
  }
};
