/** Same placehold.co style used by seed listings when a seller skips photos. */

type PhotoStyle = { label: string; hue: string };

const PLACEHOLDER = (label: string, hue: string) =>
  `https://placehold.co/800x600/${hue}/F3EEE6/png?text=${encodeURIComponent(label)}`;

const BY_SUBCATEGORY: Record<string, PhotoStyle> = {
  'sub-cement': { label: 'Ciment', hue: '5A645C' },
  'sub-tile-adhesive': { label: 'Adeziv', hue: '2F5D3A' },
  'sub-mortar': { label: 'Mortar', hue: '5B655B' },
  'sub-grout': { label: 'Chit', hue: '5B655B' },
  'sub-mixtures': { label: 'Amestec', hue: '5A645C' },

  'sub-ceramic': { label: 'Gresie', hue: '8B7355' },
  'sub-porcelain': { label: 'Portelan', hue: '8A948A' },
  'sub-bricks': { label: 'Caramida', hue: 'A33B2B' },
  'sub-blocks': { label: 'BCA', hue: '8A948A' },
  'sub-paving': { label: 'Pavele', hue: 'C9BBA8' },

  'sub-eps': { label: 'EPS', hue: '4A6FA5' },
  'sub-xps': { label: 'XPS', hue: '5B655B' },
  'sub-mineral-wool': { label: 'Vata', hue: '2F5D3A' },
  'sub-roof-ins': { label: 'Izolatie', hue: '4A6FA5' },
  'sub-acoustic': { label: 'VataIS', hue: '2F5D3A' },

  'sub-int-paint': { label: 'Vopsea', hue: '2F5D50' },
  'sub-ext-paint': { label: 'VopseaExt', hue: '2F5D3A' },
  'sub-plaster': { label: 'Tencuiala', hue: 'C9BBA8' },
  'sub-primers': { label: 'Grund', hue: 'C45C26' },
  'sub-finishing': { label: 'Finisaj', hue: '8A948A' },

  'sub-cables': { label: 'Cablu', hue: '1F3F28' },
  'sub-switches': { label: 'Intrerup', hue: '2F5D3A' },
  'sub-sockets': { label: 'Prize', hue: '2F5D3A' },
  'sub-distribution': { label: 'Tablou', hue: '1F3F28' },
  'sub-lighting': { label: 'LED', hue: '1F3F28' },

  'sub-pipes': { label: 'Tevi', hue: '3D5A80' },
  'sub-fittings': { label: 'Fitinguri', hue: '1F3F28' },
  'sub-radiators': { label: 'Radiator', hue: '8A948A' },
  'sub-heating': { label: 'Incalzire', hue: '3D5A80' },
  'sub-sanitary': { label: 'Sanitare', hue: '3D5A80' },

  'sub-timber': { label: 'Lemn', hue: '6B4F3A' },
  'sub-boards': { label: 'Placi', hue: 'C9BBA8' },
  'sub-flooring': { label: 'Pardoseala', hue: '6B4F3A' },
  'sub-beams': { label: 'Grinzi', hue: 'C45C26' },
  'sub-panels': { label: 'OSB', hue: 'C9BBA8' },

  'sub-rebar': { label: 'Otel', hue: 'A33B2B' },
  'sub-profiles': { label: 'Profile', hue: '5B655B' },
  'sub-sheets': { label: 'Tabla', hue: '5B655B' },
  'sub-aluminium': { label: 'Aluminiu', hue: '8A948A' },

  'sub-hand-tools': { label: 'Unelte', hue: '5B655B' },
  'sub-power-tools': { label: 'Electrice', hue: '1F3F28' },
  'sub-fasteners': { label: 'Fixare', hue: '5A645C' },
  'sub-screws': { label: 'Suruburi', hue: '5A645C' },
  'sub-other-acc': { label: 'Accesorii', hue: '8A948A' },

  'sub-other-mat': { label: 'Material', hue: '5B655B' },
};

const BY_CATEGORY: Record<string, PhotoStyle> = {
  'cat-cement': { label: 'Ciment', hue: '5A645C' },
  'cat-tiles': { label: 'Placi', hue: '8B7355' },
  'cat-insulation': { label: 'Izolatie', hue: '4A6FA5' },
  'cat-paint': { label: 'Vopsea', hue: '2F5D50' },
  'cat-electrical': { label: 'Electric', hue: '1F3F28' },
  'cat-plumbing': { label: 'Tevi', hue: '3D5A80' },
  'cat-wood': { label: 'Lemn', hue: '6B4F3A' },
  'cat-metal': { label: 'Metal', hue: 'A33B2B' },
  'cat-tools': { label: 'Unelte', hue: '5B655B' },
  'cat-other': { label: 'Material', hue: '5B655B' },
};

const FALLBACK: PhotoStyle = { label: 'Material', hue: '5B655B' };

export function defaultListingPhotoUrl(
  categoryId: string,
  subcategoryId?: string | null
): string {
  const style =
    (subcategoryId ? BY_SUBCATEGORY[subcategoryId] : undefined) ??
    BY_CATEGORY[categoryId] ??
    FALLBACK;
  return PLACEHOLDER(style.label, style.hue);
}

/** Prefer an uploaded photo; otherwise a category/subcategory placeholder. */
export function resolveListingCoverUrl(
  photos: { url: string }[] | null | undefined,
  categoryId: string,
  subcategoryId?: string | null
): string {
  const uploaded = photos?.find((p) => !!p.url)?.url;
  if (uploaded) return uploaded;
  return defaultListingPhotoUrl(categoryId, subcategoryId);
}
