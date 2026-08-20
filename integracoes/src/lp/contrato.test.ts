import { describe, it, expect } from "vitest";
import { normalizarEmail, normalizarLead } from "./contrato";

describe("normalizarEmail", () => {
  it("trim + lowercase", () => {
    expect(normalizarEmail("  Joao@X.com ")).toBe("joao@x.com");
  });
  it("vazio/nulo devolve null", () => {
    expect(normalizarEmail("")).toBeNull();
    expect(normalizarEmail(null as unknown as string)).toBeNull();
  });
});

describe("normalizarLead", () => {
  it("extrai os campos conhecidos e ignora estranhos", () => {
    const r = normalizarLead({
      nome: " Ana ",
      whatsapp: "+5511999990000",
      email: "Ana@X.com",
      origem: "lp-kit",
      campoEstranho: 42,
    });
    expect(r).toEqual({
      nome: "Ana",
      whatsapp: "+5511999990000",
      email: "ana@x.com",
      origem: "lp-kit",
    });
  });

  it("campos inválidos caem fora sem lançar", () => {
    const r = normalizarLead({ nome: 123, origem: "lp" });
    expect(r).toEqual({ nome: "", origem: "lp" });
  });

  it("utms opcionais propagam", () => {
    const r = normalizarLead({
      nome: "A",
      origem: "lp",
      utms: { source: "owner-slug", medium: "referral", campaign: "lp-treinamento" },
    });
    expect(r.utms).toEqual({
      source: "owner-slug",
      medium: "referral",
      campaign: "lp-treinamento",
    });
  });
});
