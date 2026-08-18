import { describe, it, expect } from "vitest";
import { carregarEstadoThrottle, podeReceber, aplicarEnvio } from "./throttle";

const regras = { maxPorLeadPorDia: 1, minHorasEntreEnvios: 20 };
const AGORA = "2026-08-18T15:00:00-03:00"; // 15h BRT

describe("throttle compartilhado", () => {
  it("lead sem envio pode receber", () => {
    const e = carregarEstadoThrottle([], regras, AGORA);
    expect(podeReceber(e, "a@x.com", regras, AGORA)).toEqual({ permitido: true });
  });

  it("bloqueia 2º e-mail no mesmo dia", () => {
    const e = carregarEstadoThrottle(
      [{ email: "a@x.com", emailType: "esteira", sentAt: "2026-08-18T12:00:00-03:00" }],
      regras,
      AGORA,
    );
    expect(podeReceber(e, "a@x.com", regras, AGORA)).toEqual({
      permitido: false,
      motivo: "limite_por_dia",
    });
  });

  it("bloqueia por intervalo mínimo mesmo em dias diferentes", () => {
    const e = carregarEstadoThrottle(
      [{ email: "a@x.com", emailType: "esteira", sentAt: "2026-08-17T20:00:00-03:00" }],
      regras,
      AGORA,
    );
    expect(podeReceber(e, "a@x.com", regras, AGORA)).toEqual({
      permitido: false,
      motivo: "intervalo_minimo",
    });
  });

  it("envio de outro motor no mesmo dia também conta (throttle compartilhado)", () => {
    const e = carregarEstadoThrottle(
      [{ email: "a@x.com", emailType: "mail_mkt", sentAt: "2026-08-18T10:00:00-03:00" }],
      regras,
      AGORA,
    );
    expect(podeReceber(e, "a@x.com", regras, AGORA).permitido).toBe(false);
  });

  it("aplicarEnvio atualiza o estado em memória (segundo motor enxerga o primeiro)", () => {
    const e = carregarEstadoThrottle([], regras, AGORA);
    aplicarEnvio(e, "a@x.com", AGORA);
    expect(podeReceber(e, "a@x.com", regras, AGORA).permitido).toBe(false);
  });

  it("envio antigo fora da janela não bloqueia", () => {
    const e = carregarEstadoThrottle(
      [{ email: "a@x.com", emailType: "esteira", sentAt: "2026-08-16T09:00:00-03:00" }],
      regras,
      AGORA,
    );
    expect(podeReceber(e, "a@x.com", regras, AGORA).permitido).toBe(true);
  });

  it("email vazio nunca recebe", () => {
    const e = carregarEstadoThrottle([], regras, AGORA);
    expect(podeReceber(e, "", regras, AGORA).permitido).toBe(false);
  });
});
