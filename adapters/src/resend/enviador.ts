import type { EmailParaEnviar, EnviadorDeEmail, ResultadoEnvio } from "@mymailmkt/nucleo";

/**
 * Resend adapter — the single outbound path of the reference system.
 *
 * Fidelity contract:
 * - List-Unsubscribe (mailto + https) and
 *   `List-Unsubscribe-Post: List-Unsubscribe=One-Click` on EVERY message, no
 *   exceptions (bulk-sender compliance, LGPD);
 * - error mapping: 4xx (client) = definitive failure (release, retry
 *   tomorrow); timeouts / 5xx / rate limits = AMBIGUOUS (fail closed, keep
 *   the reservation, never resend).
 *
 * The Resend client is injected (same philosophy as the Supabase adapter):
 * production installs the `resend` package and passes `new Resend(key)`;
 * the repo itself keeps zero runtime dependencies.
 */

export interface ClienteResend {
  emails: {
    send(payload: Record<string, unknown>): Promise<{ id?: string; error?: unknown }>;
  };
}

export interface OpcoesDoResend {
  cliente: ClienteResend;
  from: string;
  replyTo?: string;
  siteUrl: string;
  tokenDeDescadastro(email: string): string;
}

export function criarEnviadorResend(opts: OpcoesDoResend): EnviadorDeEmail {
  return {
    async enviar(e: EmailParaEnviar): Promise<ResultadoEnvio> {
      const unsubscribeUrl = `${opts.siteUrl}/unsubscribe?token=${opts.tokenDeDescadastro(e.to)}`;
      // mailto: needs a bare address — "Nome <email@x.com>" breaks the header.
      const emailDeResposta = (opts.replyTo ?? opts.from).match(/<([^>]+)>/)?.[1] ?? (opts.replyTo ?? opts.from).trim();
      try {
        const r = await opts.cliente.emails.send({
          from: opts.from,
          ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
          to: [e.to],
          subject: e.subject,
          html: e.html,
          headers: {
            "List-Unsubscribe": `<mailto:${emailDeResposta}?subject=unsubscribe>, <${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });
        if (r.error) {
          return classificarErro(r.error);
        }
        return "entregue";
      } catch (erro) {
        return classificarErro(erro);
      }
    },
  };
}

function classificarErro(erro: unknown): ResultadoEnvio {
  const mensagem = erro instanceof Error ? erro.message : String(erro);
  const status = (erro as { statusCode?: number })?.statusCode;

  // Definitive client errors — never retry the same payload.
  if (status && status >= 400 && status < 500 && status !== 429) {
    return "falhaDefinitiva";
  }
  // 429 / 5xx / timeouts / network — ambiguous: fail closed.
  return "ambiguo";
}
