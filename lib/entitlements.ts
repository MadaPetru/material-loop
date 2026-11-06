import type { Profile, UserRole } from '@/lib/types';

/**
 * Capability catalog. UI and APIs should gate on entitlements, not role names.
 * Add a new entitlement here, then attach it to one or more roles in ROLE_DEFINITIONS.
 */
export const ENTITLEMENTS = [
  'app.access',
  'listings.create',
  'listings.manage_own',
  'messages.use',
  'favorites.use',
  'profile.edit',
  'admin.panel',
  'admin.users.read',
  'admin.users.manage',
  'admin.users.email',
  'admin.analytics',
] as const;

export type Entitlement = (typeof ENTITLEMENTS)[number];

export type RoleDefinition = {
  /** Primary display / backward-compat role key. */
  id: UserRole;
  /** Capabilities granted by this role. Edit this list to show/hide features. */
  entitlements: readonly Entitlement[];
};

/**
 * Single place to configure what each role can do.
 * Want a role to see a button? Add the entitlement here (and gate the button with `can(...)`).
 */
export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  user: {
    id: 'user',
    entitlements: [
      'app.access',
      'listings.create',
      'listings.manage_own',
      'messages.use',
      'favorites.use',
      'profile.edit',
    ],
  },
  admin: {
    id: 'admin',
    entitlements: [
      'app.access',
      'listings.create',
      'listings.manage_own',
      'messages.use',
      'favorites.use',
      'profile.edit',
      'admin.panel',
      'admin.users.read',
      'admin.users.manage',
      'admin.users.email',
      'admin.analytics',
    ],
  },
};

/** Normalize one or many roles; always returns at least `user` when empty. */
export function normalizeRoles(
  input?: UserRole | UserRole[] | null,
  fallbackPrimary?: UserRole | null,
): UserRole[] {
  const list = Array.isArray(input) ? input : input ? [input] : [];
  const withFallback =
    list.length > 0 ? list : fallbackPrimary ? [fallbackPrimary] : (['user'] as UserRole[]);
  const unique = Array.from(new Set(withFallback.filter(Boolean))) as UserRole[];
  return unique.length ? unique : ['user'];
}

/** Primary role for legacy fields / labels: prefer admin when present. */
export function primaryRole(roles: UserRole[]): UserRole {
  if (roles.includes('admin')) return 'admin';
  return roles[0] ?? 'user';
}

/** Union of entitlements from all assigned roles (multi-role ready). */
export function resolveEntitlements(roles: UserRole[]): Entitlement[] {
  const set = new Set<Entitlement>();
  for (const role of normalizeRoles(roles)) {
    const def = ROLE_DEFINITIONS[role];
    if (!def) continue;
    for (const e of def.entitlements) set.add(e);
  }
  return Array.from(set);
}

export function entitlementsForRole(role: UserRole | null | undefined): readonly Entitlement[] {
  if (!role) return ROLE_DEFINITIONS.user.entitlements;
  return ROLE_DEFINITIONS[role]?.entitlements ?? ROLE_DEFINITIONS.user.entitlements;
}

type EntitlementSubject =
  | UserRole
  | UserRole[]
  | Pick<Profile, 'role' | 'roles' | 'deactivatedAt'>
  | null
  | undefined;

function subjectRoles(subject: EntitlementSubject): UserRole[] {
  if (!subject) return [];
  if (typeof subject === 'string') return normalizeRoles(subject);
  if (Array.isArray(subject)) return normalizeRoles(subject);
  if (subject.deactivatedAt) return [];
  return normalizeRoles(subject.roles, subject.role);
}

export function hasEntitlement(subject: EntitlementSubject, entitlement: Entitlement): boolean {
  return resolveEntitlements(subjectRoles(subject)).includes(entitlement);
}

export function hasAnyEntitlement(
  subject: EntitlementSubject,
  entitlements: readonly Entitlement[],
): boolean {
  const granted = new Set(resolveEntitlements(subjectRoles(subject)));
  return entitlements.some((e) => granted.has(e));
}

export function hasAllEntitlements(
  subject: EntitlementSubject,
  entitlements: readonly Entitlement[],
): boolean {
  const granted = new Set(resolveEntitlements(subjectRoles(subject)));
  return entitlements.every((e) => granted.has(e));
}

/** Convenience: admin panel access. Prefer `can('admin.panel')` in UI. */
export function isAdmin(subject: EntitlementSubject) {
  return hasEntitlement(subject, 'admin.panel');
}

/** Build roles array when promoting / demoting via admin tools. */
export function rolesAfterPrimaryChange(nextPrimary: UserRole, current?: UserRole[]): UserRole[] {
  if (nextPrimary === 'admin') {
    return normalizeRoles([...(current ?? []), 'admin', 'user']);
  }
  return ['user'];
}
