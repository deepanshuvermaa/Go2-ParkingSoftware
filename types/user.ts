export type Role = 'OWNER' | 'MANAGER' | 'ATTENDANT';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  locationId: string;
  lastLoginAt?: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  issuedAt: string;
  deviceId: string;
}
