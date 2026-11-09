/**
 * Build nationwide cold-start listings: 1–3 per Romanian county.
 * Writes data/seed-county.catalog.json (purgeable via is_seed).
 *
 * Usage: node scripts/generate-county-seed-catalog.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function parseRomania() {
  const src = readFileSync(join(root, 'data/romania.ts'), 'utf8');
  const counties = [];
  const countyRe =
    /\{\s*id:\s*'([^']+)',\s*countryId:\s*'ro',\s*slug:\s*'[^']+',\s*name:\s*'([^']+)'\s*\}/g;
  let m;
  while ((m = countyRe.exec(src))) {
    counties.push({ id: m[1], name: m[2] });
  }

  const cities = [];
  const cityRe = /\['([^']+)',\s*'([^']+)',\s*'([^']+)',\s*([-\d.]+),\s*([-\d.]+)\]/g;
  while ((m = cityRe.exec(src))) {
    cities.push({
      id: m[1],
      countyId: m[2],
      name: m[3],
      lat: Number(m[4]),
      lng: Number(m[5]),
    });
  }
  if (!counties.length || !cities.length) {
    throw new Error('Failed to parse counties/cities from data/romania.ts');
  }
  return { counties, cities };
}

const MATERIALS = [
  {
    title: (city) => `Saci ciment rămași — ${city}`,
    description:
      'Saci de ciment rămași după renovare, depozitați uscat. Prefer ridicare rapidă.',
    categoryId: 'cat-cement',
    subcategoryId: 'sub-cement',
    brand: 'Holcim',
    model: null,
    condition: 'new_unopened',
    quantity: 4,
    unit: 'bag',
    price: 28,
    isFree: false,
    isNegotiable: true,
    photoLabel: 'Ciment',
    photoHue: '5A645C',
  },
  {
    title: (city) => `Plăci gresie surplus — ${city}`,
    description: 'Plăci de gresie rămase din baie, potrivite pentru reparații sau un proiect mic.',
    categoryId: 'cat-tiles',
    subcategoryId: 'sub-ceramic',
    brand: null,
    model: null,
    condition: 'new_opened',
    quantity: 12,
    unit: 'm2',
    price: 45,
    isFree: false,
    isNegotiable: true,
    photoLabel: 'Gresie',
    photoHue: '8B7355',
  },
  {
    title: (city) => `Vopsea interior gratuită — ${city}`,
    description: 'Găleată de vopsea interioară deschisă, încă bună. Ridicare din curte.',
    categoryId: 'cat-paint',
    subcategoryId: 'sub-int-paint',
    brand: 'Savana',
    model: null,
    condition: 'partially_used',
    quantity: 1,
    unit: 'bucket',
    price: 0,
    isFree: true,
    isNegotiable: false,
    photoLabel: 'Vopsea',
    photoHue: '2F5D50',
  },
  {
    title: (city) => `EPS izolație resturi — ${city}`,
    description: 'Plăci EPS rămase după termoizolație, ambalaj în stare bună.',
    categoryId: 'cat-insulation',
    subcategoryId: 'sub-eps',
    brand: null,
    model: 'EPS 80',
    condition: 'new_unopened',
    quantity: 8,
    unit: 'board',
    price: 18,
    isFree: false,
    isNegotiable: true,
    photoLabel: 'EPS',
    photoHue: '4A6FA5',
  },
  {
    title: (city) => `Cherestea scurtă — ${city}`,
    description: 'Resturi de cherestea de construcții, uscate, lungimi mixte.',
    categoryId: 'cat-wood',
    subcategoryId: 'sub-timber',
    brand: null,
    model: null,
    condition: 'used_reclaimed',
    quantity: 15,
    unit: 'm',
    price: 12,
    isFree: false,
    isNegotiable: true,
    photoLabel: 'Lemn',
    photoHue: '6B4F3A',
  },
  {
    title: (city) => `Țevi PPR rămase — ${city}`,
    description: 'Țevi și fitinguri rămase din instalație, nefolosite.',
    categoryId: 'cat-plumbing',
    subcategoryId: 'sub-pipes',
    brand: 'Valrom',
    model: null,
    condition: 'new_unopened',
    quantity: 6,
    unit: 'm',
    price: 22,
    isFree: false,
    isNegotiable: false,
    photoLabel: 'Tevi',
    photoHue: '3D5A80',
  },
];

const SELLER_NAMES = [
  'Resturi Casa SRL',
  'Renovări Locale',
  'Surplus Construct',
  'Atelier Leftover',
  'Materiale Județene',
  'Eco Șantier',
  'Depozit Temporar',
  'Ofertă Locală',
];

const SELLER_BIOS = [
  'Renovări și surplus de materiale din lucrări recente.',
  'Firmă locală — vindem ce rămâne de pe șantier.',
  'Depozit temporar de materiale rămase după amenajări.',
  'Atelier de renovări — ofer surplusul nefolosit.',
  'Materiale rămase din proiecte din județ.',
  'Recuperăm și redistribuim surplus de șantier.',
  'Depozitare pe termen scurt, ridicare locală.',
  'Ofer materiale rămase după renovări casnice.',
];

function padHex(n, width) {
  return n.toString(16).padStart(width, '0');
}

function sellerUuid(i) {
  return `b1000001-0001-4000-8000-${padHex(i + 1, 12)}`;
}

function listingUuid(n) {
  return `b2000001-0001-4000-8000-${padHex(n, 12)}`;
}

function photoUuid(n) {
  return `b3000001-0001-4000-8000-${padHex(n, 12)}`;
}

function publishedDaysAgo(days) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

function main() {
  const { counties, cities } = parseRomania();
  const byCounty = new Map();
  for (const city of cities) {
    if (!byCounty.has(city.countyId)) byCounty.set(city.countyId, []);
    byCounty.get(city.countyId).push(city);
  }

  // Hub cities for reusable seed sellers
  const hubs = [
    'bh-oradea',
    'b-bucuresti',
    'cj-cluj-napoca',
    'tm-timisoara',
    'is-iasi',
    'ct-constanta',
    'bv-brasov',
    'sb-sibiu',
  ]
    .map((id) => cities.find((c) => c.id === id))
    .filter(Boolean);

  const profiles = hubs.map((city, i) => ({
    demoId: `county_seller_${i + 1}`,
    uuid: sellerUuid(i),
    cloud: true,
    email: `seed.county.${i + 1}@materialloop.ro`,
    password: 'seed1234',
    displayName: SELLER_NAMES[i],
    accountType: i % 2 === 0 ? 'business' : 'individual',
    roles: ['user'],
    cityId: city.id,
    bio: SELLER_BIOS[i],
    lat: city.lat,
    lng: city.lng,
    sellerRating: 4.5,
    ratingCount: 2,
    completedSales: 3,
    createdAt: '2025-10-01T10:00:00.000Z',
  }));

  const listings = [];
  let listingSeq = 1;

  counties.forEach((county, countyIndex) => {
    const countyCities = byCounty.get(county.id) ?? [];
    if (!countyCities.length) return;
    const count = (countyIndex % 3) + 1; // 1, 2, or 3

    for (let i = 0; i < count; i += 1) {
      const city = countyCities[i % countyCities.length];
      const material = MATERIALS[(countyIndex + i) % MATERIALS.length];
      const seller = profiles[(countyIndex + i) % profiles.length];
      // Seed inventory is already offered — never active in the public feed.
      const status = material.isFree ? 'given_away' : 'sold';
      const seq = listingSeq;
      listingSeq += 1;

      listings.push({
        demoId: `county_listing_${seq}`,
        uuid: listingUuid(seq),
        photoUuid: photoUuid(seq),
        sellerDemoId: seller.demoId,
        title: material.title(city.name),
        description: `${material.description} Locație: ${city.name}, județul ${county.name}.`,
        categoryId: material.categoryId,
        subcategoryId: material.subcategoryId,
        brand: material.brand,
        model: material.model,
        condition: material.condition,
        quantity: material.quantity + (i % 3),
        unit: material.unit,
        originalPackageQuantity: null,
        price: material.price,
        isNegotiable: material.isNegotiable,
        isFree: material.isFree,
        cityId: city.id,
        lat: city.lat,
        lng: city.lng,
        pickupAvailable: true,
        deliveryAvailable: false,
        storageNotes: 'Depozitat uscat; ridicare din curte după programare.',
        publishedAt: publishedDaysAgo(7 + ((countyIndex + i) % 40)),
        expiresInDays: 60,
        photoLabel: material.photoLabel,
        photoHue: material.photoHue,
        status,
      });
    }
  });

  const catalog = { profiles, listings };
  const outPath = join(root, 'data/seed-county.catalog.json');
  writeFileSync(outPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');

  const given = listings.filter((l) => l.status === 'given_away').length;
  const sold = listings.filter((l) => l.status === 'sold').length;
  console.log(
    `Wrote ${outPath}: ${profiles.length} fake sellers, ${listings.length} offered listings (${sold} sold, ${given} given away) across ${counties.length} counties.`,
  );
}

main();
