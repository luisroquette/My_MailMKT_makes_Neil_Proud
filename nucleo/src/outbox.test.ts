import { describe, it, expect, vi } from "vitest";
import { enviarComOutbox, LEASE_MS, DEAD_LETTER_MS, PRAZO_DE_LOOP_MS } from "./outbox";
import type { EnviadorDeEmail, FilaOutbox, EmailParaEnviar } from "./contratos";

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
