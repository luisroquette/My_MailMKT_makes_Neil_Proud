import { describe, it, expect } from "vitest";
import { CONFIG_PADRAO, mesclarConfig } from "./config";

describe("mesclarConfig", () => {
  it("campo ausente usa default", () => {
    expect(mesclarConfig({}).throttle).toEqual({ maxPorLeadPorDia: 1, minHorasEntreEnvios: 20 });
  });

  it("valor válido vence", () => {
    const c = mesclarConfig({ throttle: { maxPorLeadPorDia: 3 } });
    expect(c.throttle.maxPorLeadPorDia).toBe(3);
    expect(c.throttle.minHorasEntreEnvios).toBe(20); // irmão preservado
  });

  it("valor inválido cai no default sem lançar", () => {
    expect(mesclarConfig({ throttle: { maxPorLeadPorDia: "abc" } }).throttle.maxPorLeadPorDia).toBe(1);
    expect(mesclarConfig({ horarios: { mail_mkt: "25:99" } }).horarios.mail_mkt).toBe("10:30");
  });

  it("prioridade fora do enum é descartada e os ausentes são anexados", () => {
    expect(mesclarConfig({ prioridade: ["digest", "lixo"] }).prioridade).toEqual([
      "digest", "mail_mkt", "lancamento", "esteira", "video_digest",
    ]);
  });

  it("REGRESSÃO: prioridade é ordem, não filtro — motores ausentes são anexados", () => {
    const c = mesclarConfig({ prioridade: ["digest"] });
    expect(c.prioridade).toEqual(["digest", "mail_mkt", "lancamento", "esteira", "video_digest"]);
  });

  it("fusível inválido cai no default", () => {
    expect(mesclarConfig({ fusivel: { email: -1 } }).fusivel.email).toBe(100);
  });
});
