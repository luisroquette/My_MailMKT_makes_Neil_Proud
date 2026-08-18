/**
 * Ports of the portable nurture nucleus.
 *
 * Every dependency of the nucleus is expressed here as an interface, so the
 * same engine can run against Supabase/Resend (fidelity adapters), in-memory
 * fixtures (dashboard demo), or any other stack. Nothing in `nucleo/`,
 * `motores/` or `integracoes/` may import an adapter directly.
 */

export interface LeadNurture {
  id: string;
  email: string;
  name: string;
  whatsapp?: string | null;
  company?: string | null;
  role?: string | null;
  segment?: string | null;
  interest?: string | null;
  source?: string | null;
  page?: string | null;
  /** ISO string. */
  createdAt: string;
}

/** One row of the durable send log (nurture_email_log in the reference). */
export interface LinhaLogDeEnvio {
  email: string;
  emailType: string;
  sentAt: string;
}

export interface Pagina<T> {
  itens: T[];
  temMais: boolean;
  offset: number;
}

export interface ReservaLog {
  leadId: string;
  email: string;
  emailType: string;
  sentAt: string;
}

/** "duplicado" = unique violation (already sent) — caller must skip, never retry. */
export type ResultadoReserva = "ok" | "duplicado" | "erro";

export interface EmailParaEnviar {
  to: string;
  subject: string;
  html: string;
  emailType: string;
  trackingId?: string | null;
  idempotencyKey: string;
}

/**
 * "entregue" = definitive success; "falhaDefinitiva" = release the outbox
 * reservation (retry tomorrow); "ambiguo" = timeout/5xx — keep the
 * reservation, fail closed, NEVER resend.
 */
export type ResultadoEnvio = "entregue" | "falhaDefinitiva" | "ambiguo";

export interface EventoDeEmail {
  tipo: "abertura" | "clique" | "conversao";
  email: string;
  emailType: string;
  url?: string;
  /** ISO string. */
  em: string;
}

/**
 * Wall clock abstraction. The reference system never uses `Date#getHours()`
 * (Vercel runtime is UTC): all wall-clock logic goes through this port with
 * `America/Sao_Paulo`.
 */
export interface Relogio {
  agoraIso(): string;
  /** Local "HH" (hour only, truncated on purpose: a ":00" tick reaches ":30" defaults). */
  horaLocalHH(): string;
  /** 0 (Sunday) to 6 (Saturday) in the local timezone. */
  diaDaSemanaLocal(): number;
}

export interface RepositorioDeNurture {
  /** Paginated — PostgREST silently truncates raw selects at 1000 rows. */
  lerLeads(opts: { offset: number; limite: number }): Promise<Pagina<LeadNurture>>;
  lerSupressoes(): Promise<Set<string>>;
  lerLogDeEnvio(opts: { desde: string }): Promise<LinhaLogDeEnvio[]>;
  reservarNoLog(r: ReservaLog): Promise<ResultadoReserva>;
}

export interface FilaOutbox {
  reservar(e: EmailParaEnviar): Promise<boolean>;
  concluir(idempotencyKey: string): Promise<void>;
  liberar(idempotencyKey: string): Promise<void>;
}

export interface EnviadorDeEmail {
  enviar(e: EmailParaEnviar): Promise<ResultadoEnvio>;
}

export interface RegistradorDeEventos {
  registrar(ev: EventoDeEmail): Promise<void>;
}

export interface DependenciasDoNucleo {
  repo: RepositorioDeNurture;
  fila: FilaOutbox;
  enviador: EnviadorDeEmail;
  eventos: RegistradorDeEventos;
  relogio: Relogio;
  log(msg: string, meta?: unknown): void;
}
