import type { City, Country, County } from '@/lib/types';

export const COUNTRY_RO: Country = {
  id: 'ro',
  code: 'RO',
  name: 'România',
  defaultCurrency: 'RON',
  defaultLocale: 'ro',
};

/** All Romanian counties (județe) + București */
export const COUNTIES: County[] = [
  { id: 'ab', countryId: 'ro', slug: 'alba', name: 'Alba' },
  { id: 'ar', countryId: 'ro', slug: 'arad', name: 'Arad' },
  { id: 'ag', countryId: 'ro', slug: 'arges', name: 'Argeș' },
  { id: 'bc', countryId: 'ro', slug: 'bacau', name: 'Bacău' },
  { id: 'bh', countryId: 'ro', slug: 'bihor', name: 'Bihor' },
  { id: 'bn', countryId: 'ro', slug: 'bistrita-nasaud', name: 'Bistrița-Năsăud' },
  { id: 'bt', countryId: 'ro', slug: 'botosani', name: 'Botoșani' },
  { id: 'bv', countryId: 'ro', slug: 'brasov', name: 'Brașov' },
  { id: 'br', countryId: 'ro', slug: 'braila', name: 'Brăila' },
  { id: 'b', countryId: 'ro', slug: 'bucuresti', name: 'București' },
  { id: 'bz', countryId: 'ro', slug: 'buzau', name: 'Buzău' },
  { id: 'cs', countryId: 'ro', slug: 'caras-severin', name: 'Caraș-Severin' },
  { id: 'cl', countryId: 'ro', slug: 'calarasi', name: 'Călărași' },
  { id: 'cj', countryId: 'ro', slug: 'cluj', name: 'Cluj' },
  { id: 'ct', countryId: 'ro', slug: 'constanta', name: 'Constanța' },
  { id: 'cv', countryId: 'ro', slug: 'covasna', name: 'Covasna' },
  { id: 'db', countryId: 'ro', slug: 'dambovita', name: 'Dâmbovița' },
  { id: 'dj', countryId: 'ro', slug: 'dolj', name: 'Dolj' },
  { id: 'gl', countryId: 'ro', slug: 'galati', name: 'Galați' },
  { id: 'gr', countryId: 'ro', slug: 'giurgiu', name: 'Giurgiu' },
  { id: 'gj', countryId: 'ro', slug: 'gorj', name: 'Gorj' },
  { id: 'hr', countryId: 'ro', slug: 'harghita', name: 'Harghita' },
  { id: 'hd', countryId: 'ro', slug: 'hunedoara', name: 'Hunedoara' },
  { id: 'il', countryId: 'ro', slug: 'ialomita', name: 'Ialomița' },
  { id: 'is', countryId: 'ro', slug: 'iasi', name: 'Iași' },
  { id: 'if', countryId: 'ro', slug: 'ilfov', name: 'Ilfov' },
  { id: 'mm', countryId: 'ro', slug: 'maramures', name: 'Maramureș' },
  { id: 'mh', countryId: 'ro', slug: 'mehedinti', name: 'Mehedinți' },
  { id: 'ms', countryId: 'ro', slug: 'mures', name: 'Mureș' },
  { id: 'nt', countryId: 'ro', slug: 'neamt', name: 'Neamț' },
  { id: 'ot', countryId: 'ro', slug: 'olt', name: 'Olt' },
  { id: 'ph', countryId: 'ro', slug: 'prahova', name: 'Prahova' },
  { id: 'sm', countryId: 'ro', slug: 'satu-mare', name: 'Satu Mare' },
  { id: 'sj', countryId: 'ro', slug: 'salaj', name: 'Sălaj' },
  { id: 'sb', countryId: 'ro', slug: 'sibiu', name: 'Sibiu' },
  { id: 'sv', countryId: 'ro', slug: 'suceava', name: 'Suceava' },
  { id: 'tr', countryId: 'ro', slug: 'teleorman', name: 'Teleorman' },
  { id: 'tm', countryId: 'ro', slug: 'timis', name: 'Timiș' },
  { id: 'tl', countryId: 'ro', slug: 'tulcea', name: 'Tulcea' },
  { id: 'vs', countryId: 'ro', slug: 'vaslui', name: 'Vaslui' },
  { id: 'vl', countryId: 'ro', slug: 'valcea', name: 'Vâlcea' },
  { id: 'vn', countryId: 'ro', slug: 'vrancea', name: 'Vrancea' },
];

type CitySeed = [string, string, string, number, number];

