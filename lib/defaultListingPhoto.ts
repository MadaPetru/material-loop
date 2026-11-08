import { i18n, type AppLocale } from '@/lib/i18n';

/** Same placehold.co style used by seed listings when a seller skips photos. */

const PLACEHOLDER = (label: string, hue: string) =>
  `https://placehold.co/800x600/${hue}/F3EEE6/png?text=${encodeURIComponent(label)}`;

const BY_SUBCATEGORY_HUE: Record<string, string> = {
  'sub-cement': '5A645C',
  'sub-tile-adhesive': '2F5D3A',
  'sub-mortar': '5B655B',
  'sub-grout': '5B655B',
  'sub-mixtures': '5A645C',

  'sub-ceramic': '8B7355',
  'sub-porcelain': '8A948A',
  'sub-bricks': 'A33B2B',
  'sub-blocks': '8A948A',
  'sub-paving': 'C9BBA8',

  'sub-eps': '4A6FA5',
  'sub-xps': '5B655B',
  'sub-mineral-wool': '2F5D3A',
  'sub-roof-ins': '4A6FA5',
  'sub-acoustic': '2F5D3A',

  'sub-int-paint': '2F5D50',
  'sub-ext-paint': '2F5D3A',
  'sub-plaster': 'C9BBA8',
  'sub-primers': 'C45C26',
  'sub-finishing': '8A948A',

  'sub-cables': '1F3F28',
  'sub-switches': '2F5D3A',
  'sub-sockets': '2F5D3A',
  'sub-distribution': '1F3F28',
  'sub-lighting': '1F3F28',

  'sub-pipes': '3D5A80',
  'sub-fittings': '1F3F28',
  'sub-radiators': '8A948A',
  'sub-heating': '3D5A80',
  'sub-sanitary': '3D5A80',

  'sub-timber': '6B4F3A',
  'sub-boards': 'C9BBA8',
  'sub-flooring': '6B4F3A',
  'sub-beams': 'C45C26',
  'sub-panels': 'C9BBA8',

  'sub-rebar': 'A33B2B',
  'sub-profiles': '5B655B',
  'sub-sheets': '5B655B',
  'sub-aluminium': '8A948A',

  'sub-hand-tools': '5B655B',
  'sub-power-tools': '1F3F28',
  'sub-fasteners': '5A645C',
  'sub-screws': '5A645C',
  'sub-other-acc': '8A948A',

  'sub-other-mat': '5B655B',
};

const BY_CATEGORY_HUE: Record<string, string> = {
  'cat-cement': '5A645C',
  'cat-tiles': '8B7355',
  'cat-insulation': '4A6FA5',
  'cat-paint': '2F5D50',
  'cat-electrical': '1F3F28',
  'cat-plumbing': '3D5A80',
  'cat-wood': '6B4F3A',
  'cat-metal': 'A33B2B',
  'cat-tools': '5B655B',
  'cat-other': '5B655B',
};

const FALLBACK_HUE = '5B655B';

function photoLabel(
  categoryId: string,
  subcategoryId: string | null | undefined,
  locale: AppLocale
): string {
  const opts = { locale };
  if (subcategoryId) {
    const subKey = `defaultPhoto.sub.${subcategoryId}`;
    const sub = i18n.t(subKey, opts);
    if (sub && sub !== subKey) return sub;
  }
  const catKey = `defaultPhoto.cat.${categoryId}`;
  const cat = i18n.t(catKey, opts);
  if (cat && cat !== catKey) return cat;
  return i18n.t('defaultPhoto.fallback', opts);
}

export function defaultListingPhotoUrl(
  categoryId: string,
  subcategoryId?: string | null,
  locale: AppLocale = (i18n.locale as AppLocale) || 'ro'
): string {
  const hue =
    (subcategoryId ? BY_SUBCATEGORY_HUE[subcategoryId] : undefined) ??
    BY_CATEGORY_HUE[categoryId] ??
    FALLBACK_HUE;
  return PLACEHOLDER(photoLabel(categoryId, subcategoryId, locale), hue);
}

/** Prefer an uploaded photo; otherwise a category/subcategory placeholder. */
export function resolveListingCoverUrl(
  photos: { url: string }[] | null | undefined,
  categoryId: string,
  subcategoryId?: string | null,
  locale?: AppLocale
): string {
  const uploaded = photos?.find((p) => !!p.url)?.url;
  if (uploaded) return uploaded;
  return defaultListingPhotoUrl(categoryId, subcategoryId, locale);
}
