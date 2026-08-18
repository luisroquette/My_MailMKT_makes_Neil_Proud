/**
 * LP intake contract — how a landing page (My_LP_Makes_Neil_Proud) feeds
 * leads into the nurture engine.
 *
 * The LP owns its form (name + WhatsApp + email); this contract only defines
 * the shape the nurture engine accepts. Normalization is defensive: input is
 * untrusted (webhooks), never throws, and invalid fields are dropped.
 */

export interface UtmsDeOrigem {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}

export interface LeadNormalizado {
  nome: string;
  whatsapp?: string;
  email?: string | null;
  origem: string;
  pagina?: string;
  interesse?: string;
  utms?: UtmsDeOrigem;
}

export interface ContratoDeIntake {
  registrarLead(input: LeadNormalizado): Promise<
    { ok: true; leadId: string } | { ok: false; erro: string }
  >;
}

export function normalizarEmail(e: unknown): string | null {
  if (typeof e !== "string") return null;
  const t = e.trim().toLowerCase();
  return t.length > 0 ? t : null;
}

function stringOuUndefined(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;
}

export function normalizarLead(input: unknown): LeadNormalizado {
  const i = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const utmsBruto = (typeof i.utms === "object" && i.utms !== null ? i.utms : {}) as Record<
    string,
    unknown
  >;
  const utms: UtmsDeOrigem = {};
  for (const k of ["source", "medium", "campaign", "content", "term"] as const) {
    const v = stringOuUndefined(utmsBruto[k]);
    if (v) utms[k] = v;
  }
  return {
    nome: stringOuUndefined(i.nome) ?? "",
    ...(stringOuUndefined(i.whatsapp) ? { whatsapp: stringOuUndefined(i.whatsapp) } : {}),
    ...(normalizarEmail(i.email) ? { email: normalizarEmail(i.email) } : {}),
    origem: stringOuUndefined(i.origem) ?? "",
    ...(stringOuUndefined(i.pagina) ? { pagina: stringOuUndefined(i.pagina) } : {}),
    ...(stringOuUndefined(i.interesse) ? { interesse: stringOuUndefined(i.interesse) } : {}),
    ...(Object.keys(utms).length > 0 ? { utms } : {}),
  };
}
