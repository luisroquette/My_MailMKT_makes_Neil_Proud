import type { LeadNurture } from "@mymailmkt/nucleo";

/**
 * Real marketing-campaign cadence — the fields the CF Gauss reference stores
 * per campaign (nurture_marketing_campaigns) and edits by screen, never by
 * deploy: send_hour, interval_days, weekdays, audience_filter, throttle_exempt.
 */

export interface CampanhaDeMarketing {
  id: string;
  slug: string;
  name: string;
  offerName: string;
  offerUrl: string;
  objective: string;
  audience: string;
  status: "active" | "paused" | "completed";
  cadence: "hourly" | "daily" | "weekly";
  /** 0 (Sunday) to 6 (Saturday). */
  weekdays: number[];
  timezone: string;
  /** YYYY-MM-DD. */
  startDate: string;
  endDate: string | null;
  nextSendOn: string | null;
  sendIndex: number;
  sentOccurrences: number;
  lastSentOn: string | null;
  pausedAt: string | null;
  throttleExempt: boolean | null;
  intervalDays: number;
  /** "HH:MM". */
  sendHour: string;
  audienceFilter: {
    segmentos?: string[];
    fontes?: string[];
    idadeMinimaDias?: number;
  } | null;
}

/** Local calendar day (YYYY-MM-DD) in America/Sao_Paulo. */
function diaLocal(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/**
 * Hour-only comparison, truncated on purpose: a ":00" tick reaches
 * ":30"/":45" defaults (same fidelity contract as the agenda).
 */
export function estaAtivaNaHora(
  c: CampanhaDeMarketing,
  horaLocal: string,
  diaDaSemana: number,
): boolean {
  if (c.status !== "active") return false;
  if (!c.weekdays.includes(diaDaSemana)) return false;
  if (c.sendHour.slice(0, 2) !== horaLocal.slice(0, 2)) return false;
  if (c.endDate && c.endDate < diaLocal(new Date().toISOString())) return false;
  return true;
}

/**
 * Occurrence key — the seed of the idempotency key. Hourly cadence changes
 * every hour; daily/weekly is stable within the day. NEVER derived from
 * `next_send_on` (the agenda does not advance within the day — two rounds on
 * the same day would collide on the same idempotency key and the second
 * email would be silently dropped as a duplicate). `diaLocal` comes from the
 * caller (Relogio port), keeping the function pure.
 */
export function ocorrenciaId(
  c: CampanhaDeMarketing,
  horaLocal: string,
  diaLocalISO: string,
): string {
  const hora = horaLocal.slice(0, 2);
  if (c.cadence === "hourly") return `${diaLocalISO}-${hora}`;
  return diaLocalISO;
}

/**
 * Audience filter: segments IN, sources IN, minimum lead age in days
 * (excluded when the lead has no parseable createdAt and a minimum is set).
 */
export function candidatos(
  c: CampanhaDeMarketing,
  leads: LeadNurture[],
  agoraIso: string,
): LeadNurture[] {
  const f = c.audienceFilter;
  if (!f) return leads;

  return leads.filter((l) => {
    if (f.segmentos && f.segmentos.length > 0) {
      if (!l.segment || !f.segmentos.includes(l.segment)) return false;
    }
    if (f.fontes && f.fontes.length > 0) {
      if (!l.source || !f.fontes.includes(l.source)) return false;
    }
    if (f.idadeMinimaDias !== undefined) {
      const criado = new Date(l.createdAt).getTime();
      if (!Number.isFinite(criado)) return false;
      const idadeDias = (new Date(agoraIso).getTime() - criado) / (24 * 60 * 60 * 1000);
      if (idadeDias < f.idadeMinimaDias) return false;
    }
    return true;
  });
}
