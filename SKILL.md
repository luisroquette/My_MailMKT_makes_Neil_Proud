---
name: motor-empiricus
description: Design and audit compliant direct-response email systems with a 10-message lesson, letter and echo sequence; named Big Ideas; sourced claims; gated resources; and low-friction conversion offers. Use when building lead nurture, lifecycle email, launch campaigns, lead magnets, gift pages or editorial sales sequences.
---

# Motor Empiricus

Build a direct-response publishing system that earns attention before asking for action.

## Required order

Do not write campaign copy until these inputs are explicit:

1. Product, price range and sales cycle.
2. Two to six lead segments that can be resolved from real captured data.
3. One low-friction conversion offer per segment.
4. One useful standalone resource per segment.
5. The final conversion channel: reply, booking, form or checkout.
6. A fact pack with source URL, access date and allowed wording.
7. The legal and ethical floor for the niche.
8. Sender domain, monitored reply-to, consent and unsubscribe mechanics.

If any item is unknown, ask for it. Do not invent it.

## The 10-message cadence

| Step | Day | Format | Purpose |
|---|---:|---|---|
| `drip_0` | 0 | lesson | Welcome, teach, tease the effect of the Big Idea. |
| `drip_1` | 1 | letter | Reveal and name the Big Idea. |
| `drip_3` | 3 | lesson | Deepen understanding. |
| `drip_5` | 5 | echo | Return through evidence or sourced data. |
| `drip_7` | 7 | lesson | Give a tool, checklist or scorecard. |
| `drip_9` | 9 | letter | Present the low-friction offer. |
| `drip_12` | 12 | echo | Answer an honest objection and the cost of delay. |
| `drip_14` | 14 | lesson | Teach how to compare solutions, including yours. |
| `drip_18` | 18 | letter | Make the final truthful call for the offer. |
| `drip_25` | 25 | echo | Re-engage with a simple human response path. |

## Subject line

The subject is the first thing a lead judges — most spam reports cite the subject line alone. Every subject falls into one of four proven angles; pick the one the step actually earns, never fabricate the angle:

- **Direct benefit.** State what opening delivers. No trick, no ambiguity.
- **Scarcity or urgency.** Only when the constraint is real — never fabricate a deadline or limited slot.
- **Social proof or case.** A concrete, sourced result works better than a claim about the product.
- **Curiosity.** Withhold one detail on purpose. Never withhold information the reader needs to consent or convert safely.

Personalize the subject with the reader's name on the steps where first impression compounds: the welcome step and the final re-engagement step, at minimum. Use the token `{{lead.firstName}}` — do not hardcode a name. When checking subject length against the project's mobile character limit, count the token as a short rendered name (a representative sample name), not the literal token text.

Never use a spam-trigger word in a subject line: generic urgency ("urgent", "act now", "until today"), generic free-offer bait ("free", "no cost" used as the hook itself), or a command with no benefit ("click here"). Keep the project's `bannedSubjectWords` list current for the language and market.

## CTA copy

State what the reader gets, not the mechanical action. "Click here" and "download now" describe the click, not the reader's outcome — replace them with the actual benefit the click delivers: `Manage more projects in less time`, not `Download Now`; `See what's slowing your queue`, not `Click Here`.

`bannedSubjectWords` applies to `ctaLabel` too, for the same reason it applies to the subject: a generic command reads as filler at best and a spam signal at worst.

## Formats

### Lesson

- Teach one usable idea.
- Keep selling out of the body.
- Use one practical CTA.
- End by accurately previewing the next message.

### Letter

- Argue one thesis or one offer.
- Open with the reader's name.
- Establish two observable facts before the thesis.
- Name the thesis in plain language.
- Answer one honest objection.
- Explain the real risk reversal.
- Use one CTA and one P.S. that points to the next message.

### Echo

- Revisit the same thesis through a genuinely new angle.
- Use evidence, an objection, or a final truthful call.
- Never resend the letter in shorter form.

## Resend to non-openers

Do not resend every step. Pick the one or two steps where a missed open costs the most — typically the Big Idea reveal or the low-friction offer — and resend once, 5 to 7 days later, only to leads who never opened the original.

- Reformulate the subject. Never resend the same subject, and never resend a shortened copy of the letter.
- Reuse the body, CTA and postscript unchanged. The resend is a second chance at the inbox, not a second argument.
- One resend per step, ever. A lead who ignores the resend too moves on in the sequence normally.
- This depends on your provider reporting opens. If it doesn't, skip resends rather than guessing.

## The Big Idea

Create one memorable, defensible thesis per segment. It should name a structural tension in the reader's market. It should not be a product slogan.

Useful formula:

```text
real market tension + memorable name + overlooked consequence for this reader
```

Reject a Big Idea if it depends on an unsupported forecast, fake urgency, a fabricated customer story or a guaranteed outcome.

## Claim discipline

- Every external number must reference a fact ID.
- Every fact ID must include the exact claim, qualifier, source URL and access date.
- Preserve scope: country, population, tariff, period and study conditions.
- State foreign-study context when relevant.
- Use conditional language for outcomes that depend on implementation.
- Never invent testimonials, counters, deadlines, stock levels or availability.

## Gated resource loop

The email links to a useful standalone resource.

- Known subscriber with a valid server-side token: open the resource.
- Organic visitor: show the promise and capture form, then issue the token server-side.
- Successful capture: resolve the lead segment and enter the correct sequence.
- Locked content must not be sent to the browser in a hidden component or payload.

## Re-segmentation from behavior

The segment resolved at intake is the default, not a permanent label. A lead who clicks a CTA that was explicitly built to signal a different segment (a product-specific resource, a segment-tagged link) may move to that segment mid-sequence.

- Only a tagged click moves a lead. Never re-segment from a soft signal — a generic click, time on page, or a guess.
- Re-segmentation never restarts the sequence. The day clock keeps counting from the original enrollment.
- Everything sent before the move stays as sent. Only what has not gone out yet renders under the new segment's Big Idea and facts.

## Production requirements

- Verified sender domain.
- Monitored reply-to.
- One-click unsubscribe and `List-Unsubscribe` headers.
- Suppression list checked before every send.
- Idempotent send log written before the provider call and released only on retryable failure.
- A fatigue gate: skip (never cancel) the next due send for a lead whose last few messages all went unopened; log the skip, do not alert on it, and never gate a re-engagement echo.
- Batch limits, visible failures and scheduled-job authentication.
- Test email and full email-to-resource flow before activation.

## Final audit

Before approving a sequence, verify:

- Ten unique steps at the intended days.
- One format and one job per step.
- Subject lines fit the mobile limit selected by the project.
- Every number resolves to the fact pack.
- One HTTPS CTA per message.
- P.S. chain matches the actual next message.
- No fabricated proof, fake scarcity or banned claim.
- Consent, unsubscribe and suppression are implemented.
- The resource is useful even if the lead never buys.
