import type { LinhaLogDeEnvio } from "./contratos";
import type { RegrasThrottle } from "./config";

/**
 * Shared fatigue throttle — the single point that limits how many emails a
 * lead receives. The CF Gauss incident of 17/08/2026 happened because five
 * independent runners had five independent throttle states and one lead got
 * three emails in one hour. Fidelity contract:
 *
 * - one state loaded ONCE per dispatch round (after orphan reservations are
 *   cleaned), shared by ALL motors in memory;
 * - `aplicarEnvio` mutates that state so the second motor sees what the
 *   first one just served;
 * - loading window = max(24h, minHorasEntreEnvios);
 * - local day always computed in America/Sao_Paulo (never `getHours()` —
 *   the runtime is UTC).
 */

const TIMEZONE = "America/Sao_Paulo";

// Module-scoped formatter — one per process, not per check (hundreds per round).
const FORMATADOR_DIA_LOCAL = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export interface EstadoThrottle {
  /** email (normalized lowercase) -> ISO send timestamps within the window. */
  enviadosPorEmail: Map<string, string[]>;
}

/** Local calendar day (YYYY-MM-DD) of an ISO instant in America/Sao_Paulo. */
function diaLocal(iso: string): string {
  return FORMATADOR_DIA_LOCAL.format(new Date(iso));
}

export function carregarEstadoThrottle(
  log: LinhaLogDeEnvio[],
  regras: RegrasThrottle,
  agoraIso: string,
): EstadoThrottle {
  const janelaMs = Math.max(24 * 60 * 60 * 1000, regras.minHorasEntreEnvios * 60 * 60 * 1000);
  const corte = new Date(agoraIso).getTime() - janelaMs;
  const enviadosPorEmail = new Map<string, string[]>();
  for (const linha of log) {
    const quando = new Date(linha.sentAt).getTime();
    if (!Number.isFinite(quando) || quando < corte) continue;
    const email = linha.email.trim().toLowerCase();
    if (!email) continue;
    const lista = enviadosPorEmail.get(email) ?? [];
    lista.push(linha.sentAt);
    enviadosPorEmail.set(email, lista);
  }
  return { enviadosPorEmail };
}

export function podeReceber(
  estado: EstadoThrottle,
  email: string,
  regras: RegrasThrottle,
  agoraIso: string,
): { permitido: true } | { permitido: false; motivo: "limite_por_dia" | "intervalo_minimo" } {
  const normalizado = email.trim().toLowerCase();
  if (!normalizado) return { permitido: false, motivo: "limite_por_dia" };

  const enviados = estado.enviadosPorEmail.get(normalizado) ?? [];
  if (enviados.length === 0) return { permitido: true };

  // 1) daily cap — count sends on the SAME local day as "now"
  const diaDeAgora = diaLocal(agoraIso);
  const noDia = enviados.filter((iso) => diaLocal(iso) === diaDeAgora);
  if (noDia.length >= regras.maxPorLeadPorDia) {
    return { permitido: false, motivo: "limite_por_dia" };
  }

  // 2) minimum interval — distance from the most recent send
  const maisRecente = enviados
    .map((iso) => new Date(iso).getTime())
    .filter((t) => Number.isFinite(t))
    .reduce((a, b) => Math.max(a, b), -Infinity);
  const agora = new Date(agoraIso).getTime();
  if (maisRecente !== -Infinity && agora - maisRecente < regras.minHorasEntreEnvios * 60 * 60 * 1000) {
    return { permitido: false, motivo: "intervalo_minimo" };
  }

  return { permitido: true };
}

/** Record a send in the in-memory state — the next motor in the round sees it. */
export function aplicarEnvio(estado: EstadoThrottle, email: string, agoraIso: string): void {
  const normalizado = email.trim().toLowerCase();
  if (!normalizado) return;
  const lista = estado.enviadosPorEmail.get(normalizado) ?? [];
  lista.push(agoraIso);
  estado.enviadosPorEmail.set(normalizado, lista);
}
