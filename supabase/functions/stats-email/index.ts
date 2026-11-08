import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

/**
 * Weekly MaterialLoop stats → personal WhatsApp via CallMeBot (free, no SMTP).
 * Setup: https://www.callmebot.com/blog/free-api-whatsapp-messages/
 * Secrets: STATS_CRON_SECRET (or STATS_EMAIL_CRON_SECRET), CALLMEBOT_PHONE, CALLMEBOT_APIKEY
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-stats-cron-secret',
};

const COUNTIES_TOTAL = 42;

type ListingRow = { status: string; is_seed: boolean | null; city_id: string };
type ProfileRow = {
  roles: string[] | null;
  deactivated_at: string | null;
  is_seed: boolean | null;
};

function authorize(req: Request) {
  const secret =
    Deno.env.get('STATS_CRON_SECRET') ?? Deno.env.get('STATS_EMAIL_CRON_SECRET') ?? '';
  if (!secret) return false;
  const headerSecret = req.headers.get('x-stats-cron-secret');
  if (headerSecret && headerSecret === secret) return true;
  const auth = req.headers.get('Authorization') ?? '';
  if (auth === `Bearer ${secret}`) return true;
  return false;
}

function countyIdFromCity(cityId: string) {
  const i = cityId.indexOf('-');
  return i > 0 ? cityId.slice(0, i) : cityId;
}

function buildStats(
  profiles: ProfileRow[],
  listings: ListingRow[],
  conversations: number,
  messages: number,
) {
  const usersActive = profiles.filter((p) => !p.deactivated_at).length;
  const active = listings.filter((l) => l.status === 'active');
  const sold = listings.filter((l) => l.status === 'sold');
  const given = listings.filter((l) => l.status === 'given_away');
  const counties = new Set(active.map((l) => countyIdFromCity(l.city_id)).filter(Boolean));
  const usersSeed = profiles.filter((p) => !!p.is_seed).length;
  return {
    usersTotal: profiles.length,
    usersActive,
    usersDeactivated: profiles.length - usersActive,
    usersSeed,
    usersOrganic: profiles.length - usersSeed,
    admins: profiles.filter((p) => (p.roles ?? []).includes('admin')).length,
    listingsActive: active.length,
    listingsActiveSeed: active.filter((l) => !!l.is_seed).length,
    listingsActiveOrganic: active.filter((l) => !l.is_seed).length,
    listingsTotal: listings.length,
    listingsSeed: listings.filter((l) => !!l.is_seed).length,
    listingsOrganic: listings.filter((l) => !l.is_seed).length,
    // Sold / given away = real users only (exclude seeds)
    listingsSold: sold.filter((l) => !l.is_seed).length,
    listingsGivenAway: given.filter((l) => !l.is_seed).length,
    listingsSoldSeed: sold.filter((l) => !!l.is_seed).length,
    listingsGivenAwaySeed: given.filter((l) => !!l.is_seed).length,
    conversations,
    messages,
    countiesWithActiveListings: counties.size,
    countiesTotal: COUNTIES_TOTAL,
  };
}

function formatWhatsApp(stats: ReturnType<typeof buildStats>, generatedAt: string) {
  return [
    `*MaterialLoop — weekly stats*`,
    generatedAt,
    '',
    `Users: ${stats.usersOrganic} real · ${stats.usersSeed} fake`,
    `Listings: ${stats.listingsOrganic} real · ${stats.listingsSeed} fake`,
    `Active feed: ${stats.listingsActiveOrganic} real · ${stats.listingsActiveSeed} fake`,
    `Sold (real): ${stats.listingsSold}`,
    `Given away (real): ${stats.listingsGivenAway}`,
    `Chat: ${stats.conversations} conversations · ${stats.messages} messages`,
    `Counties with active: ${stats.countiesWithActiveListings}/${stats.countiesTotal}`,
  ].join('\n');
}

async function sendWhatsApp(text: string) {
  const phone = (Deno.env.get('CALLMEBOT_PHONE') ?? '').replace(/[^\d]/g, '');
  const apikey = Deno.env.get('CALLMEBOT_APIKEY') ?? '';
  if (!phone || !apikey) {
    throw new Error('Missing CALLMEBOT_PHONE or CALLMEBOT_APIKEY');
  }
  const url =
    `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}` +
    `&text=${encodeURIComponent(text)}` +
    `&apikey=${encodeURIComponent(apikey)}`;
  const res = await fetch(url);
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`CallMeBot failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return body;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!authorize(req)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const [
      { data: profiles, error: profilesError },
      { data: listings, error: listingsError },
      { count: conversations, error: convError },
      { count: messages, error: messagesError },
    ] = await Promise.all([
      admin.from('profiles').select('roles, deactivated_at, is_seed'),
      admin.from('listings').select('status, is_seed, city_id').neq('status', 'removed'),
      admin.from('conversations').select('*', { count: 'exact', head: true }),
      admin.from('messages').select('*', { count: 'exact', head: true }),
    ]);

    if (profilesError) throw profilesError;
    if (listingsError) throw listingsError;
    if (convError) throw convError;
    if (messagesError) throw messagesError;

    const stats = buildStats(
      (profiles ?? []) as ProfileRow[],
      (listings ?? []) as ListingRow[],
      conversations ?? 0,
      messages ?? 0,
    );
    const generatedAt = new Date().toISOString();
    const text = formatWhatsApp(stats, generatedAt);
    const delivery = await sendWhatsApp(text);

    return new Response(JSON.stringify({ ok: true, channel: 'whatsapp', stats, delivery }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