/** County seats + additional towns nationwide (expandable seed). */
const CITY_SEEDS: CitySeed[] = [
  // Bihor (launch focus — denser)
  ['bh-oradea', 'bh', 'Oradea', 47.0465, 21.9189],
  ['bh-alesd', 'bh', 'Aleșd', 47.0569, 22.3969],
  ['bh-beius', 'bh', 'Beiuș', 46.6667, 22.35],
  ['bh-marghita', 'bh', 'Marghita', 47.35, 22.3333],
  ['bh-salonta', 'bh', 'Salonta', 46.8, 21.65],
  ['bh-sacueni', 'bh', 'Săcueni', 47.35, 22.1],
  ['bh-valealui-mihai', 'bh', 'Valea lui Mihai', 47.5167, 22.1333],
  ['bh-stei', 'bh', 'Ștei', 46.5403, 22.4611],
  ['bh-nucet', 'bh', 'Nucet', 46.4833, 22.5667],
  ['bh-diosig', 'bh', 'Diosig', 47.3, 22.0],
  // Other counties — residences + key towns
  ['ab-alba-iulia', 'ab', 'Alba Iulia', 46.0667, 23.5833],
  ['ab-sebes', 'ab', 'Sebeș', 45.9556, 23.5667],
  ['ar-arad', 'ar', 'Arad', 46.1866, 21.3123],
  ['ar-ineu', 'ar', 'Ineu', 46.4333, 21.8333],
  ['ag-pitesti', 'ag', 'Pitești', 44.8565, 24.8692],
  ['ag-campulung', 'ag', 'Câmpulung', 45.2677, 25.0444],
  ['bc-bacau', 'bc', 'Bacău', 46.5713, 26.9252],
  ['bc-onesti', 'bc', 'Onești', 46.25, 26.7667],
  ['bn-bistrita', 'bn', 'Bistrița', 47.1332, 24.5001],
  ['bn-nasaud', 'bn', 'Năsăud', 47.2833, 24.4067],
  ['bt-botosani', 'bt', 'Botoșani', 47.7482, 26.6694],
  ['bt-dorohoi', 'bt', 'Dorohoi', 47.95, 26.4],
  ['bv-brasov', 'bv', 'Brașov', 45.6579, 25.6012],
  ['bv-fagaras', 'bv', 'Făgăraș', 45.8417, 24.9731],
  ['bv-sinaia', 'bv', 'Sinaia', 45.35, 25.55],
  ['br-braila', 'br', 'Brăila', 45.2692, 27.9575],
  ['b-bucuresti', 'b', 'București', 44.4268, 26.1025],
  ['bz-buzau', 'bz', 'Buzău', 45.15, 26.8333],
  ['bz-ramnicu-sarat', 'bz', 'Râmnicu Sărat', 45.3833, 27.05],
  ['cs-resita', 'cs', 'Reșița', 45.3, 21.8833],
  ['cs-caransebes', 'cs', 'Caransebeș', 45.4167, 22.2167],
  ['cl-calarasi', 'cl', 'Călărași', 44.2, 27.3333],
  ['cl-oltenita', 'cl', 'Oltenița', 44.0833, 26.6333],
  ['cj-cluj-napoca', 'cj', 'Cluj-Napoca', 46.7712, 23.6236],
  ['cj-turda', 'cj', 'Turda', 46.5667, 23.7833],
  ['cj-dej', 'cj', 'Dej', 47.1333, 23.8667],
  ['cj-gherla', 'cj', 'Gherla', 47.0333, 23.9167],
  ['ct-constanta', 'ct', 'Constanța', 44.1598, 28.6348],
  ['ct-medgidia', 'ct', 'Medgidia', 44.25, 28.2667],
  ['ct-mangalia', 'ct', 'Mangalia', 43.8167, 28.5833],
  ['cv-sfantu-gheorghe', 'cv', 'Sfântu Gheorghe', 45.8667, 25.7833],
  ['cv-targu-secuiesc', 'cv', 'Târgu Secuiesc', 45.9833, 26.1333],
  ['db-targoviste', 'db', 'Târgoviște', 44.9254, 25.4572],
  ['db-moreni', 'db', 'Moreni', 44.9833, 25.6333],
  ['dj-craiova', 'dj', 'Craiova', 44.3302, 23.7949],
  ['dj-bailesti', 'dj', 'Băilești', 44.0333, 23.35],
  ['gl-galati', 'gl', 'Galați', 45.4353, 28.008],
  ['gl-teculesti', 'gl', 'Tecuci', 45.85, 27.4333],
  ['gr-giurgiu', 'gr', 'Giurgiu', 43.9037, 25.9699],
  ['gj-targu-jiu', 'gj', 'Târgu Jiu', 45.0333, 23.2833],
  ['gj-motru', 'gj', 'Motru', 44.8, 22.9833],
  ['hr-miercurea-ciuc', 'hr', 'Miercurea Ciuc', 46.361, 25.8016],
  ['hr-odorheiu', 'hr', 'Odorheiu Secuiesc', 46.3, 25.3],
  ['hd-deva', 'hd', 'Deva', 45.8833, 22.9],
  ['hd-hunedoara', 'hd', 'Hunedoara', 45.75, 22.9],
  ['hd-petrosani', 'hd', 'Petroșani', 45.4167, 23.3667],
  ['il-slobozia', 'il', 'Slobozia', 44.5633, 27.3667],
  ['il-fetesti', 'il', 'Fetești', 44.3833, 27.8333],
  ['is-iasi', 'is', 'Iași', 47.1585, 27.6014],
  ['is-pascani', 'is', 'Pașcani', 47.25, 26.7167],
  ['if-voluntari', 'if', 'Voluntari', 44.492, 26.1735],
  ['if-otopeni', 'if', 'Otopeni', 44.55, 26.0833],
  ['if-pantelimon', 'if', 'Pantelimon', 44.45, 26.2],
  ['mm-baia-mare', 'mm', 'Baia Mare', 47.6667, 23.5833],
  ['mm-sighetu', 'mm', 'Sighetu Marmației', 47.9333, 23.8833],
  ['mh-drobeta', 'mh', 'Drobeta-Turnu Severin', 44.6313, 22.656],
  ['mh-orsova', 'mh', 'Orșova', 44.725, 22.396],
  ['ms-targu-mures', 'ms', 'Târgu Mureș', 46.5386, 24.5514],
  ['ms-sighisoara', 'ms', 'Sighișoara', 46.2167, 24.7917],
  ['ms-reghin', 'ms', 'Reghin', 46.7833, 24.7],
  ['nt-piatra-neamt', 'nt', 'Piatra Neamț', 46.927, 26.3705],
  ['nt-roman', 'nt', 'Roman', 46.9167, 26.9167],
  ['ot-slatina', 'ot', 'Slatina', 44.4333, 24.3667],
  ['ot-caracal', 'ot', 'Caracal', 44.1167, 24.35],
  ['ph-ploiesti', 'ph', 'Ploiești', 44.9469, 26.0365],
  ['ph-campina', 'ph', 'Câmpina', 45.1333, 25.7333],
  ['sm-satu-mare', 'sm', 'Satu Mare', 47.79, 22.892],
  ['sm-carei', 'sm', 'Carei', 47.6833, 22.4667],
  ['sj-zalau', 'sj', 'Zalău', 47.1833, 23.05],
  ['sj-simleu', 'sj', 'Șimleu Silvaniei', 47.2333, 22.8],
  ['sb-sibiu', 'sb', 'Sibiu', 45.7983, 24.1256],
  ['sb-medias', 'sb', 'Mediaș', 46.1667, 24.35],
  ['sv-suceava', 'sv', 'Suceava', 47.6514, 26.2556],
  ['sv-falticeni', 'sv', 'Fălticeni', 47.4667, 26.3],
  ['sv-radauti', 'sv', 'Rădăuți', 47.85, 25.9167],
  ['tr-alexandria', 'tr', 'Alexandria', 43.9833, 25.3333],
  ['tr-rosciori', 'tr', 'Roșiorii de Vede', 44.1167, 24.9833],
  ['tm-timisoara', 'tm', 'Timișoara', 45.7489, 21.2087],
  ['tm-lugoj', 'tm', 'Lugoj', 45.6833, 21.9],
  ['tm-sannicolau', 'tm', 'Sânnicolau Mare', 46.0833, 20.6167],
  ['tl-tulcea', 'tl', 'Tulcea', 45.1667, 28.8],
  ['tl-macin', 'tl', 'Măcin', 45.25, 28.1333],
  ['vs-vaslui', 'vs', 'Vaslui', 46.6333, 27.7333],
  ['vs-barlad', 'vs', 'Bârlad', 46.2333, 27.6667],
  ['vs-husi', 'vs', 'Huși', 46.6833, 28.0667],
  ['vl-ramnicu-valcea', 'vl', 'Râmnicu Vâlcea', 45.1, 24.3667],
  ['vl-dragasani', 'vl', 'Drăgășani', 44.65, 24.2667],
  ['vn-focsani', 'vn', 'Focșani', 45.7, 27.1833],
  ['vn-adjud', 'vn', 'Adjud', 46.1, 27.1833],
];

export const CITIES: City[] = CITY_SEEDS.map(([id, countyId, name, lat, lng]) => ({
  id,
  countyId,
  name,
  lat,
  lng,
}));

export function getCounty(id: string) {
  return COUNTIES.find((c) => c.id === id);
}

export function getCity(id: string) {
  return CITIES.find((c) => c.id === id);
}

export function citiesForCounty(countyId: string) {
  return CITIES.filter((c) => c.countyId === countyId).sort((a, b) =>
    a.name.localeCompare(b.name, 'ro')
  );
}

export function formatCityCounty(cityId: string) {
  const city = getCity(cityId);
  if (!city) return 'România';
  const county = getCounty(city.countyId);
  return county ? `${city.name}, ${county.name}` : city.name;
}
