import {
  VehicleType,
  VehicleCategory,
  VehicleRate,
  VehicleRateCalculation,
  DEFAULT_VEHICLE_CATEGORIES,
  DEFAULT_VEHICLE_RATES,
} from '@/types/vehicle';
import { logger } from '@/utils/logger';
import { storage, storageKeys } from '@/utils/storage';
import { isoNow } from '@/utils/date';
import { uuid } from '@/utils/uuid';
import apiClient, { API_ENDPOINTS } from './api';

interface VehicleRatesResponse {
  rates: VehicleRate[];
  categories: VehicleCategory[];
}

export const vehicleService = {
  // Fetch vehicle rates from server
  async fetchVehicleRates(): Promise<VehicleRate[]> {
    try {
      logger.debug('Fetching vehicle rates from server');

      const response = await apiClient.get<VehicleRate[]>(
        API_ENDPOINTS.vehicles.rates
      );

      logger.info('Vehicle rates fetched', { count: response.data.length });

      // Store locally for offline access
      await this.saveRatesLocally(response.data);

      return response.data;
    } catch (error: any) {
      logger.error('Failed to fetch vehicle rates', { error: error.message });

      // Return local rates if offline
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const localRates = await this.getLocalRates();
        if (localRates.length > 0) {
          return localRates;
        }
        // Return defaults if no local rates
        return this.getDefaultRates();
      }
      throw new Error('Failed to fetch vehicle rates');
    }
  },

  // Update vehicle rate
  async updateVehicleRate(rate: VehicleRate): Promise<VehicleRate> {
    try {
      logger.debug('Updating vehicle rate', { vehicleType: rate.vehicleType });

      const response = await apiClient.put<VehicleRate>(
        API_ENDPOINTS.vehicles.updateRate,
        rate
      );

      logger.info('Vehicle rate updated successfully');

      // Update local storage
      await this.saveRatesLocally([response.data]);

      return response.data;
    } catch (error: any) {
      logger.error('Failed to update vehicle rate', { error: error.message });

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        // Save locally for later sync
        await this.saveRatesLocally([rate]);
        return rate;
      }
      throw new Error('Failed to update vehicle rate');
    }
  },

  // Get vehicle categories
  async getVehicleCategories(): Promise<VehicleCategory[]> {
    try {
      logger.debug('Fetching vehicle categories');

      const response = await apiClient.get<VehicleCategory[]>(
        API_ENDPOINTS.vehicles.types
      );

      logger.info('Vehicle categories fetched', { count: response.data.length });

      // Store locally
      await storage.set(storageKeys.vehicleCategories, response.data);

      return response.data;
    } catch (error: any) {
      logger.error('Failed to fetch vehicle categories', { error: error.message });

      // Return local categories if offline
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const localCategories = await storage.get<VehicleCategory[]>(
          storageKeys.vehicleCategories
        );
        if (localCategories) {
          return localCategories;
        }
        // Return defaults
        return DEFAULT_VEHICLE_CATEGORIES;
      }
      throw new Error('Failed to fetch vehicle categories');
    }
  },

  // Calculate parking fee based on vehicle type and duration
  calculateParkingFee(
    vehicleType: VehicleType,
    entryTime: Date,
    exitTime: Date,
    rates?: VehicleRate[]
  ): VehicleRateCalculation {
    const vehicleRate = this.getRateForVehicleType(vehicleType, rates);

    if (!vehicleRate) {
      throw new Error(`No rates found for vehicle type: ${vehicleType}`);
    }

    const duration = exitTime.getTime() - entryTime.getTime();
    const totalMinutes = Math.ceil(duration / (1000 * 60));
    const totalHours = Math.ceil(duration / (1000 * 60 * 60));
    const totalDays = Math.floor(totalHours / 24);

    // Check grace period
    if (totalMinutes <= vehicleRate.gracePeriodMinutes) {
      return {
        vehicleType,
        entryTime,
        exitTime,
        baseAmount: 0,
        nightCharges: 0,
        weekendCharges: 0,
        totalHours: 0,
        totalAmount: 0,
        breakdown: [
          {
            description: `Grace period (${vehicleRate.gracePeriodMinutes} minutes)`,
            amount: 0,
          },
        ],
      };
    }

    let totalAmount = 0;
    const breakdown: { description: string; amount: number }[] = [];

    // Monthly pass check
    if (totalDays >= 28) {
      const months = Math.ceil(totalDays / 30);
      totalAmount = vehicleRate.monthlyRate * months;
      breakdown.push({
        description: `Monthly pass (${months} month${months > 1 ? 's' : ''})`,
        amount: totalAmount,
      });
    }
    // Weekly pass check
    else if (totalDays >= 6) {
      const weeks = Math.ceil(totalDays / 7);
      totalAmount = vehicleRate.weeklyRate * weeks;
      breakdown.push({
        description: `Weekly pass (${weeks} week${weeks > 1 ? 's' : ''})`,
        amount: totalAmount,
      });
    }
    // Daily rate check
    else if (totalHours >= 12) {
      const days = Math.ceil(totalHours / 24);
      totalAmount = vehicleRate.dailyRate * days;
      breakdown.push({
        description: `Daily rate (${days} day${days > 1 ? 's' : ''})`,
        amount: totalAmount,
      });
    }
    // Hourly calculation
    else {
      // Check for progressive rates
      if (vehicleRate.progressiveRates && vehicleRate.progressiveRates.length > 0) {
        let remainingHours = totalHours;

        for (const progressive of vehicleRate.progressiveRates) {
          if (remainingHours <= 0) break;

          const hoursToCharge = Math.min(remainingHours, progressive.hours);
          const charge = hoursToCharge * progressive.rate;
          totalAmount += charge;

          breakdown.push({
            description: `Hours ${totalHours - remainingHours + 1}-${
              totalHours - remainingHours + hoursToCharge
            }`,
            amount: charge,
          });

          remainingHours -= hoursToCharge;
        }
      } else {
        // Standard hourly calculation
        if (totalHours === 1) {
          totalAmount = vehicleRate.firstHourRate;
          breakdown.push({
            description: 'First hour',
            amount: vehicleRate.firstHourRate,
          });
        } else {
          totalAmount =
            vehicleRate.firstHourRate +
            (totalHours - 1) * vehicleRate.additionalHourRate;

          breakdown.push({
            description: 'First hour',
            amount: vehicleRate.firstHourRate,
          });
          breakdown.push({
            description: `Additional ${totalHours - 1} hour${
              totalHours - 1 > 1 ? 's' : ''
            }`,
            amount: (totalHours - 1) * vehicleRate.additionalHourRate,
          });
        }
      }
    }

    // Calculate night charges
    let nightCharges = 0;
    if (vehicleRate.nightCharges) {
      nightCharges = this.calculateNightCharges(
        entryTime,
        exitTime,
        vehicleRate
      );
      if (nightCharges > 0) {
        totalAmount += nightCharges;
        breakdown.push({
          description: 'Night parking charges',
          amount: nightCharges,
        });
      }
    }

    // Calculate weekend charges
    let weekendCharges = 0;
    if (vehicleRate.weekendMultiplier) {
      weekendCharges = this.calculateWeekendCharges(
        entryTime,
        exitTime,
        totalAmount,
        vehicleRate.weekendMultiplier
      );
      if (weekendCharges > 0) {
        totalAmount += weekendCharges;
        breakdown.push({
          description: 'Weekend charges',
          amount: weekendCharges,
        });
      }
    }

    // Apply minimum charge
    if (totalAmount < vehicleRate.minCharge) {
      totalAmount = vehicleRate.minCharge;
      breakdown.push({
        description: 'Minimum charge applied',
        amount: vehicleRate.minCharge - totalAmount,
      });
    }

    // Apply maximum daily charge cap
    if (vehicleRate.maxDailyCharge && totalAmount > vehicleRate.maxDailyCharge) {
      const discount = totalAmount - vehicleRate.maxDailyCharge;
      totalAmount = vehicleRate.maxDailyCharge;
      breakdown.push({
        description: 'Daily maximum cap applied',
        amount: -discount,
      });
    }

    return {
      vehicleType,
      entryTime,
      exitTime,
      baseAmount: totalAmount - nightCharges - weekendCharges,
      nightCharges,
      weekendCharges,
      totalHours,
      totalAmount,
      breakdown,
    };
  },

  // Calculate lost ticket fee
  getLostTicketFee(vehicleType: VehicleType, rates?: VehicleRate[]): number {
    const vehicleRate = this.getRateForVehicleType(vehicleType, rates);
    return vehicleRate?.lostTicketFee || vehicleRate?.dailyRate || 200;
  },

  // Helper: Get rate for specific vehicle type
  getRateForVehicleType(
    vehicleType: VehicleType,
    rates?: VehicleRate[]
  ): VehicleRate | undefined {
    const availableRates = rates || this.getDefaultRates();
    return availableRates.find(
      (rate) => rate.vehicleType === vehicleType && rate.active
    );
  },

  // Helper: Calculate night charges
  private calculateNightCharges(
    entryTime: Date,
    exitTime: Date,
    rate: VehicleRate
  ): number {
    if (!rate.nightCharges || !rate.nightStartTime || !rate.nightEndTime) {
      return 0;
    }

    const nightStart = this.parseTime(rate.nightStartTime);
    const nightEnd = this.parseTime(rate.nightEndTime);

    let nightHours = 0;
    const currentTime = new Date(entryTime);

    while (currentTime < exitTime) {
      const hour = currentTime.getHours();
      const minute = currentTime.getMinutes();
      const timeInMinutes = hour * 60 + minute;

      // Handle overnight periods
      if (nightStart > nightEnd) {
        // Night period crosses midnight
        if (timeInMinutes >= nightStart || timeInMinutes < nightEnd) {
          nightHours++;
        }
      } else {
        // Normal night period
        if (timeInMinutes >= nightStart && timeInMinutes < nightEnd) {
          nightHours++;
        }
      }

      currentTime.setHours(currentTime.getHours() + 1);
    }

    return nightHours > 0 ? rate.nightCharges : 0;
  },

  // Helper: Calculate weekend charges
  private calculateWeekendCharges(
    entryTime: Date,
    exitTime: Date,
    baseAmount: number,
    multiplier: number
  ): number {
    const isWeekend = (date: Date) => {
      const day = date.getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    };

    // Check if parking spans weekend
    let hasWeekend = false;
    const currentDate = new Date(entryTime);

    while (currentDate <= exitTime) {
      if (isWeekend(currentDate)) {
        hasWeekend = true;
        break;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (hasWeekend) {
      return baseAmount * (multiplier - 1);
    }

    return 0;
  },

  // Helper: Parse time string (HH:MM) to minutes
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  },

  // Get default rates with IDs and timestamps
  getDefaultRates(): VehicleRate[] {
    return DEFAULT_VEHICLE_RATES.map((rate) => ({
      id: uuid(),
      ...rate,
      active: true,
      gracePeriodMinutes: rate.gracePeriodMinutes || 10,
      minCharge: rate.minCharge || 10,
      firstHourRate: rate.firstHourRate || 20,
      additionalHourRate: rate.additionalHourRate || 15,
      dailyRate: rate.dailyRate || 150,
      weeklyRate: rate.weeklyRate || 700,
      monthlyRate: rate.monthlyRate || 2000,
      effectiveFrom: isoNow(),
      createdAt: isoNow(),
      updatedAt: isoNow(),
    } as VehicleRate));
  },

  // Save rates locally for offline access
  async saveRatesLocally(rates: VehicleRate[]): Promise<void> {
    try {
      const existingRates = await storage.get<VehicleRate[]>(
        storageKeys.vehicleRates
      ) || [];

      // Merge rates, replacing existing ones with same ID
      const rateMap = new Map<string, VehicleRate>();

      existingRates.forEach((rate) => rateMap.set(rate.id, rate));
      rates.forEach((rate) => rateMap.set(rate.id, rate));

      const mergedRates = Array.from(rateMap.values());
      await storage.set(storageKeys.vehicleRates, mergedRates);

      logger.debug('Vehicle rates saved locally', { count: mergedRates.length });
    } catch (error) {
      logger.error('Failed to save rates locally', { error });
    }
  },

  // Get locally stored rates
  async getLocalRates(): Promise<VehicleRate[]> {
    try {
      const rates = await storage.get<VehicleRate[]>(storageKeys.vehicleRates);
      return rates || [];
    } catch (error) {
      logger.error('Failed to get local rates', { error });
      return [];
    }
  },

  // Sync local rates with server
  async syncRates(): Promise<void> {
    try {
      const localRates = await this.getLocalRates();

      if (localRates.length === 0) {
        return;
      }

      logger.debug('Syncing vehicle rates with server');

      const response = await apiClient.post<VehicleRate[]>(
        API_ENDPOINTS.vehicles.rates + '/sync',
        { rates: localRates }
      );

      await this.saveRatesLocally(response.data);

      logger.info('Vehicle rates synced successfully');
    } catch (error) {
      logger.error('Failed to sync rates', { error });
    }
  },
};