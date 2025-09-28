import * as Application from 'expo-application';
import { storage, secureStorage, storageKeys } from '@/utils/storage';
import { Role, Session, UserProfile } from '@/types';
import { isoNow } from '@/utils/date';
import { uuid } from '@/utils/uuid';
import { logger } from '@/utils/logger';

interface UserRecord extends UserProfile {
  password: string;
}

interface Credentials {
  email: string;
  password: string;
}

interface RegistrationInput extends Credentials {
  name: string;
  role?: Role;
}

interface AuthResult {
  user: UserProfile;
  session: Session;
}

const USERS_KEY = 'go2.auth.users';

const defaultUsers: UserRecord[] = [
  {
    id: 'usr-owner',
    name: 'Lot Owner',
    email: 'owner@go2parking.com',
    password: 'Owner@123',
    role: 'OWNER',
    locationId: 'hq',
    lastLoginAt: isoNow()
  },
  {
    id: 'usr-manager',
    name: 'Site Manager',
    email: 'manager@go2parking.com',
    password: 'Manager@123',
    role: 'MANAGER',
    locationId: 'lot-01',
    lastLoginAt: isoNow()
  },
  {
    id: 'usr-attendant',
    name: 'Attendant',
    email: 'attendant@go2parking.com',
    password: 'Attendant@123',
    role: 'ATTENDANT',
    locationId: 'lot-01',
    lastLoginAt: isoNow()
  }
];

let cachedUsers: UserRecord[] | null = null;

const ensureUsersLoaded = async () => {
  if (cachedUsers) {
    return cachedUsers;
  }
  const storedUsers = await storage.get<UserRecord[]>(USERS_KEY);
  cachedUsers = storedUsers?.length ? storedUsers : defaultUsers;
  if (!storedUsers?.length) {
    await storage.set(USERS_KEY, cachedUsers);
  }
  return cachedUsers;
};

const persistUsers = async (users: UserRecord[]) => {
  cachedUsers = users;
  await storage.set(USERS_KEY, users);
};

const buildSession = async (): Promise<Session> => {
  const deviceId = Application.getIosIdForVendorAsync
    ? (await Application.getIosIdForVendorAsync()) ?? uuid()
    : Application.androidId ?? uuid();

  const issuedAt = isoNow();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString();

  return {
    accessToken: uuid(),
    refreshToken: uuid(),
    issuedAt,
    expiresAt,
    deviceId
  };
};

const persistSessionSecrets = async (session: Session) => {
  await secureStorage.set(storageKeys.authToken, session.accessToken);
  await secureStorage.set(storageKeys.refreshToken, session.refreshToken);
};

export const authService = {
  async login(credentials: Credentials): Promise<AuthResult> {
    const users = await ensureUsersLoaded();
    const record = users.find((user) => user.email.toLowerCase() === credentials.email.toLowerCase());

    if (!record || record.password !== credentials.password) {
      throw new Error('Invalid credentials provided.');
    }

    const session = await buildSession();

    const profile: UserProfile = {
      id: record.id,
      name: record.name,
      email: record.email,
      role: record.role,
      locationId: record.locationId,
      lastLoginAt: isoNow()
    };

    await persistSessionSecrets(session);

    return { user: profile, session };
  },

  async register(input: RegistrationInput): Promise<AuthResult> {
    const users = await ensureUsersLoaded();
    const existing = users.find((user) => user.email.toLowerCase() === input.email.toLowerCase());

    if (existing) {
      throw new Error('Account already exists for this email.');
    }

    const newUser: UserRecord = {
      id: uuid(),
      name: input.name,
      email: input.email.toLowerCase(),
      password: input.password,
      role: input.role ?? 'ATTENDANT',
      locationId: 'lot-01',
      lastLoginAt: isoNow()
    };

    const nextUsers = [...users, newUser];
    await persistUsers(nextUsers);

    const session = await buildSession();

    const profile: UserProfile = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      locationId: newUser.locationId,
      lastLoginAt: isoNow()
    };

    await persistSessionSecrets(session);

    return { user: profile, session };
  },

  async refresh(prev: Session): Promise<Session> {
    if (new Date(prev.expiresAt).getTime() < Date.now()) {
      logger.info('Refreshing session due to expiry');
    }
    const next = await buildSession();
    await persistSessionSecrets(next);
    return next;
  },

  async loadProfile(email: string): Promise<UserProfile | null> {
    const users = await ensureUsersLoaded();
    const record = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
    if (!record) {
      return null;
    }
    return {
      id: record.id,
      name: record.name,
      email: record.email,
      role: record.role,
      locationId: record.locationId,
      lastLoginAt: record.lastLoginAt
    };
  },

  async logout() {
    await secureStorage.delete(storageKeys.authToken);
    await secureStorage.delete(storageKeys.refreshToken);
  }
};
