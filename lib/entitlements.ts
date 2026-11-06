import type { Profile, UserRole } from '@/lib/types';

/** Capabilities the app can gate on. */
export type Entitlement =
  | 'app.access'
  | 'admin.panel'
  | 'admin.users.read'
  | 'admin.users.manage'
  | 'admin.users.email'
  | 'admin.analytics';

const ROLE_ENTITLEMENTS: Record<UserRole, readonly Entitlement[]> = {
  user: ['app.access'],
  admin: [
    'app.access',
    'admin.panel',
    'admin.users.read',
    'admin.users.manage',
    'admin.users.email',
    'admin.analytics',
  ],
};

export function entitlementsForRole(role: UserRole | null | undefined): readonly Entitlement[] {
  if (!role) return [];
  return ROLE_ENTITLEMENTS[role] ?? ROLE_ENTITLEMENTS.user;
}

export function hasEntitlement(
  roleOrProfile: UserRole | Profile | null | undefined,
  entitlement: Entitlement,
): boolean {
  const role =
    typeof roleOrProfile === 'string'
      ? roleOrProfile
      : roleOrProfile && 'role' in roleOrProfile
        ? roleOrProfile.role
        : null;
  if (roleOrProfile && typeof roleOrProfile === 'object' && roleOrProfile.deactivatedAt) {
    return false;
  }
  return entitlementsForRole(role).includes(entitlement);
}

export function isAdmin(roleOrProfile: UserRole | Profile | null | undefined) {
  return hasEntitlement(roleOrProfile, 'admin.panel');
}
