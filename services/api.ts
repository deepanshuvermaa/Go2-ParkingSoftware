import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { secureStorage, storageKeys } from '@/utils/storage';
import { logger } from '@/utils/logger';

// Get API URL from environment variable
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://web-production-764e.up.railway.app';

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await secureStorage.get(storageKeys.authToken);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      logger.error('Failed to get auth token', { error });
    }

    logger.debug('API Request', {
      method: config.method,
      url: config.url,
      params: config.params,
    });

    return config;
  },
  (error) => {
    logger.error('Request interceptor error', { error });
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    logger.debug('API Response', {
      url: response.config.url,
      status: response.status,
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    logger.error('API Error', {
      url: originalRequest?.url,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await secureStorage.get(storageKeys.refreshToken);
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;

          await secureStorage.set(storageKeys.authToken, accessToken);
          await secureStorage.set(storageKeys.refreshToken, newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        logger.error('Token refresh failed', { refreshError });
        // Clear tokens and redirect to login
        await secureStorage.remove(storageKeys.authToken);
        await secureStorage.remove(storageKeys.refreshToken);
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints configuration
export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
  },

  // User endpoints
  users: {
    profile: '/api/users/profile',
    update: '/api/users/update',
    list: '/api/users',
  },

  // Parking endpoints (using /tickets not /parking based on backend routes)
  parking: {
    checkIn: '/api/tickets/check-in',
    checkOut: '/api/tickets/check-out',
    tickets: '/api/tickets',
    activeTickets: '/api/tickets/active',
    ticketById: (id: string) => `/api/tickets/${id}`,
    ticketByNumber: (number: string) => `/api/tickets/number/${number}`,
  },

  // Vehicle endpoints (using /pricing based on backend routes)
  vehicles: {
    types: '/api/pricing/vehicle-types',
    rates: '/api/pricing/rates',
    updateRate: '/api/pricing/rates',
  },

  // Report endpoints
  reports: {
    daily: '/api/reports/daily',
    revenue: '/api/reports/revenue',
    summary: '/api/reports/summary',
    export: '/api/reports/export',
  },

  // Location endpoints
  locations: {
    list: '/api/locations',
    byId: (id: string) => `/api/locations/${id}`,
    create: '/api/locations',
    update: (id: string) => `/api/locations/${id}`,
  },
};

export default apiClient;