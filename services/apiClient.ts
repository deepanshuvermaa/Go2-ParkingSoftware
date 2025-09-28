import axios from 'axios';
import Constants from 'expo-constants';
import { Session } from '@/types';

let session: Session | null = null;

const baseURL = Constants.expoConfig?.extra?.apiBaseUrl ?? 'https://api.go2parking.example';

export const apiClient = axios.create({
  baseURL,
  timeout: 15000
});

apiClient.interceptors.request.use(async (config) => {
  if (session?.accessToken) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${session.accessToken}`
    };
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && session?.refreshToken) {
      throw Object.assign(new Error('SessionExpired'), { code: 'SESSION_EXPIRED' });
    }
    return Promise.reject(error);
  }
);

export const setSession = (next: Session | null) => {
  session = next;
};
