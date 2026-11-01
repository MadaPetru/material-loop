import { i18n } from '@/lib/i18n';
import type { MeasurementUnit, ProductCondition, ListingStatus } from './types';

export function conditionLabel(condition: ProductCondition) {
  return i18n.t(`labels.condition.${condition}`);
}

export function unitLabel(unit: MeasurementUnit) {
  return i18n.t(`labels.unit.${unit}`);
}

export function statusLabel(status: ListingStatus) {
  return i18n.t(`labels.status.${status}`);
}

/** @deprecated Prefer conditionLabel() for live locale updates */
export const conditionLabels: Record<ProductCondition, string> = {
  get new_unopened() {
    return conditionLabel('new_unopened');
  },
  get new_opened() {
    return conditionLabel('new_opened');
  },
  get partially_used() {
    return conditionLabel('partially_used');
  },
  get used_reclaimed() {
    return conditionLabel('used_reclaimed');
  },
};

export const unitLabels: Record<MeasurementUnit, string> = {
  get bag() {
    return unitLabel('bag');
  },
  get piece() {
    return unitLabel('piece');
  },
  get m() {
    return unitLabel('m');
  },
  get m2() {
    return unitLabel('m2');
  },
  get m3() {
    return unitLabel('m3');
  },
  get kg() {
    return unitLabel('kg');
  },
  get l() {
    return unitLabel('l');
  },
  get bucket() {
    return unitLabel('bucket');
  },
  get board() {
    return unitLabel('board');
  },
  get other() {
    return unitLabel('other');
  },
};

export const statusLabels: Record<ListingStatus, string> = {
  get draft() {
    return statusLabel('draft');
  },
  get active() {
    return statusLabel('active');
  },
  get reserved() {
    return statusLabel('reserved');
  },
  get sold() {
    return statusLabel('sold');
  },
  get given_away() {
    return statusLabel('given_away');
  },
  get expired() {
    return statusLabel('expired');
  },
  get removed() {
    return statusLabel('removed');
  },
};

export function radiusOptions() {
  return [
    { label: i18n.t('labels.radius.km5'), value: 5 as number | null },
    { label: i18n.t('labels.radius.km10'), value: 10 },
    { label: i18n.t('labels.radius.km20'), value: 20 },
    { label: i18n.t('labels.radius.km50'), value: 50 },
    { label: i18n.t('labels.radius.km100'), value: 100 },
    { label: i18n.t('labels.radius.country'), value: null },
  ] as const;
}

export function formatPrice(price: number, currency = 'RON', isFree = false) {
  if (isFree || price === 0) return i18n.t('labels.free');
  const locale = i18n.locale === 'en' ? 'en-GB' : 'ro-RO';
  return `${price.toLocaleString(locale)} ${currency}`;
}

export function formatQuantity(quantity: number, unit: MeasurementUnit) {
  const q = Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2).replace(/\.?0+$/, '');
  return `${q} ${unitLabel(unit)}`;
}

export const incorrectCredentials = () => i18n.t('errors.badCredentials');
