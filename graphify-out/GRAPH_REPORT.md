# Graph Report - .  (2026-08-08)

## Corpus Check
- 4 files · ~107,581 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 113 nodes · 161 edges · 10 communities (8 shown, 2 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.8)
- Token cost: 99,964 input · 0 output

## Community Hubs (Navigation)
- Onboarding, Screenshots & Production Checklists
- Release History & Repo Map
- Cadence Steps & Claim Discipline
- package.json Manifest
- validate.mjs Internals
- Data Contracts (Click/Lead/Message/Fatigue/Resend)
- Big Idea & Letter/Offer Steps
- init.mjs Internals
- install.sh Script
- Project-card Diagram

## God Nodes (most connected - your core abstractions)
1. `Motor Empiricus README (project overview)` - 16 edges
2. `Version 1.0.0 (2026-08-07) — portable SKILL.md method, validator, scaffolder, docs, example, CI` - 16 edges
3. `Version 1.1.0 (2026-08-08) — subject-line playbook, resend, re-segmentation, fatigue gate, CTA discipline` - 15 edges
4. `The 10-message cadence` - 13 edges
5. `Architecture doc (data flow and storage contracts)` - 11 edges
6. `Production implementation guide` - 8 edges
7. `Subject line section` - 8 edges
8. `Final audit checklist` - 6 edges
9. `Scheduled sequence job (daily run, 11-step pipeline)` - 5 edges
10. `Lesson format` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Weekly digest email screenshot ("O essencial da semana", CF Gauss blog)` --conceptually_related_to--> `Scheduled sequence job (daily run, 11-step pipeline)`  [INFERRED]
  assets/output-weekly-digest.png → docs/IMPLEMENTATION.md
- `Motor Empiricus README (project overview)` --references--> `Hero image — three stacked document cards on a connected path`  [EXTRACTED]
  README.md → assets/hero.png
- `Motor Empiricus README (project overview)` --references--> `Campaign letter email screenshot ("Anthropic tem novo líder de governança", CF Gauss)`  [EXTRACTED]
  README.md → assets/output-campaign-letter.png
- `Motor Empiricus README (project overview)` --references--> `Editorial lesson email screenshot ("Um diagnóstico interno em 30 minutos", Aula 3/4, CF Gauss)`  [EXTRACTED]
  README.md → assets/output-editorial-lesson.png
- `Motor Empiricus README (project overview)` --references--> `Weekly digest email screenshot ("O essencial da semana", CF Gauss blog)`  [EXTRACTED]
  README.md → assets/output-weekly-digest.png

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Open-tracking dependent lead-gating mechanisms (resend + fatigue gate), introduced together in v1.1.0** — skill_md_resend_to_non_openers, skill_md_fatigue_gate, changelog_md_v1_1_0 [INFERRED 0.75]
- **Behavior-driven lead segment resolution pattern: intake checklist, capture-time resolution, and post-capture mutation** — skill_md_resegmentation_from_behavior, skill_md_gated_resource_loop, skill_md_required_order_checklist [INFERRED 0.70]
- **Subject line and CTA anti-spam discipline sharing one banned-words list** — skill_md_subject_line_section, skill_md_cta_copy_section, skill_md_banned_subject_words [EXTRACTED 1.00]
- **Real inbox captures from the CF Gauss reference implementation** — assets_output_campaign_letter_email_screenshot, assets_output_editorial_lesson_email_screenshot, assets_output_weekly_digest_email_screenshot, readme_overview [EXTRACTED 1.00]

## Communities (10 total, 2 thin omitted)

### Community 0 - "Onboarding, Screenshots & Production Checklists"
Cohesion: 0.14
Nodes (20): Validate CI workflow (npm test on push/PR), Hero image — three stacked document cards on a connected path, Campaign letter email screenshot ("Anthropic tem novo líder de governança", CF Gauss), Editorial lesson email screenshot ("Um diagnóstico interno em 30 minutos", Aula 3/4, CF Gauss), Weekly digest email screenshot ("O essencial da semana", CF Gauss blog), Activation checklist (DNS, test email, unsubscribe test, controlled failure test), Compliance gate (deterministic checks; LLM cannot self-approve its draft), Data model (leads, email_suppressions, email_log, campaigns tables) (+12 more)

### Community 1 - "Release History & Repo Map"
Cohesion: 0.16
Nodes (20): CHANGELOG.md (Motor Empiricus), docs/ARCHITECTURE.md, examples/b2b-ai-training (validator-safe reference campaign), CI: npm test on every push and pull request, docs/IMPLEMENTATION.md, scripts/init.mjs (campaign workspace scaffolder), scripts/install.sh (Claude Code + Codex install destination), templates/sequence.json (+12 more)

### Community 2 - "Cadence Steps & Claim Discipline"
Cohesion: 0.16
Nodes (18): Claim discipline (fact IDs, source URL, access date, scope), drip_0 — Day 0 welcome lesson, teases Big Idea, drip_12 — Day 12 echo answers honest objection + cost of delay, drip_14 — Day 14 lesson teaches how to compare solutions, drip_25 — Day 25 echo re-engages with human response path, drip_3 — Day 3 lesson deepens understanding, drip_5 — Day 5 echo returns via evidence/sourced data, drip_7 — Day 7 lesson gives tool/checklist/scorecard (+10 more)

### Community 3 - "package.json Manifest"
Cohesion: 0.15
Nodes (12): description, engines, node, license, name, private, scripts, init (+4 more)

### Community 4 - "validate.mjs Internals"
Cohesion: 0.15
Nodes (9): banned, bannedSubjectWords, campaignDir, errors, expected, factIds, requiredPostscripts, requireNamePersonalizationFor (+1 more)

### Community 5 - "Data Contracts (Click/Lead/Message/Fatigue/Resend)"
Cohesion: 0.24
Nodes (11): Click contract (TS type; segmentTag only set on intentional link), Eligibility clock (anchored to enrollment time, not job execution time), Failure visibility (zero successful sends + attempted failures = failed run), Fatigue gate (architecture contract; rolling open-rate check, own alert channel), Lead contract (TS type; segment mutable post-capture), Message contract (TS type; server-side merge token rendering), Architecture doc (data flow and storage contracts), Re-segmentation from clicks (architecture contract; audit trail, clock unaffected) (+3 more)

### Community 6 - "Big Idea & Letter/Offer Steps"
Cohesion: 0.29
Nodes (8): The Big Idea (real market tension + memorable name + overlooked consequence), drip_1 — Day 1 letter reveals and names the Big Idea, drip_18 — Day 18 letter makes final truthful call for offer, drip_9 — Day 9 letter presents low-friction offer, Fatigue gate (skip, never cancel, unopened-message check), Letter format, Production requirements, Resend to non-openers rule

### Community 7 - "init.mjs Internals"
Cohesion: 0.40
Nodes (4): destination, root, scriptDir, source

## Knowledge Gaps
- **39 isolated node(s):** `scriptDir`, `root`, `source`, `destination`, `campaignDir` (+34 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Version 1.0.0 (2026-08-07) — portable SKILL.md method, validator, scaffolder, docs, example, CI` connect `Release History & Repo Map` to `Cadence Steps & Claim Discipline`, `Big Idea & Letter/Offer Steps`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `Version 1.1.0 (2026-08-08) — subject-line playbook, resend, re-segmentation, fatigue gate, CTA discipline` connect `Release History & Repo Map` to `Cadence Steps & Claim Discipline`, `Big Idea & Letter/Offer Steps`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `Motor Empiricus README (project overview)` connect `Onboarding, Screenshots & Production Checklists` to `Data Contracts (Click/Lead/Message/Fatigue/Resend)`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Version 1.1.0 (2026-08-08) — subject-line playbook, resend, re-segmentation, fatigue gate, CTA discipline` (e.g. with `Version 1.0.0 (2026-08-07) — portable SKILL.md method, validator, scaffolder, docs, example, CI` and `Version 1.1.1 (2026-08-08) — skill identifier renamed to My_mailmarketing_makes_Neil_Patel_proud; project/repo name unchanged`) actually correct?**
  _`Version 1.1.0 (2026-08-08) — subject-line playbook, resend, re-segmentation, fatigue gate, CTA discipline` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `scriptDir`, `root`, `source` to the rest of the system?**
  _39 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Onboarding, Screenshots & Production Checklists` be split into smaller, more focused modules?**
  _Cohesion score 0.1380952380952381 - nodes in this community are weakly interconnected._