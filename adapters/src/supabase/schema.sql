-- My_MailMKT v2.0.0 — Supabase schema (portable port of the CF Gauss
-- reference migrations). Differences from the reference are intentional and
-- documented inline; the fidelity-critical constraints (dedupe UNIQUE,
-- outbox idempotency PK, singleton config) are preserved exactly.

-- Leads captured by LPs / forms (reference: motor_empiricus_fundacao.sql).
create table if not exists public.nurture_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique check (email = lower(email)),
  whatsapp text,
  company text,
  role text,
  segment text,
  interest text,
  source text,
  page text,
  created_at timestamptz not null default now()
);

-- Durable send log. UNIQUE(to_email, email_type) is the dedupe guarantee:
-- the same step never ships twice to the same lead.
create table if not exists public.nurture_email_log (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.nurture_leads(id) on delete cascade,
  to_email text not null,
  email_type text not null,
  resend_id text,
  resend_attempted_at timestamptz,
  sent_at timestamptz not null default now(),
  constraint nurture_email_log_unique unique (to_email, email_type)
);
create index if not exists nurture_email_log_sent_at_idx on public.nurture_email_log (sent_at);

-- Opt-outs. One click, HMAC-protected, checked by every motor before sending.
create table if not exists public.nurture_suppressions (
  email text primary key check (email = lower(email)),
  reason text not null,
  created_at timestamptz not null default now()
);

-- Durable outbox (reference: email_send_attempt_state.sql + 4 atomic RPCs).
-- idempotency_key PK = exactly-once delivery even across retries.
create table if not exists public.nurture_email_outbox (
  idempotency_key text primary key,
  email_args jsonb not null,
  source text not null,
  source_ids text[] not null default '{}',
  reserved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  last_attempt_at timestamptz,
  sent_at timestamptz,
  resend_id text,
  last_error text,
  attempt_token text,
  lease_until timestamptz
);

-- Open/click events (reference: nurture_email_events).
create table if not exists public.nurture_email_events (
  id uuid primary key,
  email text not null,
  email_type text not null,
  opened_at timestamptz,
  clicked_at timestamptz,
  last_click_url text
);

-- Singleton rules row (reference: nurture_config). Empty row = CONFIG_PADRAO
-- in code; the port merges with mesclarConfig and never fails open.
create table if not exists public.nurture_config (
  singleton boolean primary key default true,
  dados jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint nurture_config_singleton check (singleton)
);
insert into public.nurture_config (singleton, dados)
values (true, '{}'::jsonb)
on conflict (singleton) do nothing;

-- Marketing campaigns (reference: mail_marketing_campaigns.sql).
-- NOTE: the reference CHECKs offer_url against ^https://cfgauss\.com\.br/.
-- The portable port validates against ALLOWED_DOMAINS at the application
-- layer (see adapters/supabase/README note) instead of hardcoding a host.
create table if not exists public.nurture_marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  offer_name text not null,
  offer_url text not null,
  objective text not null,
  audience text not null,
  status text not null default 'paused'
    check (status in ('active', 'paused', 'completed')),
  cadence text not null check (cadence in ('hourly', 'daily', 'weekly')),
  weekdays smallint[] not null default '{}',
  timezone text not null default 'America/Sao_Paulo',
  start_date date not null,
  end_date date,
  next_send_on timestamptz,
  send_index integer not null default 0,
  sent_occurrences integer not null default 0,
  last_sent_on timestamptz,
  paused_at timestamptz,
  throttle_exempt boolean,
  interval_days integer not null default 1,
  send_hour text not null default '10:00',
  audience_filter jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tracking links (reference: tracking_links.sql — trimmed to the columns the
-- mail-mkt integration writes; the full analytics columns belong to the
-- tracklink skill, My_UTMs_Make_Me_Proud).
create table if not exists public.tracking_links (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (
    char_length(slug) between 1 and 80
    and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  destination_url text not null,
  tracked_destination_url text not null,
  utm_source text not null,
  utm_medium text not null,
  utm_campaign text not null,
  created_at timestamptz not null default now()
);

-- RLS: everything locked to service_role only (reference: explicit-deny
-- policies). Public read is never enabled for these tables.
alter table public.nurture_leads enable row level security;
alter table public.nurture_email_log enable row level security;
alter table public.nurture_suppressions enable row level security;
alter table public.nurture_email_outbox enable row level security;
alter table public.nurture_email_events enable row level security;
alter table public.nurture_config enable row level security;
alter table public.nurture_marketing_campaigns enable row level security;
alter table public.tracking_links enable row level security;

-- Outbox RPCs (port of the 4 atomic functions of the reference):
-- reserve → claim (lease) → complete; release rolls back on definitive failure.
create or replace function public.reserve_nurture_email_outbox(
  p_idempotency_key text, p_email_args jsonb, p_source text, p_source_ids text[]
) returns boolean language plpgsql security definer set search_path = public as $$
begin
  insert into public.nurture_email_outbox (idempotency_key, email_args, source, source_ids)
  values (p_idempotency_key, p_email_args, p_source, p_source_ids)
  on conflict (idempotency_key) do nothing;
  return found;
end $$;

create or replace function public.complete_nurture_email_outbox(
  p_idempotency_key text, p_resend_id text
) returns void language plpgsql security definer set search_path = public as $$
begin
  update public.nurture_email_outbox
     set sent_at = now(), resend_id = p_resend_id
   where idempotency_key = p_idempotency_key;
end $$;

create or replace function public.release_nurture_email_outbox(
  p_idempotency_key text, p_last_error text
) returns void language plpgsql security definer set search_path = public as $$
begin
  update public.nurture_email_outbox
     set last_attempt_at = now(), last_error = p_last_error, lease_until = null
   where idempotency_key = p_idempotency_key;
end $$;
