import { describe, it, expect } from "vitest";
import { SEQUENCIA_25_DIAS, FORMATOS_PERMITIDOS, passoDadoDiaDesdeCadastro } from "./sequencia";

describe("SEQUENCIA_25_DIAS", () => {
  it("tem os 10 passos reais da referência", () => {
    expect(SEQUENCIA_25_DIAS).toHaveLength(10);
    expect(SEQUENCIA_25_DIAS[0]).toEqual({ dia: 0, formato: "lesson", funcao: "welcome" });
    expect(SEQUENCIA_25_DIAS[9]).toEqual({ dia: 25, formato: "echo", funcao: "reengage" });
  });

  it("dias exatos da tabela D+0..D+25", () => {
    expect(SEQUENCIA_25_DIAS.map((p) => p.dia)).toEqual([0, 1, 3, 5, 7, 9, 12, 14, 18, 25]);
  });

  it("formatos alternam lesson/letter/echo — nunca dez variações do mesmo e-mail de venda", () => {
    const formatos = new Set(SEQUENCIA_25_DIAS.map((p) => p.formato));
    expect(formatos).toEqual(new Set(["lesson", "letter", "echo"]));
  });
});

describe("FORMATOS_PERMITIDOS", () => {
  it("contém os 3 formatos da referência", () => {
    expect(FORMATOS_PERMITIDOS).toEqual(["lesson", "letter", "echo"]);
  });
});

describe("passoDadoDiaDesdeCadastro", () => {
  it("D+0 é o welcome", () => {
    expect(passoDadoDiaDesdeCadastro(0)).toEqual({ dia: 0, formato: "lesson", funcao: "welcome" });
  });
  it("dia sem passo devolve null", () => {
    expect(passoDadoDiaDesdeCadastro(2)).toBeNull();
  });
  it("D+25 é o último passo", () => {
    const p = passoDadoDiaDesdeCadastro(25);
    expect(p?.dia).toBe(25);
    expect(p?.formato).toBe("echo");
  });
  it("depois de D+25 a sequência acabou", () => {
    expect(passoDadoDiaDesdeCadastro(30)).toBeNull();
  });
  it("dia negativo nunca tem passo", () => {
    expect(passoDadoDiaDesdeCadastro(-1)).toBeNull();
  });
});
