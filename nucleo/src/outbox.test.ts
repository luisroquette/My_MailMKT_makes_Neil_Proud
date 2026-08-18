import { describe, it, expect, vi } from "vitest";
import {
  enviarComOutbox,
  retomarEmailsPendentes,
  limparReservasOrfas,
  LEASE_MS,
  DEAD_LETTER_MS,
  PRAZO_DE_LOOP_MS,
} from "./outbox";
import type { EnviadorDeEmail, FilaOutbox, EmailParaEnviar } from "./contratos";

const AGORA = "2026-08-18T10:00:00-03:00";

const email: EmailParaEnviar = {
  to: "a@x.com",
  subject: "s",
  html: "<p>hi</p>",
  emailType: "mail_mkt",
  idempotencyKey: "k1",
};

function fakeFila(): FilaOutbox & { reservas: string[]; concluidas: string[]; liberadas: string[] } {
  return {
    reservas: [],
    concluidas: [],
    liberadas: [],
    async reivindicar() {
      return null;
    },
    async listarPendentes() {
      return [];
    },
    async removerOrfas() {
      return 0;
    },
    async reservar(e) {
      this.reservas.push(e.idempotencyKey);
      return true;
    },
    async concluir(k) {
      this.concluidas.push(k);
    },
    async liberar(k) {
      this.liberadas.push(k);
    },
  };
}

function enviadorCom(resultado: "entregue" | "falhaDefinitiva" | "ambiguo") {
  return { async enviar() { return resultado; } } satisfies EnviadorDeEmail;
}

const log = () => {};

describe("enviarComOutbox", () => {
  it("entregue ⇒ concluir chamado", async () => {
    const fila = fakeFila();
    const r = await enviarComOutbox({ fila, enviador: enviadorCom("entregue"), log }, email);
    expect(r).toEqual({ resultado: "enviado" });
    expect(fila.reservas).toEqual(["k1"]);
    expect(fila.concluidas).toEqual(["k1"]);
    expect(fila.liberadas).toEqual([]);
  });

  it("falhaDefinitiva ⇒ liberar (retry amanhã), nunca concluir", async () => {
    const fila = fakeFila();
    const r = await enviarComOutbox({ fila, enviador: enviadorCom("falhaDefinitiva"), log }, email);
    expect(r.resultado).toBe("reagendado");
    expect(fila.liberadas).toEqual(["k1"]);
    expect(fila.concluidas).toEqual([]);
  });

  it("ambíguo ⇒ fail-closed: nem concluir nem liberar", async () => {
    const fila = fakeFila();
    const r = await enviarComOutbox({ fila, enviador: enviadorCom("ambiguo"), log }, email);
    expect(r.resultado).toBe("reagendado");
    expect(fila.concluidas).toEqual([]);
    expect(fila.liberadas).toEqual([]);
  });

  it("reserva falhou ⇒ enviador nunca chamado", async () => {
    const fila = fakeFila();
    fila.reservar = vi.fn(async () => false);
    const enviador = { enviar: vi.fn(async () => "entregue" as const) };
    const r = await enviarComOutbox({ fila, enviador, log }, email);
    expect(r.resultado).toBe("sem_fila");
    expect(enviador.enviar).not.toHaveBeenCalled();
  });

  it("constantes de fidelidade", () => {
    expect(LEASE_MS).toBe(5 * 60 * 1000);
    expect(DEAD_LETTER_MS).toBe(23 * 60 * 60 * 1000);
    expect(PRAZO_DE_LOOP_MS).toBe(240_000); // < maxDuration 300s da Vercel
  });
});

describe("REGRESSÃO review T20 — retomada e dead-letter", () => {
  it("pendente recente é reivindicado, enviado e concluído", async () => {
    const fila = {
      reservar: vi.fn(async () => true),
      reivindicar: vi.fn(async () => email),
      concluir: vi.fn(async () => {}),
      liberar: vi.fn(async () => {}),
      listarPendentes: vi.fn(async () => [
        {
          idempotencyKey: "k1",
          email,
          criadoEm: "2026-08-18T09:00:00-03:00",
          ultimaTentativaEm: null,
        },
      ]),
      removerOrfas: vi.fn(async () => 0),
    };
    const enviador = { enviar: vi.fn(async () => "entregue" as const) };
    const depsFake = { fila, enviador, log, repo: {} as never, eventos: {} as never, relogio: {} as never };
    const { retomadas, deadLetters } = await retomarEmailsPendentes(depsFake, AGORA);
    expect(retomadas).toBe(1);
    expect(deadLetters).toBe(0);
    expect(fila.reivindicar).toHaveBeenCalledWith("k1");
    expect(fila.concluir).toHaveBeenCalledWith("k1");
  });

  it("pendente >23h vira dead-letter com alerta e NUNCA é reenviado", async () => {
    const fila = {
      reservar: vi.fn(async () => true),
      reivindicar: vi.fn(async () => email),
      concluir: vi.fn(async () => {}),
      liberar: vi.fn(async () => {}),
      listarPendentes: vi.fn(async () => [
        {
          idempotencyKey: "k-velha",
          email,
          criadoEm: "2026-08-16T09:00:00-03:00", // >23h antes de AGORA
          ultimaTentativaEm: "2026-08-16T09:05:00-03:00",
        },
      ]),
      removerOrfas: vi.fn(async () => 0),
    };
    const enviador = { enviar: vi.fn(async () => "entregue" as const) };
    const mensagens: unknown[] = [];
    const depsFake = {
      fila, enviador, log: (m: string, meta?: unknown) => mensagens.push([m, meta]),
      repo: {} as never, eventos: {} as never, relogio: {} as never,
    };
    const { retomadas, deadLetters } = await retomarEmailsPendentes(depsFake, AGORA);
    expect(retomadas).toBe(0);
    expect(deadLetters).toBe(1);
    expect(fila.reivindicar).not.toHaveBeenCalled();
    expect(enviador.enviar).not.toHaveBeenCalled();
    expect(mensagens.some((item) => String((item as [string])[0]).includes("dead-letter"))).toBe(true);
  });

  it("limparReservasOrfas remove nunca-tentadas >1h via o port da fila", async () => {
    const fila = {
      reservar: vi.fn(async () => true),
      reivindicar: vi.fn(async () => null),
      concluir: vi.fn(async () => {}),
      liberar: vi.fn(async () => {}),
      listarPendentes: vi.fn(async () => []),
      removerOrfas: vi.fn(async () => 2),
    };
    const depsFake = { fila, enviador: { enviar: vi.fn() }, log, repo: {} as never, eventos: {} as never, relogio: {} as never };
    const removidas = await limparReservasOrfas(depsFake, AGORA);
    expect(removidas).toBe(2);
    // AGORA (10:00 BRT = 13:00Z) - 1h
    expect(fila.removerOrfas).toHaveBeenCalledWith("2026-08-18T12:00:00.000Z");
  });
});
