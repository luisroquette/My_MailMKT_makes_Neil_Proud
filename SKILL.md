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

## Production requirements

- Verified sender domain.
- Monitored reply-to.
- One-click unsubscribe and `List-Unsubscribe` headers.
- Suppression list checked before every send.
- Idempotent send log written before the provider call and released only on retryable failure.
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
