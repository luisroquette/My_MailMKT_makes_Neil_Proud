/**
 * Canonical fixtures for the demo dashboard.
 *
 * Mirrors adapters/memoria seed (three leads, fixed clock 2026-08-18 10:00
 * America/Sao_Paulo). NEVER dynamic dates: every render is identical.
 * The shapes match the real Supabase schema — see contratos.ts for the
 * actual queries each screen maps to in production.
 */

export const AGORA_FIXA = "2026-08-18T10:00:00-03:00";

export type MotorId = "mail_mkt" | "lancamento" | "esteira" | "digest" | "video_digest";

export interface BlocoDoMotor {
  motor: MotorId;
  nome: string;
  horario: string;
  prioridade: number;
  /** Fidelity: a read that fails is null, NEVER 0. */
  ultimaRodada: { executadoEm: string; candidatos: number; enviados: number; falhas: number } | null;
}

export const BLOCOS_DOS_MOTORES: BlocoDoMotor[] = [
  { motor: "mail_mkt", nome: "Mail MKT", horario: "10:30", prioridade: 1,
    ultimaRodada: { executadoEm: "2026-08-18T10:00:00-03:00", candidatos: 3, enviados: 3, falhas: 0 } },
  { motor: "lancamento", nome: "Lançamento", horario: "09:30", prioridade: 2,
    ultimaRodada: { executadoEm: "2026-08-18T09:00:00-03:00", candidatos: 1, enviados: 1, falhas: 0 } },
  { motor: "esteira", nome: "Esteira (drip)", horario: "10:00", prioridade: 3,
    ultimaRodada: { executadoEm: "2026-08-18T10:00:00-03:00", candidatos: 2, enviados: 2, falhas: 0 } },
  { motor: "digest", nome: "Digest", horario: "11:00", prioridade: 4,
    ultimaRodada: null },
  { motor: "video_digest", nome: "Vídeo digest", horario: "20:45", prioridade: 5,
    ultimaRodada: { executadoEm: "2026-08-17T20:00:00-03:00", candidatos: 5, enviados: 0, falhas: 5 } },
];

export interface Alerta {
  tipo: "motor_zero_falhas" | "campanha_zero" | "dead_letter";
  mensagem: string;
}

export const ALERTAS: Alerta[] = [
  { tipo: "motor_zero_falhas", mensagem: "video_digest: 0 enviados com 5 falhas na rodada de 17/08 20:00" },
];

export interface ResumoDoDia {
  enviadosHoje: number;
  aberturasHoje: number;
  leadsAtivos: number;
  fusivel: { usado: number; limite: number };
}

export const RESUMO_DO_DIA: ResumoDoDia = {
  enviadosHoje: 6,
  aberturasHoje: 4,
  leadsAtivos: 3,
  fusivel: { usado: 6, limite: 100 },
};

export const AGENDA_DE_HOJE: { hora: string; motor: MotorId }[] = [
  { hora: "10:00", motor: "mail_mkt" },
  { hora: "10:00", motor: "esteira" },
  { hora: "11:00", motor: "digest" },
  { hora: "20:00", motor: "video_digest" },
];
