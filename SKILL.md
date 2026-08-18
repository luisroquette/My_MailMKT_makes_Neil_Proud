---
name: my-mailmkt-makes-neil-proud
description: Build and operate a portable direct-response email system — 25-day lesson/letter/echo sequence, deterministic campaign validation, shared throttle (1 email/lead/day), single dispatcher, durable outbox, and a cockpit dashboard. Use when building lead nurture, lifecycle email, launch campaigns, lead magnets, or marketing automation that must not spam.
---

# My_MailMKT_makes_Neil_Proud

A portable direct-response email system that earns attention before asking for action — content (the 25-day sequence), control (throttle, dispatcher, outbox) and operations (dashboard), ported from a production system that stopped a lead from receiving three emails in one hour.

## The operating cycle (5 stages)

Run the stages in order. Every stage has a deterministic validator; nothing ships past a failed gate.

1. **Intake** — leads enter from an LP (see `integracoes/lp/contrato.ts`): name + WhatsApp + email, source, page, UTMs. Normalization is defensive — input is untrusted, invalid fields drop, never throw.
2. **Briefing** — before any copy: product, segments, one low-friction offer per segment, one useful resource per segment, conversion channel, fact pack (source URL + access date), the legal floor, sender domain + unsubscribe mechanics. If any item is unknown, ASK. Do not invent.
3. **Copy + validation** — write the campaign copy, then run `npm run validate` (see `scripts/validate.mjs`). The copy floor (`nucleo/src/piso.ts`) runs on SAVE and on SEND; a rejected line falls back to the seed and logs — it never ships.
4. **Send** — ONE dispatcher (`nucleo/src/dispatcher.ts`) asks the agenda who is due, runs motors in priority order with ONE shared throttle, reserves the durable log, sends through the outbox. Fail closed on ambiguity: never resend.
5. **Health** — the dashboard (see `dashboard/`) shows the last round per motor, the 14-day collision calendar, rules, campaigns and the copy editor. A read that fails is `null`, never `0`.

## The fidelity contract (never break)

| Rule | Where it lives |
|---|---|
| 1 email/lead/day + 20h minimum interval, shared across ALL motors in one round | `nucleo/src/throttle.ts` |
| ONE cron; priority `mail_mkt > lancamento > esteira > digest > video_digest` | `nucleo/src/dispatcher.ts` |
| Hour-only comparison, truncated on purpose — a `:00` tick reaches `:30` defaults | `nucleo/src/agenda.ts` |
| Rules in the database, merged over `CONFIG_PADRAO`; invalid falls back, never throws | `nucleo/src/config.ts` |
| Durable outbox: reserve → send → complete; ambiguous = fail closed | `nucleo/src/outbox.ts` |
| Timezone `America/Sao_Paulo` always; never `Date#getHours()` | `nucleo/src/throttle.ts` |
| Every CTA is a tracking link `mailmkt-<slug>` with UTMs; analytics never blocks delivery | `integracoes/src/tracklink/` |
| List-Unsubscribe + one-click on EVERY message | `adapters/src/resend/` |
| Archive = status `completed`, never delete | `dashboard/app/campanhas/` |
| Campaign idempotency key carries the occurrence id, never `next_send_on` | `motores/src/mail-mkt/runner.ts` |

## The 25-day sequence (content layer)

Data of record: `motores/src/mail-mkt/sequencia.ts`. Steps: D+0 lesson (welcome), D+1 letter (Big Idea), D+3 lesson, D+5 echo, D+7 lesson (tool), D+9 letter (offer), D+12 echo (objection), D+14 lesson (how to evaluate any provider), D+18 letter (final call), D+25 echo (re-engage). Three formats with three different jobs — never ten variations of the same sales email.

## Copy discipline (v1.1.1 methodology, still the law)

- **Subjects**: four angles — direct benefit, real scarcity/urgency (never fabricated), social proof/case, curiosity. Personalize `{{lead.firstName}}` on the welcome and final re-engagement steps. Never use spam-trigger words.
- **CTA**: state what the reader gets, not the mechanical action. "Manage more projects in less time", not "Download Now".
- **Facts**: every number references a fact-pack entry; the validator fails a number with no fact id.
- **Floor**: `TERMOS_BANIDOS` in `nucleo/src/piso.ts` — banned terms reject the copy deterministically.

## Repository map

```
nucleo/        channel-agnostic engine (throttle, dispatcher, outbox, config, agenda, floor)
motores/       the 5 motors — mail-mkt fully ported; esteira/digest/lancamento/video-digest as contracts
integracoes/   tracklink (every CTA tracked) + lp (lead intake)
adapters/      supabase (faithful) · resend (faithful) · memoria (demo runs with nothing external)
dashboard/     standalone demo (Next.js + shadcn): hub, calendar, rules, agenda, campaigns, copy
scripts/       validate.mjs — deterministic campaign validator (v1.1.1 + marketing contract)
docs/          implementation guide, product site, single-entry route reference
```

## Quick start

```bash
npm install          # workspaces + vitest
npm test             # deterministic suite, zero external services
cd dashboard && npm install && npm run dev   # demo at localhost:3000
npm run validate -- examples/b2b-ai-training  # deterministic campaign validation
```

## Porting to a real product

1. Create the tables: `adapters/src/supabase/schema.sql` (portable — no hardcoded hosts).
2. Wire the adapters: `criarAdapterSupabase(client)` + `criarEnviadorResend({ cliente, ... })`.
3. One cron calls `rodarDispatcher` — the single-entry route reference is in `docs/ROTA-DE-REFERENCIA.md`. Never one route per motor.
4. Point the dashboard queries at the contracts in `dashboard/src/data/contratos.ts`.
