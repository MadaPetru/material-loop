import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { marketplace } from '@/lib/api/marketplace';
import type { Profile } from '@/lib/types';

type AuthContextValue = {
  user: Profile | null;
  loading: boolean;
  isDemo: boolean;
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const session = await marketplace.getSession();
    setUser(session);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isDemo: marketplace.isDemo,
      refresh,
      signIn: async (email, password) => {
        const profile = await marketplace.signIn(email, password);
        setUser(profile);
      },
      signUp: async (email, password, displayName) => {
        const profile = await marketplace.signUp(email, password, displayName);
        setUser(profile);
      },
      signOut: async () => {
        await marketplace.signOut();
        setUser(null);
      },
      updateProfile: async (patch) => {
        if (!user) return;
        const next = await marketplace.updateProfile(user.id, patch);
        setUser(next);
      },
    }),
    [user, loading, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
