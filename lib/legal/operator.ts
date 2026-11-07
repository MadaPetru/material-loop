/**
 * Operator identity for privacy / terms pages.
 * Fill the bracketed placeholders before a public launch.
 */
export const LEGAL_OPERATOR = {
  appName: 'MaterialLoop',
  /** Legal entity name — replace before going public. */
  companyName: '[Company legal name]',
  /** Romanian company ID (CUI) — replace before going public. */
  cui: '[CUI]',
  /** Registered office — replace before going public. */
  address: '[Registered office address]',
  /** GDPR / privacy requests. */
  privacyEmail: 'contact@materialloop.ro',
  /** Country of establishment. */
  country: 'România',
  /** Last content review date (ISO date, display as-is in docs). */
  lastUpdated: '2026-11-07',
} as const;
