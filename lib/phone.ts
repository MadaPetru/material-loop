/** Romanian mobile numbers → E.164 (+40…). */

const RO_MOBILE = /^(?:\+?40|0)?7\d{8}$/;

export function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

/** Normalize user input to +40XXXXXXXXX or null if invalid. */
export function normalizeRoPhone(input: string): string | null {
  const raw = input.trim().replace(/[\s.-]/g, '');
  if (!raw) return null;
  const digits = digitsOnly(raw.startsWith('+') ? raw.slice(1) : raw);
  let national = digits;
  if (national.startsWith('40')) national = national.slice(2);
  if (national.startsWith('0')) national = national.slice(1);
  if (!/^7\d{8}$/.test(national)) return null;
  return `+40${national}`;
}

export function isValidRoPhone(input: string) {
  return normalizeRoPhone(input) != null && RO_MOBILE.test(input.trim().replace(/[\s.-]/g, ''));
}

/** Display-friendly form: 07xx xxx xxx */
export function formatRoPhoneDisplay(e164: string) {
  const normalized = normalizeRoPhone(e164);
  if (!normalized) return e164;
  const local = `0${normalized.slice(3)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}
