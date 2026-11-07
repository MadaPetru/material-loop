import type { Profile, RoleDefinition, UserRole } from '@/lib/types';

/**
 * Capability catalog. UI and APIs MUST gate on entitlements, never on role names.
 * Entitlement IDs are fixed in code — admin only links them to DB roles.
 *
 * Prefer action-specific IDs (`listings.edit_own`, `messages.send`, …).
 * Coarse legacy IDs still expand when loaded from older role rows.
 */
export const ENTITLEMENTS = [
  // App
  'app.access',

  // Listings
  'listings.create',
  'listings.edit_own',
  'listings.status_own',
  'listings.delete_own',
  'listings.read_own',

  // Favorites
  'favorites.read',
  'favorites.write',

  // Messages
  'messages.read',
  'messages.send',
  'messages.start',

  // Profile / account
  'profile.edit',
  'profile.phone',
  'account.delete',

  // Admin
  'admin.panel',
  'admin.users.read',
  'admin.users.roles',
  'admin.users.deactivate',
  'admin.users.email',
  'admin.analytics',
  'admin.roles.read',
  'admin.roles.write',
  'admin.roles.delete',

  // Marketing
  'marketing.panel',
  'marketing.ads.read',
  'marketing.ads.write',
  'marketing.ads.delete',
  'marketing.email',
] as const;

export type Entitlement = (typeof ENTITLEMENTS)[number];

export const ENTITLEMENT_SET = new Set<string>(ENTITLEMENTS);

/**
 * Older coarse entitlement IDs → current action-specific ones.
 * Applied when loading roles from DB / demo storage so existing rows keep working.
 */
export const LEGACY_ENTITLEMENT_EXPANSIONS: Record<string, readonly Entitlement[]> = {
  'listings.manage_own': [
    'listings.edit_own',
    'listings.status_own',
    'listings.delete_own',
    'listings.read_own',
  ],
  'favorites.use': ['favorites.read', 'favorites.write'],
  'messages.use': ['messages.read', 'messages.send', 'messages.start'],
  'admin.users.manage': ['admin.users.roles', 'admin.users.deactivate'],
  'admin.roles.manage': ['admin.roles.read', 'admin.roles.write', 'admin.roles.delete'],
  'marketing.ads': ['marketing.ads.read', 'marketing.ads.write', 'marketing.ads.delete'],
};

export const ENTITLEMENT_GROUPS: { id: string; entitlements: readonly Entitlement[] }[] = [
  {
    id: 'app',
    entitlements: ['app.access'],
  },
  {
    id: 'listings',
    entitlements: [
      'listings.create',
      'listings.edit_own',
      'listings.status_own',
      'listings.delete_own',
      'listings.read_own',
    ],
  },
  {
    id: 'engagement',
    entitlements: [
      'favorites.read',
      'favorites.write',
      'messages.read',
      'messages.send',
      'messages.start',
    ],
  },
  {
    id: 'profile',
    entitlements: ['profile.edit', 'profile.phone', 'account.delete'],
  },
  {
    id: 'admin',
    entitlements: [
      'admin.panel',
      'admin.users.read',
      'admin.users.roles',
      'admin.users.deactivate',
      'admin.users.email',
      'admin.analytics',
      'admin.roles.read',
      'admin.roles.write',
      'admin.roles.delete',
    ],
  },
  {
    id: 'marketing',
    entitlements: [
      'marketing.panel',
      'marketing.ads.read',
      'marketing.ads.write',
      'marketing.ads.delete',
      'marketing.email',
    ],
  },
];

/** Default marketplace member capabilities. */
export const USER_ENTITLEMENTS: Entitlement[] = [
  'app.access',
  'listings.create',
  'listings.edit_own',
  'listings.status_own',
  'listings.delete_own',
  'listings.read_own',
  'favorites.read',
  'favorites.write',
  'messages.read',
  'messages.send',
  'messages.start',
  'profile.edit',
  'profile.phone',
  'account.delete',
];

/** Full administration + marketplace member. */
export const ADMIN_ENTITLEMENTS: Entitlement[] = [
  ...USER_ENTITLEMENTS,
  'admin.panel',
  'admin.users.read',
  'admin.users.roles',
  'admin.users.deactivate',
  'admin.users.email',
  'admin.analytics',
  'admin.roles.read',
  'admin.roles.write',
  'admin.roles.delete',
  'marketing.panel',
  'marketing.ads.read',
  'marketing.ads.write',
  'marketing.ads.delete',
  'marketing.email',
];

