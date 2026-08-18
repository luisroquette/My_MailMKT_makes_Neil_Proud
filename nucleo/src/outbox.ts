import type { EnviadorDeEmail, FilaOutbox, EmailParaEnviar, DependenciasDoNucleo } from "./contratos";

/**
 * Durable outbox protocol — the guarantee that an email is delivered exactly
 * once even if the process dies mid-send.
 *
 * Fidelity contract (CF Gauss reference, `nurture_email_outbox` + 4 atomic
 * RPCs): reserve → claim (lease 5min) → send → complete. Definitive failure
 * releases the reservation (retry tomorrow); AMBIGUOUS results (timeout, 5xx,
 * idempotency 409) fail CLOSED — the reservation is preserved and the email
 * is NEVER resent, because a duplicate is worse than a gap.
 */

/** Lease of a claimed outbox row before another worker may steal it. */
export const LEASE_MS = 5 * 60 * 1000;

/** Rows stuck past this age become dead-letter and raise an alert. */
export const DEAD_LETTER_MS = 23 * 60 * 60 * 1000;

/** Hard loop budget — must stay below the 300s platform maxDuration. */
export const PRAZO_DE_LOOP_MS = 240_000;

/** ISO instant `DEAD_LETTER_MS` before `agoraIso` — pending rows older than
 * this are not retried, they are dead-lettered. */
export function prazoDeRetomada(agoraIso: string): string {
  return new Date(new Date(agoraIso).getTime() - DEAD_LETTER_MS).toISOString();
}

export type ResultadoDoOutbox =
  | { resultado: "enviado" }
  | { resultado: "reagendado"; detalhe?: string }
  | { resultado: "sem_fila"; detalhe?: string };

/**
 * Run one email through the outbox protocol. The caller has ALREADY reserved
 * the durable send log (unique constraint) — this layer only guarantees the
 * outbox state machine.
 */
export async function enviarComOutbox(
  deps: { fila: FilaOutbox; enviador: EnviadorDeEmail; log(msg: string, meta?: unknown): void },
  e: EmailParaEnviar,
): Promise<ResultadoDoOutbox> {
  const reservado = await deps.fila.reservar(e);
  if (!reservado) {
    return { resultado: "sem_fila", detalhe: "outbox recusou a reserva" };
  }

  const resultado = await deps.enviador.enviar(e);
  if (resultado === "entregue") {
    await deps.fila.concluir(e.idempotencyKey);
    return { resultado: "enviado" };
  }

  if (resultado === "falhaDefinitiva") {
    // Release: the email is retried tomorrow (reservation rolled back).
    await deps.fila.liberar(e.idempotencyKey);
    return { resultado: "reagendado", detalhe: "falha definitiva — liberado para retry" };
  }

  // "ambiguo" — fail closed: preserve the reservation, never resend.
  deps.log("[outbox] resultado ambíguo — reserva preservada (fail-closed)", {
    idempotencyKey: e.idempotencyKey,
  });
  return { resultado: "reagendado", detalhe: "resultado ambíguo — reserva preservada" };
}

/** Orphan cleanup window: reserved, never attempted, older than 1h. */
export const ORFAO_MS = 60 * 60 * 1000;

/**
 * Hard-delete orphan outbox rows (reserved > 1h ago, never attempted).
 * MUST run BEFORE the throttle state is loaded — inverting the order makes
 * an abandoned reservation block a legitimate lead across all motors.
 */
export async function limparReservasOrfas(deps: DependenciasDoNucleo, agoraIso: string): Promise<number> {
  const corte = new Date(new Date(agoraIso).getTime() - ORFAO_MS).toISOString();
  const removidas = await deps.fila.removerOrfas(corte);
  if (removidas > 0) {
    deps.log("[outbox] reservas órfãs removidas", { removidas });
  }
  return removidas;
}

/** Minimum interval before a released row may be retried ("retry tomorrow"). */
export const RETRY_MINIMO_MS = 20 * 60 * 60 * 1000;

/**
 * Resume pending outbox rows. Deterministic policy, no I/O beyond the ports:
 *
 * - older than 23h → dead-letter: alert + discard (terminal state, never
 *   relisted, never resent);
 * - last attempt less than 20h ago → skip (released rows are NOT resent in
 *   the same day — a transient definitive failure must not loop);
 * - suppressed email (opt-out between rounds) → release, never send;
 * - otherwise claim (lease) and run the same state machine.
 */
export async function retomarEmailsPendentes(
  deps: DependenciasDoNucleo,
  agoraIso: string,
): Promise<{ retomadas: number; deadLetters: number }> {
  const pendentes = await deps.fila.listarPendentes();
  const supressoes = await deps.repo.lerSupressoes();
  const agora = new Date(agoraIso).getTime();
  let retomadas = 0;
  let deadLetters = 0;

  for (const p of pendentes) {
    const idadeMs = agora - new Date(p.criadoEm).getTime();
    if (idadeMs >= DEAD_LETTER_MS) {
      deadLetters += 1;
      deps.log("[alerta] outbox dead-letter (>23h)", { idempotencyKey: p.idempotencyKey });
      await deps.fila.descartar(p.idempotencyKey);
      continue;
    }
    if (p.ultimaTentativaEm) {
      const desdeTentativa = agora - new Date(p.ultimaTentativaEm).getTime();
      if (desdeTentativa < RETRY_MINIMO_MS) continue; // retry amanhã, não hoje
    }
    const reivindicado = await deps.fila.reivindicar(p.idempotencyKey);
    if (!reivindicado) continue;

    if (supressoes.has(reivindicado.to.trim().toLowerCase())) {
      await deps.fila.liberar(p.idempotencyKey);
      deps.log("[outbox] retomada pulada por opt-out", { idempotencyKey: p.idempotencyKey });
      continue;
    }

    const resultado = await deps.enviador.enviar(reivindicado);
    if (resultado === "entregue") {
      await deps.fila.concluir(p.idempotencyKey);
      retomadas += 1;
    } else if (resultado === "falhaDefinitiva") {
      await deps.fila.liberar(p.idempotencyKey);
    }
    // ambiguous: fail closed, reservation preserved, next round tries again.
  }

  return { retomadas, deadLetters };
}
