/**
 * Production data contracts — the EXACT Supabase queries each screen maps
 * to when wired to the real backend (schema: adapters/src/supabase/schema.sql).
 * The demo consumes fixtures.ts; swapping to production means implementing
 * these queries and replacing the imports.
 */

/** Hub — summary of today's round (KPI tiles). */
export const QUERY_RESUMO_DO_DIA = `
select
  (select count(*) from public.nurture_email_log where sent_at::date = (now() at time zone 'America/Sao_Paulo')::date) as enviados_hoje,
  (select count(*) from public.nurture_email_events where opened_at is not null and opened_at::date = (now() at time zone 'America/Sao_Paulo')::date) as aberturas_hoje,
  (select count(*) from public.nurture_leads) as leads_ativos;
`;

/** Hub — one block per motor: last dispatch run. Read failure = null, never 0. */
export const QUERY_ULTIMA_RODADA_POR_MOTOR = `
-- last run PER MOTOR (the hub renders one block per motor)
select distinct on (motor) motor, horario_alvo, resultado, executado_em
from public.nurture_dispatch_runs
order by motor, executado_em desc;
`;

/** Hub — alerts. The two zero-send checks are SEPARATE in the reference. */
export const QUERY_ALERTAS = `
-- motor with 0 sends AND failures (per motor, per round)
select 'motor_zero_falhas' as tipo, motor as motor
from public.nurture_dispatch_runs
where (resultado->>'enviados')::int = 0 and (resultado->>'falhas')::int > 0;
-- campaign with 0 sends (marketing runner, per campaign)
select 'campanha_zero' as tipo, slug
from public.nurture_marketing_campaigns c
where c.status = 'active' and c.sent_occurrences = 0;
-- outbox dead-letter: attempted rows stuck > 23h OR never-attempted rows
-- reserved > 23h ago (the OR matters — a NULL last_attempt_at must not
-- escape the check silently)
select 'dead_letter' as tipo, idempotency_key
from public.nurture_email_outbox
where sent_at is null
  and (
    last_attempt_at < now() - interval '23 hours'
    or (last_attempt_at is null and reserved_at < now() - interval '23 hours')
  );
`;

/** Calendar — 14-day collision view (agenda entries per day/hour). */
export const QUERY_CALENDARIO_14_DIAS = `
select dados->'agenda' as agenda
from public.nurture_config
where singleton = true;
`;

/** Rules — the singleton merged over CONFIG_PADRAO via mesclarConfig. */
export const QUERY_REGRAS = `
select dados from public.nurture_config where singleton = true;
`;

/** Campaigns — list/create/archive (archive = status 'completed', never delete). */
export const QUERY_CAMPANHAS = `
select id, slug, name, offer_name, offer_url, status, cadence, weekdays,
       send_hour, interval_days, audience_filter, throttle_exempt,
       sent_occurrences, next_send_on, last_sent_on, paused_at
from public.nurture_marketing_campaigns
order by created_at desc;
`;

/** Copy editor — editable copy rows; floor gate runs on save AND send. */
export const QUERY_COPY = `
select motor, chave, conteudo, lastro
from public.nurture_email_copy
where motor = 'mail_mkt';
`;

/** Tracking — one link per occurrence, idempotent by slug (mailmkt-<slug>). */
export const QUERY_TRACKING_LINK_POR_CAMPANHA = `
select slug, destination_url, tracked_destination_url, utm_source, utm_medium, utm_campaign
from public.tracking_links
where slug = 'mailmkt-' || $campanha_slug;
`;
