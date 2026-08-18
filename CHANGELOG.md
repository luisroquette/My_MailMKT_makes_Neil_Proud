# Changelog

All notable changes to My_MailMKT_makes_Neil_Proud are recorded here.

This project follows [Semantic Versioning](https://semver.org/).

## [2.0.0] - 2026-08-18

### Added

- `nucleo/` — throttle compartilhado (1 e-mail/lead/dia, 20h), dispatcher por prioridade,
  outbox durável (reserve/claim/complete/release, lease 5min, dead-letter 23h), config com
  fallback, agenda por dia/hora com fuso America/Sao_Paulo, fusível e prazo de loop.
- `motores/mail-mkt/` — cadência real por campanha (send_hour, interval_days, weekdays,
  audience_filter, throttle_exempt), sequência de 25 dias como camada de conteúdo.
- `integracoes/tracklink/` — todo CTA sai com tracking link (`mailmkt-<slug>`) + eventos.
- `integracoes/lp/` — contrato de intake de leads.
- `adapters/supabase` e `adapters/resend` — fiéis ao motor real da CF Gauss.
- `adapters/memoria` — demo roda sem serviços externos.
- `dashboard/` — demo standalone (hub, calendário 14 dias, regras, agenda, campanhas, copy).

### Changed

- Public identity renamed to `My_MailMKT_makes_Neil_Proud`; the agent-compatible skill identifier and installation directory are now `my-mailmkt-makes-neil-proud`.

## [1.1.1] - 2026-08-08

### Changed

- The technical skill identifier and installation destination were separated from the repository slug for Claude Code and Codex compatibility.

[1.1.1]: https://github.com/luisroquette/My_MailMKT_makes_Neil_Proud/releases/tag/v1.1.1

## [1.1.0] - 2026-08-08

### Added

- **Subject-line playbook**: four proven subject angles (direct benefit, scarcity/urgency, social proof, curiosity), required `{{lead.firstName}}` personalization on the welcome and final re-engagement steps, and a `bannedSubjectWords` list enforced by the validator.
- **Resend to non-openers**: optional `sequence.resends[]` — one reformulated-subject resend per underperforming step, capped at one per step, never a resend of a resend. New `Resend to non-openers` architecture contract documents the eligibility window and open-tracking dependency.
- **Behavioral re-segmentation**: new `Click` contract with an explicit `segmentTag`. A tagged click may move a lead to a different segment mid-sequence without resetting the eligibility clock or reinterpreting messages already sent.
- **Fatigue gate**: a per-lead check before every claimed send — skip (never cancel) a lead whose last few messages all went unopened, logged as its own event, never applied to re-engagement echoes.
- **CTA copy discipline**: `bannedSubjectWords` now also applies to `ctaLabel`, plus a documented benefit-over-command rule ("Manage more projects in less time", not "Download Now").

### Changed

- `docs/ARCHITECTURE.md`: eligibility clock steps renumbered to include the fatigue-gate check; `Lead.segment` documented as mutable post-capture.
- `docs/IMPLEMENTATION.md`: scheduled sequence job gets an explicit fatigue-gate step.
- `templates/sequence.json` and `examples/b2b-ai-training/sequence.json`: welcome and final re-engagement subjects now personalized; example campaign includes one worked resend.

### Validation

- Every new validator check proven RED (violation silently passed) before the fix, then GREEN (violation caught) after — see PR description for the five adversarial fixtures used.
- `npm test` (golden example campaign) green throughout.

[1.1.0]: https://github.com/luisroquette/My_MailMKT_makes_Neil_Proud/releases/tag/v1.1.0

## [1.0.0] - 2026-08-07

### Added

- Portable `SKILL.md` method: 10-message evergreen cadence, three formats (lesson, letter, echo), named Big Idea per segment, claim discipline with a sourced fact pack, gated resource loop.
- `scripts/validate.mjs`: deterministic campaign validator (cadence, subject length, missing fields, duplicate steps, HTTPS CTAs, unknown fact IDs, unsupported numbers, banned claims, placeholders).
- `scripts/init.mjs`: scaffolds a new campaign workspace from `templates/`.
- `docs/ARCHITECTURE.md`: provider-neutral data contracts, idempotent send-claim design, eligibility clock, resource gate, failure visibility.
- `docs/IMPLEMENTATION.md`: production implementation guide (schema, scheduled job, headers, rendering, compliance gate, launch campaigns, activation checklist).
- `examples/b2b-ai-training/`: complete validator-safe reference campaign.
- CI: `npm test` on every push and pull request.

[1.0.0]: https://github.com/luisroquette/My_MailMKT_makes_Neil_Proud/releases/tag/v1.0.0
