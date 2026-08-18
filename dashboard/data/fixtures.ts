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

// --- T18: calendar, rules, agenda, campaigns, copy ---

export interface MarcacaoDoCalendario {
  diaISO: string; // 2026-08-18
  hora: string; // "10:00"
  motor: MotorId;
  colide: boolean; // truncated-hour collision: two motors due on the same tick
}

const DIAS_14 = Array.from({ length: 14 }, (_, i) => {
  const d = new Date("2026-08-18T00:00:00-03:00");
  d.setDate(d.getDate() + i);
  return d.toISOString().slice(0, 10);
});

export const CALENDARIO_14_DIAS: MarcacaoDoCalendario[] = DIAS_14.flatMap((diaISO, i) => {
  const marcacoes: MarcacaoDoCalendario[] = [];
  if (i % 2 === 0) marcacoes.push({ diaISO, hora: "10:00", motor: "mail_mkt", colide: false });
  if (i % 2 === 0) marcacoes.push({ diaISO, hora: "10:00", motor: "esteira", colide: true });
  if (i % 3 === 0) marcacoes.push({ diaISO, hora: "11:00", motor: "digest", colide: false });
  return marcacoes;
});

export interface CampanhaDemo {
  id: string;
  slug: string;
  name: string;
  offerName: string;
  offerUrl: string;
  status: "active" | "paused" | "completed";
  cadence: "hourly" | "daily" | "weekly";
  weekdays: number[];
  sendHour: string;
  intervalDays: number;
  audienceFilter: { segmentos: string[]; fontes: string[]; idadeMinimaDias: number } | null;
  throttleExempt: boolean;
  sentOccurrences: number;
}

export const CAMPANHAS_DEMO: CampanhaDemo[] = [
  {
    id: "c1",
    slug: "marketing-4-0",
    name: "Marketing 4.0",
    offerName: "Workshop Marketing 4.0",
    offerUrl: "https://exemplo.com.br/workshop",
    status: "active",
    cadence: "daily",
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    sendHour: "10:30",
    intervalDays: 1,
    audienceFilter: { segmentos: ["empresa"], fontes: ["lp-kit"], idadeMinimaDias: 3 },
    throttleExempt: false,
    sentOccurrences: 2,
  },
  {
    id: "c2",
    slug: "kit-ia-para-mkt",
    name: "Kit IA para Marketing",
    offerName: "Kit gratuito",
    offerUrl: "https://exemplo.com.br/kit",
    status: "paused",
    cadence: "weekly",
    weekdays: [1, 3],
    sendHour: "14:00",
    intervalDays: 7,
    audienceFilter: null,
    throttleExempt: false,
    sentOccurrences: 0,
  },
  {
    id: "c3",
    slug: "lançamento-anterior",
    name: "Lançamento anterior",
    offerName: "Curso antigo",
    offerUrl: "https://exemplo.com.br/curso-antigo",
    status: "completed",
    cadence: "daily",
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    sendHour: "09:00",
    intervalDays: 1,
    audienceFilter: null,
    throttleExempt: true,
    sentOccurrences: 25,
  },
];

/** Port of nucleo/piso.ts TERMOS_BANIDOS — the demo validates locally;
 *  production runs the same gate on save AND send, server-side. */
export const TERMOS_BANIDOS_DEMO = [
  "garantido", "garantida", "garantia de retorno", "sem risco", "lucro certo",
  "renda garantida", "certeza de resultado", "domine em", "dobre seu salário",
  "aumento de salário", "emprego garantido",
] as const;

export const COPY_DEMO = {
  subject: "A ideia que muda o jogo",
  corpo: "Hoje eu nomeio a ideia central: aplicar IA nos processos de marketing não é sobre ferramentas, é sobre sequência.",
} as const;
