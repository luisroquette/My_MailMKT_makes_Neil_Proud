import type { ConfigNurture, AgendaEntrada, MotorId } from "./config";

/**
 * Weekly agenda — which motor is due at which hour.
 *
 * Fidelity contract (CF Gauss reference): the dispatcher ticks at the top of
 * the hour ("0 * * * *") and compares by HOUR-ONLY, truncated on purpose —
 * defaults like 09:30 / 10:30 / 20:45 must be reachable by a ":00" tick.
 * A replica that compares exact HH:MM (or ticks at a different minute) would
 * silently break every default schedule.
 */

/** Derive one entry per motor from `config.horarios`, in priority order. */
export function agendaPadraoDe(config: ConfigNurture): AgendaEntrada[] {
  const dias = [0, 1, 2, 3, 4, 5, 6];
  const entradas: AgendaEntrada[] = [];
  for (const motor of config.prioridade) {
    const hora = config.horarios[motor as MotorId];
    if (!hora) continue;
    entradas.push({ dias, horas: [hora], alvo: motor as MotorId });
  }
  return entradas;
}

/**
 * Motors due at the given local hour. `horaLocal` is the hour-only string
 * ("HH") produced by the Relogio port; scheduled "HH:MM" strings are
 * truncated to "HH" before comparison.
 */
export function alvosDaHora(
  agenda: AgendaEntrada[],
  horaLocal: string,
  diaDaSemana: number,
): MotorId[] {
  const alvos: MotorId[] = [];
  for (const entrada of agenda) {
    if (!entrada.dias.includes(diaDaSemana)) continue;
    const horasTruncadas = entrada.horas.map((h) => h.slice(0, 2));
    if (horasTruncadas.includes(horaLocal.slice(0, 2))) {
      alvos.push(entrada.alvo);
    }
  }
  return alvos;
}
