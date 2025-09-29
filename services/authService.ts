import { Platform } from 'react-native';
import * as Application from 'expo-application';
import { storage, secureStorage, storageKeys } from '@/utils/storage';
import { Role, Session, UserProfile } from '@/types';
import { isoNow } from '@/utils/date';
import { uuid } from '@/utils/uuid';
import { logger } from '@/utils/logger';
import apiClient, { API_ENDPOINTS } from './api';

interface Credentials {
  email: string;
  password: string;
}

interface RegistrationInput {
  name: string;
  email: string;
  password: string;
  role?: Role;
  locationId?: string;
}

interface AuthResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthResult {
  user: UserProfile;
  session: Session;
}

const getDeviceId = async (): Promise<string> => {
  // Use platform-specific device ID
  let deviceId: string;

  if (Platform.OS === 'ios' && Application.getIosIdForVendorAsync) {
    deviceId = (await Application.getIosIdForVendorAsync()) ?? uuid();
  } else if (Platform.OS === 'android' && Application.androidId) {
    deviceId = Application.androidId;
  } else {
    deviceId = uuid();
  }

  return deviceId;
};

const buildSession = async (authResponse: AuthResponse): Promise<Session> => {
  const deviceId = await getDeviceId();
  const issuedAt = isoNow();
  const expiresAt = new Date(Date.now() + authResponse.expiresIn * 1000).toISOString();

  return {
    accessToken: authResponse.accessToken,
    refreshToken: authResponse.refreshToken,
    issuedAt,
    expiresAt,
    deviceId
  };
};

const persistSessionSecrets = async (session: Session) => {
  await secureStorage.set(storageKeys.authToken, session.accessToken);
  await secureStorage.set(storageKeys.refreshToken, session.refreshToken);
};

const persistUserProfile = async (user: UserProfile) => {
  await storage.set(storageKeys.userProfile, user);
};

const clearSession = async () => {
  await secureStorage.remove(storageKeys.authToken);
  await secureStorage.remove(storageKeys.refreshToken);
  await storage.remove(storageKeys.userProfile);
};

export const authService = {
  async login(credentials: Credentials): Promise<AuthResult> {
    try {
      logger.debug('Attempting login', { email: credentials.email });

      const response = await apiClient.post<AuthResponse>(
        API_ENDPOINTS.auth.login,
        {
          email: credentials.email.toLowerCase(),
          password: credentials.password,
          deviceId: await getDeviceId(),
        }
      );

      const authResponse = response.data;
      const session = await buildSession(authResponse);

      // Update lastLoginAt
      const userProfile: UserProfile = {
        ...authResponse.user,
        lastLoginAt: isoNow()
      };

      // Persist auth data
      await persistSessionSecrets(session);
      await persistUserProfile(userProfile);

      logger.info('Login successful', { userId: userProfile.id });

      return { user: userProfile, session };
    } catch (error: any) {
      logger.error('Login failed', { error: error.response?.data || error.message });

      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      } else {
        throw new Error('Login failed. Please try again.');
      }
    }
  },

  async register(input: RegistrationInput): Promise<AuthResult> {
    try {
      logger.debug('Attempting registration', { email: input.email });

      const response = await apiClient.post<AuthResponse>(
        API_ENDPOINTS.auth.register,
        {
          name: input.name,
          email: input.email.toLowerCase(),
          password: input.password,
          role: input.role || 'ATTENDANT',
          locationId: input.locationId || 'lot-01',
          deviceId: await getDeviceId(),
        }
      );

      const authResponse = response.data;
      const session = await buildSession(authResponse);

      const userProfile: UserProfile = {
        ...authResponse.user,
        lastLoginAt: isoNow()
      };

      // Persist auth data
      await persistSessionSecrets(session);
      await persistUserProfile(userProfile);

      logger.info('Registration successful', { userId: userProfile.id });

      return { user: userProfile, session };
    } catch (error: any) {
      logger.error('Registration failed', { error: error.response?.data || error.message });

      if (error.response?.status === 409) {
        throw new Error('An account with this email already exists');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    }
  },

  async refreshToken(): Promise<Session | null> {
    try {
      const refreshToken = await secureStorage.get(storageKeys.refreshToken);
      if (!refreshToken) {
        return null;
      }

      const response = await apiClient.post<AuthResponse>(
        API_ENDPOINTS.auth.refresh,
        {
          refreshToken,
          deviceId: await getDeviceId(),
        }
      );

      const authResponse = response.data;
      const session = await buildSession(authResponse);

      await persistSessionSecrets(session);

      logger.info('Token refreshed successfully');
      return session;
    } catch (error) {
      logger.error('Token refresh failed', { error });
      await clearSession();
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      const token = await secureStorage.get(storageKeys.authToken);
      if (token) {
        // Notify server about logout
        await apiClient.post(API_ENDPOINTS.auth.logout);
      }
    } catch (error) {
      logger.warn('Logout API call failed, continuing with local cleanup', { error });
    } finally {
      await clearSession();
      logger.info('User logged out successfully');
    }
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const profile = await storage.get<UserProfile>(storageKeys.userProfile);
      return profile;
    } catch (error) {
      logger.error('Failed to get current user', { error });
      return null;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await secureStorage.get(storageKeys.authToken);
      return !!token;
    } catch (error) {
      return false;
    }
  },
};