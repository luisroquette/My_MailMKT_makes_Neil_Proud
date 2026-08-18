/**
 * Copy floor — deterministic anti-sensationalism gate.
 *
 * Fidelity contract (CF Gauss reference, lib/nurture/piso.ts): the banned
 * list is the SINGLE source of truth; the gate runs on BOTH save and send.
 * A line that fails or is malformed falls back to the repo seed and logs —
 * it never ships. Deterministic: same input, same verdict, always.
 */

export const TERMOS_BANIDOS = [
  "garantido",
  "garantida",
  "garantia de retorno",
  "sem risco",
  "lucro certo",
  "renda garantida",
  "certeza de resultado",
  "domine em",
  "dobre seu salário",
  "aumento de salário",
  "emprego garantido",
] as const;

export function termosBanidosEm(texto: string): string[] {
  const t = texto.toLowerCase();
  return TERMOS_BANIDOS.filter((termo) => t.includes(termo));
}

export interface AvaliacaoDeCopy {
  aprovado: boolean;
  achados: string[];
}

/**
 * Deterministic verdict over subject + body. Never throws.
 */
export function avaliarCopy(copy: { subject: string; corpo: string }): AvaliacaoDeCopy {
  const achados: string[] = [];
  if (!copy.subject || copy.subject.trim().length === 0) {
    achados.push("subject vazio");
  }
  achados.push(...termosBanidosEm(copy.subject));
  achados.push(...termosBanidosEm(copy.corpo));
  return { aprovado: achados.length === 0, achados };
}
