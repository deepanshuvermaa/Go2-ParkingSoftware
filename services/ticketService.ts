import { ParkingTicket, VehicleType, PaymentMethod, VehicleRate } from '@/types';
import { isoNow } from '@/utils/date';
import { logger } from '@/utils/logger';
import apiClient, { API_ENDPOINTS } from './api';
import { vehicleService } from './vehicleService';

interface CheckInRequest {
  vehicleNumber: string;
  vehicleType: VehicleType;
  driverName?: string;
  phoneNumber?: string;
  locationId?: string;
}

interface CheckOutRequest {
  ticketNumber: string;
  paymentMethod: PaymentMethod;
  amount?: number;
}

interface TicketsResponse {
  tickets: ParkingTicket[];
  total: number;
  page: number;
  pageSize: number;
}

export const ticketService = {
  async checkIn(data: CheckInRequest): Promise<ParkingTicket> {
    try {
      logger.debug('Creating check-in ticket', data);

      const response = await apiClient.post<ParkingTicket>(
        API_ENDPOINTS.parking.checkIn,
        {
          ...data,
          vehicleNumber: data.vehicleNumber.toUpperCase(),
          entryTime: isoNow(),
        }
      );

      logger.info('Check-in successful', {
        ticketNumber: response.data.ticketNumber,
        vehicleNumber: data.vehicleNumber
      });

      return response.data;
    } catch (error: any) {
      logger.error('Check-in failed', { error: error.response?.data || error.message });

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      } else {
        throw new Error('Failed to create check-in ticket. Please try again.');
      }
    }
  },

  async checkOut(data: CheckOutRequest): Promise<ParkingTicket> {
    try {
      logger.debug('Processing check-out', data);

      const response = await apiClient.post<ParkingTicket>(
        API_ENDPOINTS.parking.checkOut,
        {
          ...data,
          exitTime: isoNow(),
        }
      );

      logger.info('Check-out successful', {
        ticketNumber: data.ticketNumber,
        amount: response.data.amount
      });

      return response.data;
    } catch (error: any) {
      logger.error('Check-out failed', { error: error.response?.data || error.message });

      if (error.response?.status === 404) {
        throw new Error('Ticket not found. Please check the ticket number.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      } else {
        throw new Error('Failed to process check-out. Please try again.');
      }
    }
  },

  async getActiveTickets(locationId?: string): Promise<ParkingTicket[]> {
    try {
      logger.debug('Fetching active tickets', { locationId });

      const response = await apiClient.get<ParkingTicket[]>(
        API_ENDPOINTS.parking.activeTickets,
        {
          params: { locationId }
        }
      );

      logger.info('Active tickets fetched', { count: response.data.length });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to fetch active tickets', { error: error.response?.data || error.message });

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        // Return empty array if offline
        return [];
      }
      throw new Error('Failed to fetch active tickets');
    }
  },

  async getAllTickets(params?: {
    page?: number;
    pageSize?: number;
    locationId?: string;
    startDate?: string;
    endDate?: string;
    status?: 'active' | 'completed';
  }): Promise<TicketsResponse> {
    try {
      logger.debug('Fetching all tickets', params);

      const response = await apiClient.get<TicketsResponse>(
        API_ENDPOINTS.parking.tickets,
        {
          params: {
            page: params?.page || 1,
            pageSize: params?.pageSize || 50,
            ...params
          }
        }
      );

      logger.info('Tickets fetched', {
        total: response.data.total,
        page: response.data.page
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to fetch tickets', { error: error.response?.data || error.message });

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        // Return empty response if offline
        return {
          tickets: [],
          total: 0,
          page: 1,
          pageSize: 50
        };
      }
      throw new Error('Failed to fetch tickets');
    }
  },

  async getTicketByNumber(ticketNumber: string): Promise<ParkingTicket | null> {
    try {
      logger.debug('Fetching ticket by number', { ticketNumber });

      const response = await apiClient.get<ParkingTicket>(
        API_ENDPOINTS.parking.ticketByNumber(ticketNumber)
      );

      logger.info('Ticket fetched', { ticketNumber });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to fetch ticket', { error: error.response?.data || error.message });

      if (error.response?.status === 404) {
        return null;
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      } else {
        throw new Error('Failed to fetch ticket details');
      }
    }
  },

  async getTicketById(id: string): Promise<ParkingTicket | null> {
    try {
      logger.debug('Fetching ticket by ID', { id });

      const response = await apiClient.get<ParkingTicket>(
        API_ENDPOINTS.parking.ticketById(id)
      );

      logger.info('Ticket fetched', { id });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to fetch ticket', { error: error.response?.data || error.message });

      if (error.response?.status === 404) {
        return null;
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      } else {
        throw new Error('Failed to fetch ticket details');
      }
    }
  },

  async searchTickets(query: string): Promise<ParkingTicket[]> {
    try {
      logger.debug('Searching tickets', { query });

      const response = await apiClient.get<ParkingTicket[]>(
        API_ENDPOINTS.parking.tickets,
        {
          params: {
            search: query,
            pageSize: 20
          }
        }
      );

      logger.info('Search results', { count: response.data.length });
      return response.data;
    } catch (error: any) {
      logger.error('Search failed', { error: error.response?.data || error.message });

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return [];
      }
      throw new Error('Search failed');
    }
  },

  // Calculate parking fee based on duration and vehicle type
  async calculateFee(ticket: ParkingTicket): Promise<number> {
    if (!ticket.exitTime) {
      // Calculate current fee for active tickets
      const now = new Date();
      const entryTime = new Date(ticket.entryTime);

      // Get vehicle rates from service
      const rates = await vehicleService.fetchVehicleRates();
      const calculation = vehicleService.calculateParkingFee(
        ticket.vehicleType,
        entryTime,
        now,
        rates
      );

      return calculation.totalAmount;
    }

    // Return the already calculated amount for completed tickets
    return ticket.amount || 0;
  },

  // Calculate lost ticket fee
  async calculateLostTicketFee(vehicleType: VehicleType): Promise<number> {
    const rates = await vehicleService.fetchVehicleRates();
    return vehicleService.getLostTicketFee(vehicleType, rates);
  },

  // Get parking duration in human-readable format
  getParkingDuration(ticket: ParkingTicket): string {
    const entryTime = new Date(ticket.entryTime);
    const exitTime = ticket.exitTime ? new Date(ticket.exitTime) : new Date();

    const diffMs = exitTime.getTime() - entryTime.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours === 0) {
      return `${minutes} min`;
    } else if (minutes === 0) {
      return `${hours} hr`;
    } else {
      return `${hours} hr ${minutes} min`;
    }
  },

  // Get fee breakdown for a ticket
  async getFeeBreakdown(ticket: ParkingTicket): Promise<any> {
    const entryTime = new Date(ticket.entryTime);
    const exitTime = ticket.exitTime ? new Date(ticket.exitTime) : new Date();

    const rates = await vehicleService.fetchVehicleRates();
    const calculation = vehicleService.calculateParkingFee(
      ticket.vehicleType,
      entryTime,
      exitTime,
      rates
    );

    return calculation;
  },
};