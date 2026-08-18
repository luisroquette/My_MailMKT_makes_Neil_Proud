import type { EnviadorDeEmail, FilaOutbox, EmailParaEnviar } from "./contratos";

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
