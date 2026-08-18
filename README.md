# My_MailMKT_makes_Neil_Proud

<p align="center">
  <strong>A portable direct-response email system for leads that should not go cold.</strong>
</p>

<p align="center">
  <a href="./LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-7B2FBE.svg"></a>
  <img alt="No runtime dependencies" src="https://img.shields.io/badge/runtime_dependencies-0-D5A62E.svg">
  <img alt="Claude Code and Codex" src="https://img.shields.io/badge/works_with-Claude_Code_%2B_Codex-17131F.svg">
</p>

> **Independent project:** not affiliated with Neil Patel, NP Digital, or their companies. It uses established direct-response publishing patterns, never third-party copy, trademarks, or claims.

Most lead forms end in a spreadsheet, a CRM stage, or one forgettable welcome email. My_MailMKT gives the follow-up a structure — and, since v2.0.0, the **control plane** that stops it from becoming spam.

## What changed in v2.0.0

v1.x was the content layer: the 25-day sequence, campaign templates, compliance guards and the deterministic validator. v2.0.0 ports the **production cockpit of the CF Gauss reference system** (17-18/08/2026):

- **Shared throttle** — 1 email/lead/day + 20h minimum interval, ONE state across all five motors in a single dispatch round. Born from a real incident: five independent runners gave one lead three emails in one hour.
- **One cron, one dispatcher** — a single hourly tick asks the database-backed agenda "who is due", then runs motors in priority order (`mail_mkt > lancamento > esteira > digest > video_digest`).
- **Rules in the database** — cadence, hours, allowed days, blackout, fuse, audience and copy are editable by screen, never by deploy. Invalid values fall back to the default; the engine never fails open.
- **Durable outbox** — reserve → send → complete with a 5-minute lease; ambiguous results fail closed (never resend); dead letters alert after 23h.
- **Every CTA tracked** — each marketing link ships as a `mailmkt-<slug>` tracking link with UTMs, pluggable into the My_UTMs tracklink layer; LPs feed leads in through the intake contract.
- **Cockpit dashboard demo** — standalone Next.js app: per-motor blocks, 14-day collision calendar, global rules, weekly agenda, campaigns (archive = `completed`, never delete) and a copy editor with the anti-sensationalism floor on save AND send.

## The operating cycle

```
Intake (LP) → Briefing → Copy + validation → Send (dispatcher) → Health (dashboard)
```

Every stage has a deterministic validator; nothing ships past a failed gate. See `SKILL.md` for the full cycle and the fidelity contract.

## Quick start

```bash
npm install                    # workspaces + vitest (zero runtime deps)
npm test                       # deterministic suite — no external services
npm run validate -- examples/b2b-ai-training   # deterministic campaign validation
cd dashboard && npm install && npm run dev     # cockpit demo at localhost:3000
```

## Repository map

```
nucleo/        channel-agnostic engine — throttle, dispatcher, outbox, config, agenda, floor
motores/       the 5 motors; mail-mkt fully ported (cadence, sequence, runner)
integracoes/   tracklink (every CTA tracked) + lp (lead intake)
adapters/      supabase (faithful) · resend (faithful) · memoria (demo runs on fixtures)
dashboard/     standalone demo — hub, calendar, rules, agenda, campaigns, copy editor
scripts/       validate.mjs — deterministic campaign validator
docs/          implementation guide, product site, single-entry route reference
```

## How it maps to the CF Gauss reference

| Reference (production) | This repo |
|---|---|
| `lib/nurture/throttle.ts` — 1/lead/day, 20h, shared state per round | `nucleo/src/throttle.ts` |
| `lib/nurture/dispatcher.ts` — priority, fuse, 240s loop | `nucleo/src/dispatcher.ts` |
| `nurture_config` singleton jsonb + `CONFIG_PADRAO` fallback | `nucleo/src/config.ts` |
| Hour-only tick matching (`:00` reaches `:30` defaults) | `nucleo/src/agenda.ts` |
| `nurture_email_outbox` + 4 atomic RPCs, 23h dead-letter | `nucleo/src/outbox.ts` + `adapters/src/supabase/schema.sql` |
| `lib/nurture/marketing/runner.ts` — one tracking link per occurrence | `motores/src/mail-mkt/runner.ts` |
| `lib/tracking-links/mailmkt.ts` — slug `mailmkt-<slug>`, UTMs | `integracoes/src/tracklink/` |
| `lib/nurture/piso.ts` — banned-terms gate on save AND send | `nucleo/src/piso.ts` |
| `components/admin/Cockpit/*` — dashboard | `dashboard/` |

Intentional differences: no hardcoded `cfgauss.com.br` host CHECK (validate against `ALLOWED_DOMAINS` at the app layer); no Trello/checkout coupling (those become event contracts); the legacy campaign copy ships as an example, not as code.

## Sequence (v1.1.1, still the content layer)

25 days, 10 messages, three formats with different jobs: D+0 lesson → D+1 letter → D+3 lesson → D+5 echo → D+7 lesson → D+9 letter → D+12 echo → D+14 lesson → D+18 letter → D+25 echo. Data of record: `motores/src/mail-mkt/sequencia.ts`. The v1.1.1 README with the full methodology lives at `docs/README-v1.1.1.md`.
