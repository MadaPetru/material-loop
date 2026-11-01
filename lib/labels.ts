import type { MeasurementUnit, ProductCondition, ListingStatus } from './types';

export const conditionLabels: Record<ProductCondition, string> = {
  new_unopened: 'Nou, neatins',
  new_opened: 'Nou, ambalaj deschis',
  partially_used: 'Parțial folosit',
  used_reclaimed: 'Folosit / recuperat',
};

export const unitLabels: Record<MeasurementUnit, string> = {
  bag: 'saci',
  piece: 'bucăți',
  m: 'metri liniari',
  m2: 'm²',
  m3: 'm³',
  kg: 'kg',
  l: 'litri',
  bucket: 'găleți',
  board: 'plăci',
  other: 'unități',
};

export const statusLabels: Record<ListingStatus, string> = {
  draft: 'Ciornă',
  active: 'Activ',
  reserved: 'Rezervat',
  sold: 'Vândut',
  given_away: 'Oferit gratuit',
  expired: 'Expirat',
  removed: 'Eliminat',
};

export const radiusOptions = [
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '20 km', value: 20 },
  { label: '50 km', value: 50 },
  { label: '100 km', value: 100 },
  { label: 'Toată țara', value: null },
] as const;

export function formatPrice(price: number, currency = 'RON', isFree = false) {
  if (isFree || price === 0) return 'Gratuit';
  return `${price.toLocaleString('ro-RO')} ${currency}`;
}

/** Prefer friendly Romanian labels; keep for call sites that still import typos. */
export const incorrectCredentials = 'Email sau parolă greșită. Verifică datele sau resetează parola.';

export function formatQuantity(quantity: number, unit: MeasurementUnit) {
  const q = Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2).replace(/\.?0+$/, '');
  return `${q} ${unitLabels[unit]}`;
}
