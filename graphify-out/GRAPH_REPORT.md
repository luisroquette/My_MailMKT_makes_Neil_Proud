# Graph Report - .  (2026-08-08)

## Corpus Check
- 25 files · ~107,534 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 86 nodes · 147 edges · 9 communities (7 shown, 2 thin omitted)
- Extraction: 76% EXTRACTED · 24% INFERRED · 0% AMBIGUOUS · INFERRED: 35 edges (avg confidence: 0.86)
- Token cost: 139,826 input · 0 output

## Community Hubs (Navigation)
- Resend/Re-segmentation/Fatigue Contracts
- CI, Release History & Onboarding
- Method Formats & Guardrails
- package.json Manifest
- validate.mjs Internals
- Production Implementation Guide
- init.mjs Internals
- Resource Gate & Security
- install.sh Script

## God Nodes (most connected - your core abstractions)
1. `Motor Empiricus README (project overview)` - 19 edges
2. `SKILL.md — Motor Empiricus portable method` - 17 edges
3. `Architecture doc (data flow and storage contracts)` - 13 edges
4. `Production implementation guide` - 10 edges
5. `"What the method enforces" guardrail list` - 10 edges
6. `v1.1.0 release (2026-08-08): subject playbook, resend, resegmentation, fatigue gate, CTA discipline` - 8 edges
7. `10-message evergreen cadence (drip_0..drip_25)` - 7 edges
8. `B2B AI-training campaign intake (filled example)` - 6 edges
9. `Lesson format (teach one usable idea, no selling)` - 6 edges
10. `Letter format (argue one thesis or offer)` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Editorial lesson email screenshot ("Um diagnóstico interno em 30 minutos", Aula 3/4, CF Gauss)` --conceptually_related_to--> `Lesson format (teach one usable idea, no selling)`  [INFERRED]
  assets/output-editorial-lesson.png → SKILL.md
- `Motor Empiricus README (project overview)` --references--> `Weekly digest email screenshot ("O essencial da semana", CF Gauss blog)`  [EXTRACTED]
  README.md → assets/output-weekly-digest.png
- `Hero image — three stacked document cards on a connected path` --conceptually_related_to--> `Lesson format (teach one usable idea, no selling)`  [INFERRED]
  assets/hero.png → SKILL.md
- `Hero image — three stacked document cards on a connected path` --conceptually_related_to--> `Letter format (argue one thesis or offer)`  [INFERRED]
  assets/hero.png → SKILL.md
- `Weekly digest email screenshot ("O essencial da semana", CF Gauss blog)` --conceptually_related_to--> `Scheduled sequence job (daily run, 11-step pipeline)`  [INFERRED]
  assets/output-weekly-digest.png → docs/IMPLEMENTATION.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Lesson / Letter / Echo — the three-format method** — skill_lesson_format, skill_letter_format, skill_echo_format, assets_project_card_diagram [INFERRED 0.85]
- **Real inbox captures from the CF Gauss reference implementation** — assets_output_campaign_letter_email_screenshot, assets_output_editorial_lesson_email_screenshot, assets_output_weekly_digest_email_screenshot, readme_overview [EXTRACTED 1.00]
- **Anti-fabrication guardrails spanning method, contribution policy and compliance gate** — skill_claim_discipline, skill_big_idea, contributing_overview, docs_implementation_compliance_gate [INFERRED 0.75]

## Communities (9 total, 2 thin omitted)

### Community 0 - "Resend/Re-segmentation/Fatigue Contracts"
Cohesion: 0.22
Nodes (15): v1.1.0 release (2026-08-08): subject playbook, resend, resegmentation, fatigue gate, CTA discipline, Click contract (TS type; segmentTag only set on intentional link), Eligibility clock (anchored to enrollment time, not job execution time), Failure visibility (zero successful sends + attempted failures = failed run), Fatigue gate (architecture contract; rolling open-rate check, own alert channel), Lead contract (TS type; segment mutable post-capture), Message contract (TS type; server-side merge token rendering), Architecture doc (data flow and storage contracts) (+7 more)

### Community 1 - "CI, Release History & Onboarding"
Cohesion: 0.22
Nodes (12): Validate CI workflow (npm test on push/PR), Hero image — three stacked document cards on a connected path, Editorial lesson email screenshot ("Um diagnóstico interno em 30 minutos", Aula 3/4, CF Gauss), v1.0.0 release (2026-08-07): initial portable method, validator, init script, docs, B2B AI-training campaign intake (filled example), Closed-loop architecture diagram (lead ↔ sequence ↔ resource ↔ offer), Motor Empiricus README (project overview), scripts/init.mjs (creates a campaign workspace) (+4 more)

### Community 2 - "Method Formats & Guardrails"
Cohesion: 0.33
Nodes (13): Campaign letter email screenshot ("Anthropic tem novo líder de governança", CF Gauss), Project-card SVG diagram (Lesson → Letter → Echo → Reply, open source badge), "What the method enforces" guardrail list, Big Idea (named market-tension thesis per segment), Claim discipline (every number resolves to a sourced fact ID), Echo format (revisit thesis through a new angle, never resend shortened), Fatigue gate (skip, never cancel, a lead whose recent sends went unopened), Final audit checklist before approving a sequence (+5 more)

### Community 3 - "package.json Manifest"
Cohesion: 0.15
Nodes (12): description, engines, node, license, name, private, scripts, init (+4 more)

### Community 4 - "validate.mjs Internals"
Cohesion: 0.15
Nodes (9): banned, bannedSubjectWords, campaignDir, errors, expected, factIds, requiredPostscripts, requireNamePersonalizationFor (+1 more)

### Community 5 - "Production Implementation Guide"
Cohesion: 0.36
Nodes (8): Weekly digest email screenshot ("O essencial da semana", CF Gauss blog), Activation checklist (DNS, test email, unsubscribe test, controlled failure test), Compliance gate (deterministic checks; LLM cannot self-approve its draft), Data model (leads, email_suppressions, email_log, campaigns tables), Launch campaigns (one active campaign, one thesis, minimum rest period), Production implementation guide, Required email headers (List-Unsubscribe, one-click unsubscribe), Scheduled sequence job (daily run, 11-step pipeline)

### Community 6 - "init.mjs Internals"
Cohesion: 0.40
Nodes (4): destination, root, scriptDir, source

## Knowledge Gaps
- **27 isolated node(s):** `name`, `version`, `private`, `description`, `type` (+22 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Motor Empiricus README (project overview)` connect `CI, Release History & Onboarding` to `Resend/Re-segmentation/Fatigue Contracts`, `Method Formats & Guardrails`, `Production Implementation Guide`, `Resource Gate & Security`?**
  _High betweenness centrality (0.154) - this node is a cross-community bridge._
- **Why does `Architecture doc (data flow and storage contracts)` connect `Resend/Re-segmentation/Fatigue Contracts` to `CI, Release History & Onboarding`, `Resource Gate & Security`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `SKILL.md — Motor Empiricus portable method` connect `Method Formats & Guardrails` to `Resend/Re-segmentation/Fatigue Contracts`, `CI, Release History & Onboarding`, `Resource Gate & Security`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Motor Empiricus README (project overview)` (e.g. with `Validate CI workflow (npm test on push/PR)` and `10-message evergreen cadence (drip_0..drip_25)`) actually correct?**
  _`Motor Empiricus README (project overview)` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `"What the method enforces" guardrail list` (e.g. with `Fatigue gate (architecture contract; rolling open-rate check, own alert channel)` and `Big Idea (named market-tension thesis per segment)`) actually correct?**
  _`"What the method enforces" guardrail list` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _27 weakly-connected nodes found - possible documentation gaps or missing edges._