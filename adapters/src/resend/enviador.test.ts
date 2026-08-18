import { describe, it, expect, vi } from "vitest";
import { criarEnviadorResend, type ClienteResend } from "./enviador";

const email = {
  to: "a@x.com", subject: "s", html: "<p>x</p>", emailType: "mail_mkt", idempotencyKey: "k",
};

function clienteCom(send: ClienteResend["emails"]["send"]) {
  return { emails: { send } } as ClienteResend;
}

const opts = {
  from: "no-reply@exemplo.com.br",
  siteUrl: "https://exemplo.com.br",
  tokenDeDescadastro: (email: string) => `tok-${email}`,
};

describe("enviador resend", () => {
  it("payload inclui List-Unsubscribe e One-Click em TODA mensagem", async () => {
    const send = vi.fn(async (_payload: Record<string, unknown>) => ({ id: "x" }));
    const env = criarEnviadorResend({ ...opts, cliente: clienteCom(send) });
    const r = await env.enviar(email);
    expect(r).toBe("entregue");
    const payload = send.mock.calls[0]![0]!;
    const headers = payload.headers as Record<string, string>;
    expect(headers["List-Unsubscribe"]).toContain("<mailto:");
    expect(headers["List-Unsubscribe"]).toContain("<https://exemplo.com.br/unsubscribe?token=tok-a@x.com>");
    expect(headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });

  it("erro 400 → falhaDefinitiva", async () => {
    const env = criarEnviadorResend({
      ...opts,
      cliente: clienteCom(async () => {
        const e = new Error("bad request") as Error & { statusCode: number };
        e.statusCode = 400;
        return { error: e };
      }),
    });
    expect(await env.enviar(email)).toBe("falhaDefinitiva");
  });

  it("erro 429 → ambíguo (fail-closed)", async () => {
    const env = criarEnviadorResend({
      ...opts,
      cliente: clienteCom(async () => {
        const e = new Error("rate limit") as Error & { statusCode: number };
        e.statusCode = 429;
        return { error: e };
      }),
    });
    expect(await env.enviar(email)).toBe("ambiguo");
  });

  it("erro 500 → ambíguo", async () => {
    const env = criarEnviadorResend({
      ...opts,
      cliente: clienteCom(async () => {
        const e = new Error("server") as Error & { statusCode: number };
        e.statusCode = 500;
        return { error: e };
      }),
    });
    expect(await env.enviar(email)).toBe("ambiguo");
  });

  it("throw sem status (timeout/rede) → ambíguo", async () => {
    const env = criarEnviadorResend({
      ...opts,
      cliente: clienteCom(async () => {
        throw new Error("ETIMEDOUT");
      }),
    });
    expect(await env.enviar(email)).toBe("ambiguo");
  });
});
