import { describe, it, expect } from "vitest";
import { estaEmBlackout, diaPermitido } from "./regras";
import { mesclarConfig } from "./config";

describe("REGRESSÃO review T20 — janelas aplicadas", () => {
  it("blackout simples bloqueia hora dentro da faixa", () => {
    expect(estaEmBlackout("23", [{ inicio: "22:00", fim: "06:00" }])).toBe(true);
    expect(estaEmBlackout("02", [{ inicio: "22:00", fim: "06:00" }])).toBe(true);
    expect(estaEmBlackout("10", [{ inicio: "22:00", fim: "06:00" }])).toBe(false);
  });

  it("blackout sem cruzar meia-noite", () => {
    expect(estaEmBlackout("12", [{ inicio: "09:00", fim: "18:00" }])).toBe(true);
    expect(estaEmBlackout("19", [{ inicio: "09:00", fim: "18:00" }])).toBe(false);
  });

  it("janela degenerada não bloqueia nada", () => {
    expect(estaEmBlackout("12", [{ inicio: "10:00", fim: "10:00" }])).toBe(false);
  });

  it("dia fora da lista é proibido", () => {
    expect(diaPermitido(2, [0, 1, 2, 3, 4, 5, 6])).toBe(true);
    expect(diaPermitido(0, [1, 2, 3])).toBe(false);
  });

  it("REGRESSÃO: diasPermitidos todo-inválido cai no default, nunca em lista vazia", () => {
    const c = mesclarConfig({ janelas: { diasPermitidos: ["x", 99, -1] } });
    expect(c.janelas.diasPermitidos).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});
