# Graph Report - motor-empiricus  (2026-08-14)

## Corpus Check
- 23 files · ~109,173 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 155 nodes · 193 edges · 18 communities (11 shown, 7 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `91ccaa97`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Product Site and CI
- Release and Repository Map
- Sequence Rules and Lessons
- Campaign Narrative and Proof
- Package Configuration
- Campaign Validator Engine
- Lead Workflow Architecture
- Production Implementation
- Letters and Engagement Gates
- Campaign Workspace Initialization
- Interactive Preflight UI
- Product Site Integrity
- Clipboard Interaction
- Campaign Intake Templates
- Skill Installation
- Campaign Letter Output
- Editorial Lesson Output
- Project Architecture Card

## God Nodes (most connected - your core abstractions)
1. `Version 1.0.0 (2026-08-07) — portable SKILL.md method, validator, scaffolder, docs, example, CI` - 16 edges
2. `Version 1.1.0 (2026-08-08) — subject-line playbook, resend, re-segmentation, fatigue gate, CTA discipline` - 15 edges
3. `The 10-message cadence` - 13 edges
4. `My_MailMKT_makes_Neil_Proud Product Site` - 12 edges
5. `Architecture doc (data flow and storage contracts)` - 10 edges
6. `Subject line section` - 8 edges
7. `Portable Direct-Response Email System` - 8 edges
8. `Production implementation guide` - 7 edges
9. `Final audit checklist` - 6 edges
10. `My_MailMKT_makes_Neil_Proud` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Weekly digest email screenshot ("O essencial da semana", CF Gauss blog)` --conceptually_related_to--> `Scheduled sequence job (daily run, 11-step pipeline)`  [INFERRED]
  assets/output-weekly-digest.png → docs/IMPLEMENTATION.md
- `Hero image — three stacked document cards on a connected path` --conceptually_related_to--> `Closed-Loop Lead Architecture`  [INFERRED]
  assets/hero.png → README.md
- `Deterministic Campaign Validator` --semantically_similar_to--> `Interactive Campaign Preflight`  [INFERRED] [semantically similar]
  README.md → docs/index.html
- `My_MailMKT_makes_Neil_Proud` --semantically_similar_to--> `My_MailMKT_makes_Neil_Proud Product Site`  [INFERRED] [semantically similar]
  README.md → docs/index.html
- `Portable Toolkit Scope` --semantically_similar_to--> `Honest Product Scope`  [INFERRED] [semantically similar]
  README.md → docs/index.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Subject line and CTA anti-spam discipline sharing one banned-words list** — skill_md_subject_line_section, skill_md_cta_copy_section, skill_md_banned_subject_words [EXTRACTED 1.00]
- **Behavior-driven lead segment resolution pattern: intake checklist, capture-time resolution, and post-capture mutation** — skill_md_resegmentation_from_behavior, skill_md_gated_resource_loop, skill_md_required_order_checklist [INFERRED 0.70]
- **Open-tracking dependent lead-gating mechanisms (resend + fatigue gate), introduced together in v1.1.0** — skill_md_resend_to_non_openers, skill_md_fatigue_gate, changelog_md_v1_1_0 [INFERRED 0.75]
- **Campaign Integrity Validation** — _github_workflows_validate_campaign_toolkit, readme_deterministic_campaign_validator, docs_index_campaign_preflight, docs_index_compliance_floor [INFERRED 0.85]
- **My_MailMKT_makes_Neil_Proud Public Identity** — readme_motor_empiricus, docs_index_product_site, docs_favicon_motor_empiricus_seal, docs_robots_product_sitemap [INFERRED 0.85]
- **Portable Lead-Nurture System** — readme_direct_response_email_system, readme_25_day_sequence, readme_claim_ledger, docs_index_campaign_contracts, docs_index_25_day_timeline [INFERRED 0.95]

## Communities (18 total, 7 thin omitted)

### Community 0 - "Product Site and CI"
Cohesion: 0.11
Nodes (21): Campaign Toolkit Validation Job, GitHub Actions Validation Workflow, Node.js 22 Runtime, Product Site Validation, Repository Test Suite, My_MailMKT_makes_Neil_Proud MM Seal, Campaign Intake, Fact Pack and Sequence Contract, Interactive Campaign Preflight (+13 more)

### Community 1 - "Release and Repository Map"
Cohesion: 0.14
Nodes (21): CHANGELOG.md (My_MailMKT_makes_Neil_Proud), scripts/install.sh (Claude Code + Codex install destination), templates/sequence.json, Version 1.1.0 (2026-08-08) — subject-line playbook, resend, re-segmentation, fatigue gate, CTA discipline, Version 1.1.1 (2026-08-08) — skill identifier renamed to my-mailmkt-makes-neil-proud; project/repo name unchanged, My_MailMKT_makes_Neil_Proud (SKILL.md), Banned spam-trigger words (bannedSubjectWords list), Benefit-over-command CTA rule (+13 more)

### Community 2 - "Sequence Rules and Lessons"
Cohesion: 0.13
Nodes (25): docs/ARCHITECTURE.md, examples/b2b-ai-training (validator-safe reference campaign), CI: npm test on every push and pull request, docs/IMPLEMENTATION.md, scripts/init.mjs (campaign workspace scaffolder), Version 1.0.0 (2026-08-07) — portable SKILL.md method, validator, scaffolder, docs, example, CI, scripts/validate.mjs (deterministic campaign validator), The Big Idea (real market tension + memorable name + overlooked consequence) (+17 more)

### Community 3 - "Campaign Narrative and Proof"
Cohesion: 0.15
Nodes (14): Hero image — three stacked document cards on a connected path, 25-Day Email Timeline, Compliance Floor, Production Implementation Guide, 25-Day Ten-Email Sequence, Attention Before Action, Campaign Intake, Claim Ledger (+6 more)

### Community 4 - "Package Configuration"
Cohesion: 0.15
Nodes (12): description, engines, node, license, name, private, scripts, init (+4 more)

### Community 5 - "Campaign Validator Engine"
Cohesion: 0.15
Nodes (9): banned, bannedSubjectWords, campaignDir, errors, expected, factIds, requiredPostscripts, requireNamePersonalizationFor (+1 more)

### Community 6 - "Lead Workflow Architecture"
Cohesion: 0.24
Nodes (11): Click contract (TS type; segmentTag only set on intentional link), Eligibility clock (anchored to enrollment time, not job execution time), Failure visibility (zero successful sends + attempted failures = failed run), Fatigue gate (architecture contract; rolling open-rate check, own alert channel), Lead contract (TS type; segment mutable post-capture), Message contract (TS type; server-side merge token rendering), Architecture doc (data flow and storage contracts), Re-segmentation from clicks (architecture contract; audit trail, clock unaffected) (+3 more)

### Community 7 - "Production Implementation"
Cohesion: 0.31
Nodes (8): Weekly digest email screenshot ("O essencial da semana", CF Gauss blog), Activation checklist (DNS, test email, unsubscribe test, controlled failure test), Compliance gate (deterministic checks; LLM cannot self-approve its draft), Data model (leads, email_suppressions, email_log, campaigns tables), Launch campaigns (one active campaign, one thesis, minimum rest period), Production implementation guide, Required email headers (List-Unsubscribe, one-click unsubscribe), Scheduled sequence job (daily run, 11-step pipeline)

### Community 8 - "Letters and Engagement Gates"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: trace, Source Nodes

### Community 9 - "Campaign Workspace Initialization"
Cohesion: 0.40
Nodes (4): destination, root, scriptDir, source

### Community 11 - "Product Site Integrity"
Cohesion: 0.50
Nodes (3): assets, ids, root

## Knowledge Gaps
- **61 isolated node(s):** `copyButton`, `validatorLab`, `validationStates`, `name`, `version` (+56 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Version 1.0.0 (2026-08-07) — portable SKILL.md method, validator, scaffolder, docs, example, CI` connect `Sequence Rules and Lessons` to `Release and Repository Map`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `Version 1.1.0 (2026-08-08) — subject-line playbook, resend, re-segmentation, fatigue gate, CTA discipline` connect `Release and Repository Map` to `Sequence Rules and Lessons`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `My_MailMKT_makes_Neil_Proud Product Site` connect `Product Site and CI` to `Campaign Narrative and Proof`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Version 1.1.0 (2026-08-08) — subject-line playbook, resend, re-segmentation, fatigue gate, CTA discipline` (e.g. with `Version 1.0.0 (2026-08-07) — portable SKILL.md method, validator, scaffolder, docs, example, CI` and `Version 1.1.1 (2026-08-08) — skill identifier renamed to my-mailmkt-makes-neil-proud; project/repo name unchanged`) actually correct?**
  _`Version 1.1.0 (2026-08-08) — subject-line playbook, resend, re-segmentation, fatigue gate, CTA discipline` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `My_MailMKT_makes_Neil_Proud Product Site` (e.g. with `Product Site Validation` and `My_MailMKT_makes_Neil_Proud Product Sitemap`) actually correct?**
  _`My_MailMKT_makes_Neil_Proud Product Site` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `copyButton`, `validatorLab`, `validationStates` to the rest of the system?**
  _61 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Product Site and CI` be split into smaller, more focused modules?**
  _Cohesion score 0.10952380952380952 - nodes in this community are weakly interconnected._