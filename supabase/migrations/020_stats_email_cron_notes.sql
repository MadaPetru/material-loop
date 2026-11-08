-- Weekly MaterialLoop stats are sent by Edge Function `stats-email`
-- over WhatsApp (CallMeBot — free, no SMTP). See README.
--
-- Required function secrets:
--   STATS_CRON_SECRET (or legacy STATS_EMAIL_CRON_SECRET)
--   CALLMEBOT_PHONE
--   CALLMEBOT_APIKEY
--
-- Manual test:
--   curl -X POST "$SUPABASE_URL/functions/v1/stats-email" \
--     -H "x-stats-cron-secret: $STATS_CRON_SECRET"
--
-- Suggested cron (Monday 07:00 Europe/Bucharest ≈ 05:00 UTC):
--   0 5 * * 1

select 1;
