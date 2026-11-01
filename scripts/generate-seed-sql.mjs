import { readFileSync, writeFileSync } from 'fs';

const catSrc = readFileSync('data/categories.ts', 'utf8');
const roSrc = readFileSync('data/romania.ts', 'utf8');

function extractArrayLiteral(src, marker) {
  const i = src.indexOf(marker);
  if (i < 0) throw new Error(`missing ${marker}`);
  const eq = src.indexOf('=', i);
  const start = src.indexOf('[', eq);
  if (start < 0) throw new Error(`no array after ${marker}`);
  let depth = 0;
  let end = start;
  for (; end < src.length; end++) {
    if (src[end] === '[') depth++;
    else if (src[end] === ']') {
      depth--;
      if (depth === 0) {
        end++;
        break;
      }
    }
  }
  return src.slice(start, end);
}

function toJsonLiteral(literal) {
  return literal
    .replace(/\/\/[^\n]*/g, '')
    .replace(/(\w+):/g, '"$1":')
    .replace(/'/g, '"')
    .replace(/,(\s*[\]}])/g, '$1');
}

function parseObjectArray(literal) {
  return JSON.parse(toJsonLiteral(literal));
}

function parseTupleArray(literal) {
  return JSON.parse(toJsonLiteral(literal));
}

const categories = parseObjectArray(extractArrayLiteral(catSrc, 'export const CATEGORIES'));
const subcategories = parseObjectArray(extractArrayLiteral(catSrc, 'export const SUBCATEGORIES'));
const counties = parseObjectArray(extractArrayLiteral(roSrc, 'export const COUNTIES'));
const cities = parseTupleArray(extractArrayLiteral(roSrc, 'const CITY_SEEDS'));

const esc = (s) => String(s).replace(/'/g, "''");

let sql = '-- Seed categories, counties, cities from app data\n\n';

sql += 'insert into categories (id, slug, name, sort_order, is_active) values\n';
sql += categories
  .map(
    (c) =>
      `  ('${esc(c.id)}', '${esc(c.slug)}', '${esc(c.name)}', ${c.sortOrder}, ${c.isActive})`
  )
  .join(',\n');
sql +=
  '\non conflict (id) do update set slug = excluded.slug, name = excluded.name, sort_order = excluded.sort_order, is_active = excluded.is_active;\n\n';

sql += 'insert into subcategories (id, category_id, slug, name, sort_order, is_active) values\n';
sql += subcategories
  .map(
    (c) =>
      `  ('${esc(c.id)}', '${esc(c.categoryId)}', '${esc(c.slug)}', '${esc(c.name)}', ${c.sortOrder}, ${c.isActive})`
  )
  .join(',\n');
sql +=
  '\non conflict (id) do update set category_id = excluded.category_id, slug = excluded.slug, name = excluded.name, sort_order = excluded.sort_order, is_active = excluded.is_active;\n\n';

sql += 'insert into counties (id, country_id, slug, name) values\n';
sql += counties
  .map((c) => `  ('${esc(c.id)}', '${esc(c.countryId)}', '${esc(c.slug)}', '${esc(c.name)}')`)
  .join(',\n');
sql +=
  '\non conflict (id) do update set country_id = excluded.country_id, slug = excluded.slug, name = excluded.name;\n\n';

sql += 'insert into cities (id, county_id, name, location) values\n';
sql += cities
  .map(
    ([id, countyId, name, lat, lng]) =>
      `  ('${esc(id)}', '${esc(countyId)}', '${esc(name)}', ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography)`
  )
  .join(',\n');
sql +=
  '\non conflict (id) do update set county_id = excluded.county_id, name = excluded.name, location = excluded.location;\n';

writeFileSync('supabase/migrations/002_seed_catalog.sql', sql);
console.log({
  categories: categories.length,
  subcategories: subcategories.length,
  counties: counties.length,
  cities: cities.length,
});
