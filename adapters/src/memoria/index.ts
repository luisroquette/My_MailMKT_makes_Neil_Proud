import type {
  DependenciasDoNucleo,
  EmailParaEnviar,
  EnviadorDeEmail,
  FilaOutbox,
  LeadNurture,
  LinhaLogDeEnvio,
  Relogio,
  RepositorioDeNurture,
  ReservaLog,
} from "@mymailmkt/nucleo";

/**
 * In-memory adapters — the dashboard demo and the test suite run on these,
 * with no external services. Everything is deterministic: the seed data and
 * the fixed clock never change between runs.
 */

export const AGORA_FIXA = "2026-08-18T10:00:00-03:00";

export interface Seed {
  leads?: LeadNurture[];
  logDeEnvio?: LinhaLogDeEnvio[];
  supressoes?: string[];
}

export interface EstadoInterno {
  leads: LeadNurture[];
  logDeEnvio: LinhaLogDeEnvio[];
  supressoes: Set<string>;
  fila: { reservadas: string[]; concluidas: string[]; liberadas: string[] };
  enviados: string[];
  eventos: { tipo: string; email: string; em: string }[];
}

export function seedPadrao(): Seed {
  return {
    leads: [
      {
        id: "lead-1",
        email: "ana@empresa.com.br",
        name: "Ana Lima",
        whatsapp: "+5511999990001",
        company: "Empresa A",
        segment: "empresa",
        source: "lp-kit",
        createdAt: "2026-08-16T10:00:00-03:00",
      },
      {
        id: "lead-2",
        email: "bruno@empresa.com.br",
        name: "Bruno Reis",
        whatsapp: "+5511999990002",
        company: "Empresa B",
        segment: "aluno",
        source: "workshop",
        createdAt: "2026-08-17T10:00:00-03:00",
      },
      {
        id: "lead-3",
        email: "carla@empresa.com.br",
        name: "Carla Souza",
        whatsapp: "+5511999990003",
        company: "Empresa C",
        segment: "empresa",
        source: "lp-kit",
        createdAt: "2026-08-18T09:00:00-03:00",
      },
    ],
    logDeEnvio: [],
    supressoes: [],
  };
}

export function criarAdaptersMemoria(seed?: Seed): {
  deps: DependenciasDoNucleo;
  estado: EstadoInterno;
} {
  const s = seed ?? seedPadrao();
  const estado: EstadoInterno = {
    leads: [...(s.leads ?? [])],
    logDeEnvio: [...(s.logDeEnvio ?? [])],
    supressoes: new Set(s.supressoes ?? []),
    fila: { reservadas: [], concluidas: [], liberadas: [] },
    enviados: [],
    eventos: [],
  };

  const relogio: Relogio = {
    agoraIso: () => AGORA_FIXA,
    horaLocalHH: () => "10",
    diaDaSemanaLocal: () => 2,
  };

  const repo: RepositorioDeNurture = {
    async lerLeads({ offset, limite }) {
      const itens = estado.leads.slice(offset, offset + limite);
      return { itens, temMais: offset + limite < estado.leads.length, offset };
    },
    async lerSupressoes() {
      return new Set(estado.supressoes);
    },
    async lerLogDeEnvio({ desde }) {
      return estado.logDeEnvio.filter((l) => l.sentAt >= desde);
    },
    async reservarNoLog(r: ReservaLog) {
      const duplicado = estado.logDeEnvio.some(
        (l) => l.email === r.email && l.emailType === r.emailType,
      );
      if (duplicado) return "duplicado";
      estado.logDeEnvio.push({ email: r.email, emailType: r.emailType, sentAt: r.sentAt });
      return "ok";
    },
  };

  const fila: FilaOutbox = {
    async reservar(e: EmailParaEnviar) {
      if (estado.fila.reservadas.includes(e.idempotencyKey)) return false;
      estado.fila.reservadas.push(e.idempotencyKey);
      return true;
    },
    async concluir(k: string) {
      estado.fila.concluidas.push(k);
    },
    async liberar(k: string) {
      estado.fila.liberadas.push(k);
    },
  };

  const enviador: EnviadorDeEmail = {
    async enviar(e: EmailParaEnviar) {
      estado.enviados.push(e.idempotencyKey);
      return "entregue";
    },
  };

  const deps: DependenciasDoNucleo = {
    repo,
    fila,
    enviador,
    eventos: {
      async registrar(ev) {
        estado.eventos.push({ tipo: ev.tipo, email: ev.email, em: ev.em });
      },
    },
    relogio,
    log: () => {},
  };

  return { deps, estado };
}