/** Ads + outreach (read users for recipient lists). */
export const MARKETING_ENTITLEMENTS: Entitlement[] = [
  'app.access',
  'admin.users.read',
  'admin.users.email',
  'marketing.panel',
  'marketing.ads.read',
  'marketing.ads.write',
  'marketing.ads.delete',
  'marketing.email',
];

/** Built-in seed used before/without DB catalog (demo + fallback). */
export const DEFAULT_ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    id: 'user',
    label: 'User',
    description: 'Default marketplace member',
    entitlements: [...USER_ENTITLEMENTS],
    system: true,
  },
  {
    id: 'admin',
    label: 'Admin',
    description: 'Full administration',
    entitlements: [...ADMIN_ENTITLEMENTS],
    system: true,
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description: 'Ads and outreach',
    entitlements: [...MARKETING_ENTITLEMENTS],
    system: false,
  },
];

/** @deprecated Prefer getRoleDefinitions() — kept for migration seed references. */
export const ROLE_DEFINITIONS: Record<string, RoleDefinition> = Object.fromEntries(
  DEFAULT_ROLE_DEFINITIONS.map((r) => [r.id, r]),
);

const ROLE_SLUG = /^[a-z][a-z0-9_-]*$/;

let roleCatalog: RoleDefinition[] = DEFAULT_ROLE_DEFINITIONS.map((r) => ({
  ...r,
  entitlements: [...r.entitlements],
}));

export function getRoleDefinitions(): RoleDefinition[] {
  return roleCatalog;
}

export function getRoleDefinition(id: string): RoleDefinition | undefined {
  return roleCatalog.find((r) => r.id === id);
}

/** Replace in-memory role → entitlements map (from DB or demo). */
export function setRoleDefinitions(roles: RoleDefinition[]) {
  if (!roles.length) {
    roleCatalog = DEFAULT_ROLE_DEFINITIONS.map((r) => ({
      ...r,
      entitlements: [...r.entitlements],
    }));
    return;
  }
  roleCatalog = roles.map((r) => ({
    ...r,
    entitlements: filterKnownEntitlements(r.entitlements),
  }));
}

/** Expand legacy coarse IDs, then keep only catalog entitlements. */
export function filterKnownEntitlements(raw: readonly string[] | null | undefined): Entitlement[] {
  const list = raw ?? [];
  const out = new Set<Entitlement>();
  for (const item of list) {
    if (ENTITLEMENT_SET.has(item)) {
      out.add(item as Entitlement);
    }
    const expanded = LEGACY_ENTITLEMENT_EXPANSIONS[item];
    if (expanded) {
      for (const e of expanded) out.add(e);
    }
  }
  return Array.from(out);
}

export function isValidRoleSlug(id: string): boolean {
  return ROLE_SLUG.test(id);
}

/** Normalize one or many roles; always returns at least `user` when empty. */
export function normalizeRoles(input?: UserRole | UserRole[] | null): UserRole[] {
  const list = Array.isArray(input) ? input : input ? [input] : [];
  const unique = Array.from(
    new Set(
      list
        .map((r) => String(r || '').trim().toLowerCase())
        .filter((r) => r && isValidRoleSlug(r)),
    ),
  );
  return unique.length ? unique : ['user'];
}

/**
 * Parse roles from DB / API (array, `{user,admin}`, JSON string, comma-separated).
 */
export function parseRolesInput(raw: unknown): UserRole[] {
  if (raw == null) return ['user'];
  if (Array.isArray(raw)) return normalizeRoles(raw as UserRole[]);
  if (typeof raw !== 'string') return ['user'];

  const trimmed = raw.trim();
  if (!trimmed) return ['user'];

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return normalizeRoles(
      trimmed
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^"|"$/g, ''))
        .filter(Boolean),
    );
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) return normalizeRoles(parsed as UserRole[]);
  } catch {
    /* not JSON */
  }

  return normalizeRoles(trimmed.split(',').map((s) => s.trim()).filter(Boolean));
}

/** Union of entitlements from all assigned roles (via current catalog). */
export function resolveEntitlements(roles: UserRole[] | null | undefined): Entitlement[] {
  const set = new Set<Entitlement>();
  for (const role of normalizeRoles(roles)) {
    const def = getRoleDefinition(role);
    if (!def) continue;
    for (const e of filterKnownEntitlements(def.entitlements)) set.add(e);
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

/** API guard: throws if the subject lacks every listed entitlement. */
export function assertAnyEntitlement(
  subject: EntitlementSubject,
  entitlements: readonly Entitlement[],
  message = 'Acces interzis. Îți lipsește dreptul necesar.',
): asserts subject is NonNullable<EntitlementSubject> {
  if (!hasAnyEntitlement(subject, entitlements)) {
    throw new Error(message);
  }
}
