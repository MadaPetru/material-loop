import type { Profile, UserRole } from '@/lib/types';

/**
 * Capability catalog. UI and APIs MUST gate on entitlements, never on role names.
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
  id: UserRole;
  /** Capabilities granted by this role. Edit this list to show/hide features. */
  entitlements: readonly Entitlement[];
};

/**
 * Role → entitlements map (assignment config only).
 * Access checks go through hasEntitlement / can(...), not ROLE_DEFINITIONS directly.
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
export function normalizeRoles(input?: UserRole | UserRole[] | null): UserRole[] {
  const list = Array.isArray(input) ? input : input ? [input] : [];
  const unique = Array.from(new Set(list.filter(Boolean))) as UserRole[];
  return unique.length ? unique : ['user'];
}

/** Union of entitlements from all assigned roles. */
export function resolveEntitlements(roles: UserRole[] | null | undefined): Entitlement[] {
  const set = new Set<Entitlement>();
  for (const role of normalizeRoles(roles)) {
    const def = ROLE_DEFINITIONS[role];
    if (!def) continue;
    for (const e of def.entitlements) set.add(e);
  }
  return Array.from(set);
}

type EntitlementSubject =
  | UserRole[]
  | Pick<Profile, 'roles' | 'deactivatedAt'>
  | null
  | undefined;

function subjectRoles(subject: EntitlementSubject): UserRole[] {
  if (!subject) return [];
  if (Array.isArray(subject)) return normalizeRoles(subject);
  if (subject.deactivatedAt) return [];
  return normalizeRoles(subject.roles);
}

/** RBAC access check — use this (or `can(...)` from Auth) everywhere. */
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

/** API guard: throws if the subject lacks the entitlement. */
export function assertEntitlement(
  subject: EntitlementSubject,
  entitlement: Entitlement,
  message = 'Acces interzis. Îți lipsește dreptul necesar.',
): asserts subject is NonNullable<EntitlementSubject> {
  if (!hasEntitlement(subject, entitlement)) {
    throw new Error(message);
  }
}

/**
 * Role mutation helper (admin tools). This changes roles so entitlements change.
 * Never use this for access checks — use hasEntitlement / can(...).
 */
export function rolesWithAdmin(enabled: boolean, current?: UserRole[]): UserRole[] {
  if (enabled) return normalizeRoles([...(current ?? []), 'user', 'admin']);
  return ['user'];
}
