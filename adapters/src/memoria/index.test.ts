import { describe, it, expect } from "vitest";
import { criarAdaptersMemoria } from "./index";

describe("adapters memoria", () => {
  it("lerLeads é paginado e preserva ordem do seed", async () => {
    const { deps } = criarAdaptersMemoria();
    const p1 = await deps.repo.lerLeads({ offset: 0, limite: 2 });
    expect(p1.itens.length).toBe(2);
    expect(p1.temMais).toBe(true);
    const p2 = await deps.repo.lerLeads({ offset: 2, limite: 2 });
    expect(p2.temMais).toBe(false);
    const ids = [...p1.itens, ...p2.itens].map((l) => l.id);
    expect(ids).toEqual(["lead-1", "lead-2", "lead-3"]);
  });

  it("fila reservar/concluir/liberar", async () => {
    const { deps } = criarAdaptersMemoria();
    const ok = await deps.fila.reservar({
      to: "a@x.com", subject: "s", html: "<p>x</p>", emailType: "mail_mkt", idempotencyKey: "k1",
    });
    expect(ok).toBe(true);
    await deps.fila.concluir("k1");
    const { estado } = criarAdaptersMemoria();
    expect(estado.fila.concluidas).toEqual([]);
    const { deps: d2, estado: e2 } = criarAdaptersMemoria();
    await d2.fila.reservar({
      to: "a@x.com", subject: "s", html: "<p>x</p>", emailType: "mail_mkt", idempotencyKey: "k2",
    });
    await d2.fila.concluir("k2");
    expect(e2.fila.concluidas).toEqual(["k2"]);
  });

  it("enviador registra em enviados[]", async () => {
    const { deps, estado } = criarAdaptersMemoria();
    const r = await deps.enviador.enviar({
      to: "a@x.com", subject: "s", html: "<p>x</p>", emailType: "mail_mkt", idempotencyKey: "k3",
    });
    expect(r).toBe("entregue");
    expect(estado.enviados).toEqual(["k3"]);
  });

  it("relógio fixo devolve hora local America/Sao_Paulo e nunca lança", () => {
    const { deps } = criarAdaptersMemoria();
    expect(deps.relogio.agoraIso()).toBe("2026-08-18T10:00:00-03:00");
    expect(deps.relogio.horaLocalHH()).toBe("10");
    expect(deps.relogio.diaDaSemanaLocal()).toBe(2);
  });
});
