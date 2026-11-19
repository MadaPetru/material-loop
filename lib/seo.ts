import type { Metadata } from 'expo-router/server';

/** Canonical public site (must match production domain). */
export const SITE_URL = 'https://www.materialloop.website';

export const SITE_NAME = 'MaterialLoop';

/** Primary locale for SEO copy (marketplace is Romania-first). */
export const DEFAULT_LOCALE = 'ro';

export const DEFAULT_TITLE =
  'MaterialLoop — materiale de construcții rămase în România';

export const DEFAULT_DESCRIPTION =
  'Cumpără, vinde sau oferă gratuit surplusul de materiale de construcții — ciment, lemn, gresie, izolații și altele — în toată România. Marketplace circular pentru resturi de șantier.';

export const DEFAULT_DESCRIPTION_EN =
  'Buy, sell, or give away leftover building materials across Romania. Circular marketplace for surplus cement, timber, tiles, insulation, and more.';

export const DEFAULT_KEYWORDS = [
  'MaterialLoop',
  'materiale construcții',
  'materiale rămase',
  'surplus construcții',
  'resturi șantier',
  'materiale second hand',
  'oferă gratuit materiale',
  'marketplace România',
  'circular economy',
  'leftover building materials',
] as const;

export const OG_IMAGE_PATH = '/og-image.png';
export const OG_IMAGE_URL = `${SITE_URL}${OG_IMAGE_PATH}`;

export function absoluteUrl(path = '/'): string {
  if (!path || path === '/') return SITE_URL;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

type PageMetaInput = {
  title?: string;
  description?: string;
  path?: string;
  /** Set true for auth, admin, and account-only screens. */
  noIndex?: boolean;
  image?: string;
  keywords?: string[];
};

/** Shared metadata for Expo Router `generateMetadata()` exports. */
export function pageMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  noIndex = false,
  image = OG_IMAGE_URL,
  keywords = [...DEFAULT_KEYWORDS],
}: PageMetaInput = {}): Metadata {
  const fullTitle = title
    ? title.includes(SITE_NAME)
      ? title
      : `${title} | ${SITE_NAME}`
    : DEFAULT_TITLE;
  const url = absoluteUrl(path);

  return {
    title: fullTitle,
    description,
    applicationName: SITE_NAME,
    keywords,
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: 'marketplace',
    referrer: 'origin-when-cross-origin',
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
    // Keep only canonical here. Language alternates live in `app/+html.tsx` as
    // `hrefLang` — Expo's metadata renderer emits lowercase `hreflang`, which
    // React warns about as an invalid DOM property.
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'ro_RO',
      alternateLocale: ['en_US'],
      url,
      title: fullTitle,
      description,
      images: [
        {
          url: image,
          secureUrl: image,
          width: 1024,
          height: 1024,
          alt: `${SITE_NAME} — materiale de construcții rămase`,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
    icons: {
      icon: '/favicon.ico',
      apple: '/og-image.png',
    },
  };
}

/** JSON-LD for Google + AI answer engines (Organization + WebSite + SearchAction). */
export function siteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: OG_IMAGE_URL,
        email: 'mada.petru@digitalexplorer.ro',
        description: DEFAULT_DESCRIPTION,
        areaServed: {
          '@type': 'Country',
          name: 'Romania',
        },
        sameAs: [],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        inLanguage: ['ro-RO', 'en'],
        publisher: { '@id': `${SITE_URL}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'WebApplication',
        '@id': `${SITE_URL}/#app`,
        name: SITE_NAME,
        url: SITE_URL,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web, iOS, Android',
        description: DEFAULT_DESCRIPTION_EN,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'RON',
        },
      },
    ],
  };
}
