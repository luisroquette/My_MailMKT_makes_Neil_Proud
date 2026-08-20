/**
 * Nurture configuration with safe merge.
 *
 * Fidelity contract (from the reference production system, 17-18/08/2026): rules live
 * in the database (`nurture_config` singleton jsonb) and are merged over
 * `CONFIG_PADRAO`. An absent table changes nothing and logs; an invalid value
 * falls back to the default per field — merge NEVER throws.
 */

export interface RegrasThrottle {
  maxPorLeadPorDia: number;
  minHorasEntreEnvios: number;
}

export interface HorariosDosMotores {
  esteira: string;
  lancamento: string;
  mail_mkt: string;
  digest: string;
  video_digest: string;
}

export type MotorId = keyof HorariosDosMotores;

/** Fixed dispatch order — the reference incident of 17/08 was born from
 * independent schedules; this order is the single source of truth. */
export const PRIORIDADE_DOS_MOTORES: readonly MotorId[] = [
  "mail_mkt",
  "lancamento",
  "esteira",
  "digest",
  "video_digest",
];

export const MOTORES_CONHECIDOS: readonly MotorId[] = [
  "mail_mkt",
  "lancamento",
  "esteira",
  "digest",
  "video_digest",
];

export interface JanelaDeBlackout {
  inicio: string; // "HH:MM"
  fim: string; // "HH:MM"
}

export interface AgendaEntrada {
  /** 0 (Sunday) to 6 (Saturday). */
  dias: number[];
  /** "HH:MM" strings; compared against the hour-truncated tick. */
  horas: string[];
  alvo: MotorId;
}

export interface ConfigNurture {
  throttle: RegrasThrottle;
  prioridade: MotorId[];
  horarios: HorariosDosMotores;
  /** 0 (Sunday) to 6 (Saturday). Reference default: 4 (Thursday). */
  digestDiaDaSemana: number;
  timezone: string;
  janelas: { diasPermitidos: number[]; blackout: JanelaDeBlackout[] };
  fusivel: { email: number };
  /** null = derive from `horarios` (agendaPadraoDe). */
  agenda: AgendaEntrada[] | null;
}

export const CONFIG_PADRAO: ConfigNurture = {
  throttle: { maxPorLeadPorDia: 1, minHorasEntreEnvios: 20 },
  prioridade: [...PRIORIDADE_DOS_MOTORES],
  horarios: {
    esteira: "10:00",
    lancamento: "09:30",
    mail_mkt: "10:30",
    digest: "11:00",
    video_digest: "20:45",
  },
  digestDiaDaSemana: 4,
  timezone: "America/Sao_Paulo",
  janelas: { diasPermitidos: [0, 1, 2, 3, 4, 5, 6], blackout: [] },
  fusivel: { email: 100 },
  agenda: null,
};

// --- pure validators (invalid input NEVER throws — falls back to default) ---

const RE_HORA = /^\d{2}:\d{2}$/;

