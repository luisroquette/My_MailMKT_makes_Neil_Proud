import { describe, it, expect } from "vitest";
import { agendaPadraoDe, alvosDaHora } from "./agenda";
import { CONFIG_PADRAO, mesclarConfig, type ConfigNurture } from "./config";

describe("agendaPadraoDe", () => {
  it("deriva uma entrada por motor, na ordem de prioridade", () => {
    const a = agendaPadraoDe(CONFIG_PADRAO);
    expect(a.map((e) => e.alvo)).toEqual(["mail_mkt", "lancamento", "esteira", "digest", "video_digest"]);
    expect(a.find((e) => e.alvo === "mail_mkt")?.horas).toEqual(["10:30"]);
  });
});

describe("alvosDaHora", () => {
  it("tique de hora cheia alcança default de :30 (truncado de propósito)", () => {
    const a = agendaPadraoDe(CONFIG_PADRAO);
    // "10" alcança mail_mkt (10:30) E esteira (10:00) — o truncamento junta
    // os dois no mesmo tique; o dispatcher resolve por prioridade.
    expect(alvosDaHora(a, "10", 2)).toEqual(["mail_mkt", "esteira"]);
  });

  it("tique de hora cheia alcança default de :45", () => {
    const a = agendaPadraoDe(CONFIG_PADRAO);
    expect(alvosDaHora(a, "20", 2)).toEqual(["video_digest"]);
  });

  it("hora sem motor não devolve nada", () => {
    const a = agendaPadraoDe(CONFIG_PADRAO);
    expect(alvosDaHora(a, "03", 2)).toEqual([]);
  });

  it("dia fora dos dias da entrada não dispara", () => {
    const config: ConfigNurture = {
      ...mesclarConfig({}),
      agenda: [{ dias: [1], horas: ["10:30"], alvo: "mail_mkt" }],
    };
    expect(alvosDaHora(config.agenda!, "10", 2)).toEqual([]); // 2 = terça? não — 2 = quarta
    expect(alvosDaHora(config.agenda!, "10", 1)).toEqual(["mail_mkt"]);
  });

  it("agenda explícita vence derivada", () => {
    const config = mesclarConfig({
      agenda: [{ dias: [0, 1, 2, 3, 4, 5, 6], horas: ["11:00"], alvo: "mail_mkt" }],
    });
    expect(config.agenda).not.toBeNull();
    expect(alvosDaHora(config.agenda!, "11", 0)).toEqual(["mail_mkt"]);
    expect(alvosDaHora(config.agenda!, "10", 0)).toEqual([]);
  });

  it("agenda:null deriva dos horarios", () => {
    const config = mesclarConfig({ agenda: null });
    expect(config.agenda).toBeNull();
    const derivada = agendaPadraoDe(config);
    expect(alvosDaHora(derivada, "09", 0)).toEqual(["lancamento"]);
  });
});
