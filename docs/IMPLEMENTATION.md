# Production implementation guide

This guide describes the minimum production path. It is intentionally provider-neutral.

## Data model

Use four core tables:

```sql
create table leads (
  id uuid primary key,
  email text unique not null,
  name text,
  source text not null,
  segment text not null,
  consent_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table email_suppressions (
  email text primary key,
  reason text not null,
  created_at timestamptz not null default now()
);

create table email_log (
  id uuid primary key,
  recipient_email text not null,
  campaign_id text not null,
  message_id text not null,
  provider_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (recipient_email, campaign_id, message_id)
);

create table campaigns (
  id text primary key,
  segment text not null,
  big_idea text not null,
  source_url text,
  status text not null,
  gate_result jsonb,
  created_at timestamptz not null default now()
);
```

Enable row-level security where supported. Browser clients should not read send logs, suppression lists or signed-token secrets. Scheduled workers should use a server-only role.

## Scheduled sequence job

Run the evergreen sequence once per day:

1. Authenticate the scheduled request.
2. Load a bounded batch of non-suppressed leads.
3. Resolve the segment from stored evidence, never from a fresh guess.
4. Calculate the oldest due unsent message.
5. Check the fatigue gate — skip a lead whose last few sends all went unopened, log the skip, and move on (see `docs/ARCHITECTURE.md`).
6. Run deterministic compliance checks.
7. Insert the unique send claim.
8. Render the HTML and plain-text versions.
9. Send through the configured provider.
10. Store the provider ID and send timestamp.
11. Alert when every attempted send fails.

Keep the weekly digest in a separate job. Digest recipients and sequence recipients may overlap, but each stream needs its own idempotency key.

## Required email headers

At minimum, production messages should include:

```text
List-Unsubscribe: <https://your-domain.example/email/unsubscribe?token=...>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

The unsubscribe endpoint must validate a server-side signature, add the address to the suppression table and return success for repeated requests.

## Rendering

Render two layouts:

- `lesson`: editorial heading, short teaching blocks, practical CTA and next-message hook.
- `letter` or `echo`: personal salutation, continuous prose, one CTA and P.S.

Keep email CSS inline and conservative. Test at least Gmail web, Gmail mobile, Apple Mail and Outlook. Always provide a plain-text alternative.

## Compliance gate

Run deterministic checks before every send:

- Subject length.
- Required fields.
- Banned phrases.
- HTTPS CTA count.
- Fact IDs for numeric claims.
- Fact IDs present in the approved fact pack.
- Unsubscribe URL present.
- No unresolved template placeholders.

A language model may draft copy. It must not decide whether its own draft is compliant.

## Launch campaigns

Keep launch campaigns separate from the evergreen clock:

- One named thesis.
- One primary letter.
- One evidence echo.
- One objection or final-call echo.
- One active campaign at a time.
- A minimum rest period between campaigns.
- Exclude leads at the beginning of the evergreen sequence if your fatigue policy requires it.

Store the source URL, draft, gate result and final send result for every campaign.

## Activation checklist

1. Verify sender-domain DNS and the monitored reply-to.
2. Send a real test email to the owner.
3. Click through to the signed resource.
4. Test organic capture and confirm the new lead enters the correct segment.
5. Unsubscribe and confirm every job suppresses the address.
6. Trigger one controlled provider failure and confirm the alert is visible.
