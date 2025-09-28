import { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { authService } from '@/services/authService';
import { storage, storageKeys } from '@/utils/storage';
import { Role, Session, UserProfile } from '@/types';
import { logger } from '@/utils/logger';
import { setSession as setApiSession } from '@/services/apiClient';

interface AuthContextValue {
  user: UserProfile | null;
  session: Session | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [storedUser, storedSession] = await Promise.all([
          storage.get<UserProfile>(storageKeys.userProfile),
          storage.get<Session>(storageKeys.session)
        ]);

        if (storedUser && storedSession) {
          setUser(storedUser);
          setSession(storedSession);
          setApiSession(storedSession);
        }
      } catch (error) {
        logger.error('Failed to restore auth state', { error });
      } finally {
        setInitializing(false);
      }
    };

    bootstrap();
  }, []);

  const persist = useCallback(async (nextUser: UserProfile, nextSession: Session) => {
    setUser(nextUser);
    setSession(nextSession);
    setApiSession(nextSession);
    await Promise.all([
      storage.set(storageKeys.userProfile, nextUser),
      storage.set(storageKeys.session, nextSession)
    ]);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: profile, session: sessionPayload } = await authService.login({ email, password });
    await persist(profile, sessionPayload);
  }, [persist]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { user: profile, session: sessionPayload } = await authService.register({ name, email, password });
    await persist(profile, sessionPayload);
  }, [persist]);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setSession(null);
    setApiSession(null);
    await Promise.all([
      storage.remove(storageKeys.userProfile),
      storage.remove(storageKeys.session)
    ]);
  }, []);

  const refresh = useCallback(async () => {
    if (!session || !user) {
      return;
    }
    const nextSession = await authService.refresh(session);
    await persist(user, nextSession);
  }, [persist, session, user]);

  const hasRole = useCallback((...roles: Role[]) => {
    if (!user) {
      return false;
    }
    if (roles.includes('OWNER')) {
      return user.role === 'OWNER';
    }
    return roles.includes(user.role) || user.role === 'OWNER';
  }, [user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    initializing,
    login,
    register,
    logout,
    refresh,
    hasRole
  }), [user, session, initializing, login, register, logout, refresh, hasRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