function ehHoraValida(v: unknown): v is string {
  if (typeof v !== "string" || !RE_HORA.test(v)) return false;
  const [h, m] = v.split(":").map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

function inteiroPositivo(v: unknown): number | null {
  return typeof v === "number" && Number.isInteger(v) && v > 0 ? v : null;
}

function inteiroNaoNegativo(v: unknown): number | null {
  return typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : null;
}

function ehObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function mesclarMotorId(v: unknown): MotorId | null {
  return typeof v === "string" && (MOTORES_CONHECIDOS as readonly string[]).includes(v)
    ? (v as MotorId)
    : null;
}

function mesclarHora(v: unknown, fallback: string): string {
  return ehHoraValida(v) ? v : fallback;
}

/**
 * Merge `parcial` (untrusted jsonb from the database) over CONFIG_PADRAO.
 * Every field is validated independently; invalid values fall back to the
 * default. Never throws.
 */
export function mesclarConfig(parcial: unknown): ConfigNurture {
  const base = CONFIG_PADRAO;
  const p = ehObjeto(parcial) ? parcial : {};

  // throttle
  const t = ehObjeto(p.throttle) ? p.throttle : {};
  const throttle: RegrasThrottle = {
    maxPorLeadPorDia: inteiroPositivo(t.maxPorLeadPorDia) ?? base.throttle.maxPorLeadPorDia,
    minHorasEntreEnvios: inteiroPositivo(t.minHorasEntreEnvios) ?? base.throttle.minHorasEntreEnvios,
  };

  // prioridade: keep only known motors, in the given order, deduped — then
  // APPEND the unlisted motors. The list is an ORDER, not an inclusion
  // filter: omitting a motor must never switch it off silently.
  const prioridadeBruta = Array.isArray(p.prioridade) ? p.prioridade : [];
  const vistos = new Set<MotorId>();
  const prioridade: MotorId[] = [];
  for (const item of prioridadeBruta) {
    const motor = mesclarMotorId(item);
    if (motor && !vistos.has(motor)) {
      vistos.add(motor);
      prioridade.push(motor);
    }
  }
  if (prioridade.length === 0) {
    prioridade.push(...base.prioridade);
    for (const motor of base.prioridade) vistos.add(motor);
  }
  for (const motor of base.prioridade) {
    if (!vistos.has(motor)) {
      vistos.add(motor);
      prioridade.push(motor);
    }
  }

  // horarios
  const h = ehObjeto(p.horarios) ? p.horarios : {};
  const horarios: HorariosDosMotores = {
    esteira: mesclarHora(h.esteira, base.horarios.esteira),
    lancamento: mesclarHora(h.lancamento, base.horarios.lancamento),
    mail_mkt: mesclarHora(h.mail_mkt, base.horarios.mail_mkt),
    digest: mesclarHora(h.digest, base.horarios.digest),
    video_digest: mesclarHora(h.video_digest, base.horarios.video_digest),
  };

  // digest day
  const digestDiaDaSemana =
    inteiroNaoNegativo(p.digestDiaDaSemana) !== null && (p.digestDiaDaSemana as number) <= 6
      ? (p.digestDiaDaSemana as number)
      : base.digestDiaDaSemana;

  // timezone
  const timezone =
    typeof p.timezone === "string" && p.timezone.trim().length > 0
      ? p.timezone.trim()
      : base.timezone;

  // janelas — a fully-invalid array falls back to the default, never to an
  // empty list (an empty list would silently switch off every day).
  const j = ehObjeto(p.janelas) ? p.janelas : {};
  const diasPermitidosFiltrados = Array.isArray(j.diasPermitidos)
    ? (j.diasPermitidos.filter(
        (d): d is number => typeof d === "number" && Number.isInteger(d) && d >= 0 && d <= 6,
      ))
    : base.janelas.diasPermitidos;
  const diasPermitidos =
    diasPermitidosFiltrados.length > 0 ? diasPermitidosFiltrados : base.janelas.diasPermitidos;
  const blackout = Array.isArray(j.blackout)
    ? (j.blackout as unknown[]).filter(
        (b): b is JanelaDeBlackout => ehObjeto(b) && ehHoraValida(b.inicio) && ehHoraValida(b.fim),
      )
    : base.janelas.blackout;

  // fusivel
  const f = ehObjeto(p.fusivel) ? p.fusivel : {};
  const fusivel = {
    email: inteiroPositivo(f.email) ?? base.fusivel.email,
  };

  // agenda: null = derive from horarios (see agenda.ts)
  const agenda: AgendaEntrada[] | null = Array.isArray(p.agenda)
    ? p.agenda
        .filter(ehObjeto)
        .map((a) => ({
          dias: Array.isArray(a.dias)
            ? a.dias.filter(
                (d): d is number => typeof d === "number" && Number.isInteger(d) && d >= 0 && d <= 6,
              )
            : [],
          horas: Array.isArray(a.horas)
            ? a.horas.filter((x): x is string => ehHoraValida(x))
            : [],
          alvo: mesclarMotorId(a.alvo) ?? "mail_mkt",
        }))
        .filter((a) => a.dias.length > 0 && a.horas.length > 0)
    : null;

  return {
    throttle,
    prioridade,
    horarios,
    digestDiaDaSemana,
    timezone,
    janelas: { diasPermitidos, blackout },
    fusivel,
    agenda,
  };
}
