/**
 * Operator identity for privacy / terms pages.
 * Google Play / App Store require real legal identity — fill placeholders before submit.
 */
export const LEGAL_OPERATOR = {
  appName: 'MaterialLoop',
  /** Legal entity name — replace before going public. */
  companyName: '[Company legal name]',
  /** Romanian company ID (CUI) — replace before going public. */
  cui: '[CUI]',
  /** Registered office — replace before going public. */
  address: '[Registered office address]',
  /** GDPR / privacy requests (also used as Play Console contact). */
  privacyEmail: 'mada.petru@digitalexplorer.ro',
  /** Country of establishment. */
  country: 'România',
  /** Last content review date (ISO date, display as-is in docs). */
  lastUpdated: '2026-11-08',
} as const;

/** True when company identity is no longer placeholder text. */
export function isLegalOperatorComplete() {
  return ![LEGAL_OPERATOR.companyName, LEGAL_OPERATOR.cui, LEGAL_OPERATOR.address].some((v) =>
    v.includes('[')
  );
}
