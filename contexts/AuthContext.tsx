import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { marketplace } from '@/lib/api/marketplace';
import {
  hasAllEntitlements,
  hasAnyEntitlement,
  hasEntitlement,
  resolveEntitlements,
  type Entitlement,
} from '@/lib/entitlements';
import { getSupabase } from '@/lib/supabase';
import { IS_DEMO } from '@/lib/config';
import type { Profile } from '@/lib/types';

type AuthContextValue = {
  user: Profile | null;
  loading: boolean;
  isDemo: boolean;
  /** Effective entitlements for the signed-in user (union of role entitlements). */
  entitlements: Entitlement[];
  /**
   * RBAC gate — check entitlements, never roles:
   * `can('admin.panel')`, `can('listings.create')`, …
   */
  can: (entitlement: Entitlement) => boolean;
  canAny: (entitlements: readonly Entitlement[]) => boolean;
  canAll: (entitlements: readonly Entitlement[]) => boolean;
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  /** Returns null on web while the browser redirects to Google. */
  signInWithGoogle: () => Promise<Profile | null>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  requestPhoneVerification: (phone: string) => Promise<{ phone: string; demoCode?: string }>;
  confirmPhoneVerification: (phone: string, token: string) => Promise<void>;
  clearPhone: () => Promise<void>;
  deleteAccount: () => Promise<void>;
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
    let mounted = true;
    refresh()
      .catch(() => {
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    if (IS_DEMO) {
      return () => {
        mounted = false;
      };
    }

    const sb = getSupabase();
    if (!sb) {
      return () => {
        mounted = false;
      };
    }

    const { data: sub } = sb.auth.onAuthStateChange(async (event) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') {
        setUser(null);
        return;
      }
      try {
        const session = await marketplace.getSession();
        if (mounted) setUser(session);
      } catch {
        if (mounted) setUser(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [refresh]);

  const entitlements = useMemo(
    () => (user ? resolveEntitlements(user.roles) : []),
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isDemo: marketplace.isDemo,
      entitlements,
      can: (entitlement) => hasEntitlement(user, entitlement),
      canAny: (list) => hasAnyEntitlement(user, list),
      canAll: (list) => hasAllEntitlements(user, list),
      refresh,
      signIn: async (email, password) => {
        const profile = await marketplace.signIn(email, password);
        setUser(profile);
      },
      signUp: async (email, password, displayName) => {
        const profile = await marketplace.signUp(email, password, displayName);
        setUser(profile);
      },
      signInWithGoogle: async () => {
        const profile = await marketplace.signInWithGoogle();
        if (profile) setUser(profile);
        return profile;
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
      requestPhoneVerification: async (phone) => {
        if (!user) throw new Error('Autentifică-te din nou.');
        return marketplace.requestPhoneVerification(user.id, phone);
      },
      confirmPhoneVerification: async (phone, token) => {
        if (!user) throw new Error('Autentifică-te din nou.');
        const next = await marketplace.confirmPhoneVerification(user.id, phone, token);
        setUser(next);
      },
      clearPhone: async () => {
        if (!user) return;
        const next = await marketplace.clearPhone(user.id);
        setUser(next);
      },
      deleteAccount: async () => {
        if (!user) throw new Error('Autentifică-te din nou.');
        await marketplace.deleteAccount(user.id);
        setUser(null);
      },
    }),
    [user, loading, refresh, entitlements],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
