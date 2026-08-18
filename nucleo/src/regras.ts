import type { JanelaDeBlackout } from "./config";

/**
 * Operational windows — blackout and allowed days from `ConfigNurture`.
 * These rules live in the database (editable by screen); the dispatcher
 * applies them BEFORE deciding who is due. A configured blackout must
 * actually stop sends — a rule that is merged but never applied is the
 * silent-fail class the review flags as production risk.
 */

/**
 * Is the hour-only tick inside any blackout window? Ranges may cross
 * midnight ("22:00" → "06:00"). Comparison is hour-only, same truncation
 * contract as the agenda.
 */
export function estaEmBlackout(horaHH: string, blackout: JanelaDeBlackout[]): boolean {
  const h = horaHH.slice(0, 2);
  const agora = Number(h);
  if (!Number.isFinite(agora)) return false;

  for (const janela of blackout) {
    const ini = Number(janela.inicio.slice(0, 2));
    const fim = Number(janela.fim.slice(0, 2));
    if (!Number.isFinite(ini) || !Number.isFinite(fim)) continue;
    if (ini === fim) continue; // degenerate window stops nothing
    const dentro = ini < fim ? agora >= ini && agora < fim : agora >= ini || agora < fim;
    if (dentro) return true;
  }
  return false;
}

export function diaPermitido(diaDaSemana: number, diasPermitidos: number[]): boolean {
  return diasPermitidos.includes(diaDaSemana);
}
