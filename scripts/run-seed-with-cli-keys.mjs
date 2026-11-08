/**
 * One-shot: pull service_role from linked Supabase CLI and run seed:samples.
 * Usage: node scripts/run-seed-with-cli-keys.mjs
 */
import { execSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function envFromDotenv() {
  try {
    const raw = readFileSync(join(root, '.env'), 'utf8');
    const url = raw.match(/^EXPO_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim();
    return url || '';
  } catch {
    return '';
  }
}

function serviceRoleFromCli() {
  const out = execSync('npx supabase projects api-keys --project-ref aiimxsgmhtxhjgnlfvgm', {
    encoding: 'utf8',
    cwd: root,
  });
  const jsonStart = out.indexOf('{');
  const payload = JSON.parse(out.slice(jsonStart));
  const key = payload.keys?.find((k) => k.id === 'service_role' || k.name === 'service_role');
  if (!key?.api_key) throw new Error('service_role key not found via supabase CLI');
  return key.api_key;
}

const url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || envFromDotenv();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || serviceRoleFromCli();

if (!url) throw new Error('Missing SUPABASE_URL / EXPO_PUBLIC_SUPABASE_URL');

const result = spawnSync('node', ['scripts/generate-county-seed-catalog.mjs'], {
  cwd: root,
  stdio: 'inherit',
});
if (result.status) process.exit(result.status);

const seed = spawnSync('node', ['scripts/seed-sample-listings.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    SUPABASE_URL: url,
    SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  },
});
process.exit(seed.status ?? 1);
