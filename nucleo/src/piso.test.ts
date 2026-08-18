import { describe, it, expect } from "vitest";
import { avaliarCopy, TERMOS_BANIDOS } from "./piso";

describe("avaliarCopy", () => {
  it("subject vazio reprova", () => {
    const r = avaliarCopy({ subject: "", corpo: "Corpo normal." });
    expect(r.aprovado).toBe(false);
    expect(r.achados).toContain("subject vazio");
  });

  it("termo banido no corpo reprova com achado nomeado", () => {
    const r = avaliarCopy({ subject: "Ok", corpo: "Resultado garantido para você." });
    expect(r.aprovado).toBe(false);
    expect(r.achados).toContain("garantido");
  });

  it("variação de caixa também reprova", () => {
    const r = avaliarCopy({ subject: "Ok", corpo: "Sem RISCO algum." });
    expect(r.aprovado).toBe(false);
    expect(r.achados).toContain("sem risco");
  });

  it("termo banido no subject reprova", () => {
    const r = avaliarCopy({ subject: "Dobre seu salário agora", corpo: "ok" });
    expect(r.aprovado).toBe(false);
    expect(r.achados).toContain("dobre seu salário");
  });

  it("copy limpa aprova", () => {
    const r = avaliarCopy({ subject: "A ideia que muda o jogo", corpo: "Um texto sóbrio e útil." });
    expect(r.aprovado).toBe(true);
    expect(r.achados).toEqual([]);
  });

  it("lista portada é a mesma da referência", () => {
    expect(TERMOS_BANIDOS).toEqual([
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
    ]);
  });
});
