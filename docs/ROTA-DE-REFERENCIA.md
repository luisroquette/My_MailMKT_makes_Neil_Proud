# Single-entry route reference

The reference system runs **ONE cron** — `0 * * * *` — that calls the dispatcher.
Five routes per motor is exactly the architecture that caused the 17/08/2026
incident (three emails to one lead in one hour, each runner with its own
throttle state). Never recreate it.

## Next.js route handler (App Router)

```ts
// app/api/cron/nurture-dispatcher/route.ts
import { rodarDispatcher } from "@mymailmkt/nucleo";
import { criarRunnerMailMkt } from "@mymailmkt/motores";
import { criarAdapterSupabase } from "@mymailmkt/adapters";
// ... import your runners for the other motors

export const maxDuration = 300; // must stay above PRAZO_DE_LOOP_MS (240s)

export async function GET(req: Request) {
  // 1. auth guard (CRON_SECRET) — never expose the dispatcher publicly
  // 2. build adapters (supabase + resend) once per invocation
  // 3. run:
  const { resultados, cortePorPrazo } = await rodarDispatcher(
    deps,
    await lerConfigNurture(), // mesclarConfig over the singleton row
    {
      mail_mkt: criarRunnerMailMkt({ /* ... */ }),
      lancamento: /* contract runners */,
      esteira: /* ... */,
      digest: /* ... */,
      video_digest: /* ... */,
    },
    { dry: req.url.includes("dry=1") },
  );
  // 4. alert when cortePorPrazo or a motor has 0 sends + failures
  return Response.json({ resultados, cortePorPrazo });
}
```

## Vercel cron config

```json
{ "crons": [{ "path": "/api/cron/nurture-dispatcher", "schedule": "0 * * * *" }] }
```

## Invariants

- The throttle state is loaded ONCE per round, AFTER orphan reservations are
  cleaned — inverting that order makes an abandoned reservation block a
  legitimate lead across all motors.
- `?dry=1` previews; `?motor=esteira` forces a single motor.
- The route must not send email directly: only `rodarDispatcher` does.
