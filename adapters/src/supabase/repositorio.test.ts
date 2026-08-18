import { describe, it, expect, vi } from "vitest";
import { criarAdapterSupabase, type ClienteSupabase } from "./repositorio";

function clientFake(comportamento: {
  range?: (inicio: number, fim: number) => unknown;
  insertError?: { code?: string; message: string } | null;
}) {
  const range = vi.fn(comportamento.range ?? (() => ({ data: [], error: null })));
  const select = vi.fn(() => ({
    range,
    gte: vi.fn(() => ({ range })),
  }));
  const client = {
    from: vi.fn((tabela: string) => ({
      select: select,
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({ data: null, error: comportamento.insertError ?? null })),
        })),
        then: (fn?: (v: { data: unknown | null; error: { code?: string; message: string } | null }) => unknown) =>
          Promise.resolve(fn ? fn({ data: null, error: comportamento.insertError ?? null }) : undefined),
      })),
    })),
    rpc: vi.fn(async () => ({ error: null })),
  } as unknown as ClienteSupabase;
  return { client, range };
}

describe("adapter supabase", () => {
  it("lerLeads usa range() paginado — nunca select cru", async () => {
    const { client, range } = clientFake({});
    const { repo } = criarAdapterSupabase(client);
    await repo.lerLeads({ offset: 0, limite: 1000 });
    expect(range).toHaveBeenCalledWith(0, 999);
    await repo.lerLeads({ offset: 1000, limite: 1000 });
    expect(range).toHaveBeenLastCalledWith(1000, 1999);
  });

  it("23505 vira duplicado", async () => {
    const { client } = clientFake({ insertError: { code: "23505", message: "duplicate" } });
    const { repo } = criarAdapterSupabase(client);
    const r = await repo.reservarNoLog({
      leadId: "l1", email: "a@x.com", emailType: "t", sentAt: "2026-08-18T10:00:00-03:00",
    });
    expect(r).toBe("duplicado");
  });

  it("erro genérico de insert vira erro", async () => {
    const { client } = clientFake({ insertError: { code: "42P01", message: "x" } });
    const { repo } = criarAdapterSupabase(client);
    const r = await repo.reservarNoLog({
      leadId: "l1", email: "a@x.com", emailType: "t", sentAt: "2026-08-18T10:00:00-03:00",
    });
    expect(r).toBe("erro");
  });

  it("fila mapeia os RPCs com os argumentos certos", async () => {
    const { client } = clientFake({});
    const { fila } = criarAdapterSupabase(client);
    const email = {
      to: "a@x.com", subject: "s", html: "<p>x</p>", emailType: "mail_mkt", idempotencyKey: "k",
    };
    await fila.reservar(email);
    expect(client.rpc).toHaveBeenCalledWith("reserve_nurture_email_outbox", {
      p_idempotency_key: "k", p_email_args: email, p_source: "nurture", p_source_ids: [],
    });
    await fila.concluir("k");
    await fila.liberar("k");
    const chamadas = (client.rpc as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
    expect(chamadas).toContain("complete_nurture_email_outbox");
    expect(chamadas).toContain("release_nurture_email_outbox");
  });
});
