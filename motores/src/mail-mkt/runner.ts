import type {
  DependenciasDoNucleo,
  EstadoThrottle,
  ResultadoDaRodada,
  RunnerDeMotor,
} from "@mymailmkt/nucleo";
import { enviarComOutbox, podeReceber, aplicarEnvio } from "@mymailmkt/nucleo";
import type { IntegracaoDeTracking } from "@mymailmkt/integracoes";
import { embrulharLinksDoHtml } from "@mymailmkt/integracoes";
import { estaAtivaNaHora, ocorrenciaId, candidatos, type CampanhaDeMarketing } from "./cadencia";

/**
 * Marketing runner — the reference `lib/nurture/marketing/runner.ts` port.
 *
 * Fidelity contract:
 * - ONE tracking link per occurrence (same destination for all leads of the
 *   round), never per lead — per-lead would be redundant inserts;
 * - throttle verdict before the durable log reservation (respecting
 *   throttle_exempt);
 * - durable reservation first (unique violation = already sent, skip);
 * - `sucessos` counts REAL deliveries only, never attempts — an attempted
 *   candidate that the sender rejects does not count;
 * - idempotency key carries the occurrence id (not `next_send_on`, which the
 *   agenda never advances within a day).
 */

export interface ConteudoDeEmail {
  subject: string;
  corpo: string;
  ctaUrl: string;
}

export function criarRunnerMailMkt(opts: {
  lerCampanhasAtivas(): Promise<CampanhaDeMarketing[]>;
  /** Database copy first, then seed, then null (campaign without content is skipped). */
  lerConteudo(emailType: string): Promise<ConteudoDeEmail | null>;
  tracking: IntegracaoDeTracking;
  siteUrl: string;
  /** Real HTTPS unsubscribe URL with HMAC token — the visible footer link. */
  montarUrlDescadastro(email: string): string;
}): RunnerDeMotor {
  return async (deps: DependenciasDoNucleo, ctx): Promise<ResultadoDaRodada> => {
    const resultado: ResultadoDaRodada = {
      motor: "mail_mkt",
      candidatos: 0,
      enviados: 0,
      pulados: [],
      falhas: [],
    };

    const agora = deps.relogio.agoraIso();
    const hora = deps.relogio.horaLocalHH();
    const dia = deps.relogio.diaDaSemanaLocal();
    const diaLocalISO = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(agora));

    const campanhas = (await opts.lerCampanhasAtivas()).filter((c) =>
      estaAtivaNaHora(c, hora, dia, diaLocalISO),
    );

    // Opt-outs (LGPD): one-click unsubscribe inserts a suppression row —
    // EVERY motor must check it before reserving anything.
    const supressoes = await deps.repo.lerSupressoes();

    for (const campanha of campanhas) {
      const occId = ocorrenciaId(campanha, hora, diaLocalISO);
      const emailType = `mail_mkt_${campanha.slug}_${occId}`;

      const content = await opts.lerConteudo(emailType);
      if (!content) continue;

      // ONE tracking link per occurrence — same destination for every lead
      // of this round.
      const destinoCta = content.ctaUrl.startsWith("http")
        ? content.ctaUrl
        : `${opts.siteUrl}${content.ctaUrl}`;
      let ctaUrl: string;
      try {
        ctaUrl = await opts.tracking.obterOuCriarLink({
          campanhaSlug: campanha.slug,
          campanhaNome: campanha.name,
          destino: destinoCta,
        });
      } catch {
        ctaUrl = destinoCta;
        deps.log("[mail-mkt] tracking falhou — envio segue com URL crua", {
          campanha: campanha.slug,
        });
      }

      // Body links: one tracked link per unique body URL (cache per
      // occurrence) — every promotional href passes through the tracklink.
      const urlsDoCorpo = coletarHrefs(content.corpo);
      const mapaDoCorpo = new Map<string, string>();
      for (const url of urlsDoCorpo) {
        try {
          const trackada = await opts.tracking.obterOuCriarLink({
            campanhaSlug: campanha.slug,
            campanhaNome: campanha.name,
            destino: url,
            motor: "corpo",
          });
          mapaDoCorpo.set(url, trackada);
        } catch {
          mapaDoCorpo.set(url, url);
        }
      }

      // Leads: paginated read, one page at a time (never raw selects).
      const leads = await lerTodosOsLeads(deps);
      const alvos = candidatos(campanha, leads, agora);
      resultado.candidatos += alvos.length;

      // Preview: count candidates, skip everything — dry NEVER sends.
      if (ctx.dry) {
        resultado.pulados.push({
          email: campanha.slug,
          motivo: `dry:${alvos.length}_candidatos`,
        });
        continue;
      }

      for (const lead of alvos) {
        if (ctx.fusivel.esgotado()) break;

        const email = lead.email.trim().toLowerCase();

        if (supressoes.has(email)) {
          resultado.pulados.push({ email, motivo: "suprimido" });
          continue;
        }

        if (campanha.throttleExempt !== true) {
          const veredicto = podeReceber(ctx.throttle, email, ctx.config.throttle, agora);
          if (!veredicto.permitido) {
            resultado.pulados.push({ email, motivo: `throttle:${veredicto.motivo}` });
            continue;
          }
        }

        const idempotencyKey = `mail-mkt/${campanha.id}/${lead.id}/${occId}`;

        const reserva = await deps.repo.reservarNoLog({
          leadId: lead.id,
          email,
          emailType,
          sentAt: agora,
        });
        if (reserva === "duplicado") {
          resultado.pulados.push({ email, motivo: "reserva_conflito" });
          continue;
        }
        if (reserva === "erro") {
          resultado.falhas.push({ email, erro: "reserva falhou" });
          continue;
        }

        const html = renderEmail(
          content,
          lead.name.trim().split(/\s+/)[0] ?? "",
          ctaUrl,
          mapaDoCorpo,
          opts.montarUrlDescadastro(email),
        );
        if (!ctx.fusivel.consumir()) break;

        const saida = await enviarComOutbox(deps, {
          to: email,
          subject: content.subject.replace("{{lead.nome}}", lead.name.trim().split(/\s+/)[0] ?? ""),
          html,
          emailType,
          idempotencyKey,
        });

        if (saida.resultado === "enviado") {
          resultado.enviados += 1; // REAL delivery only — never attempts
          aplicarEnvio(ctx.throttle, email, agora);
        } else {
          resultado.falhas.push({ email, erro: saida.detalhe ?? saida.resultado });
        }
      }
    }

    return resultado;
  };
}

async function lerTodosOsLeads(deps: DependenciasDoNucleo) {
  const todos = [];
  let offset = 0;
  for (;;) {
    const pagina = await deps.repo.lerLeads({ offset, limite: 1000 });
    todos.push(...pagina.itens);
    if (!pagina.temMais) break;
    offset = pagina.offset + pagina.itens.length;
  }
  return todos;
}

/** Collect unique hrefs from raw copy (may contain HTML anchors). */
function coletarHrefs(html: string): string[] {
  const hrefs = new Set<string>();
  const re = /<a\s+[^>]*href="([^"]*)"[^>]*>/gi;
  for (const m of html.matchAll(re)) {
    const url = m[1];
    if (!/^mailto:/i.test(url) && !/\/unsubscribe/i.test(url)) hrefs.add(url);
  }
  return [...hrefs];
}

function renderEmail(
  content: ConteudoDeEmail,
  nome: string,
  ctaUrl: string,
  mapaDoCorpo: Map<string, string>,
  urlDescadastro: string,
): string {
  // Every promotional href of the body goes through the tracklink mapping;
  // unsubscribe/mailto anchors are exempt by contract.
  const corpoRastreado = embrulharLinksDoHtml(
    content.corpo.replace("{{lead.nome}}", nome),
    (url) => mapaDoCorpo.get(url) ?? url,
  );
  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#17131F;">
  <h1 style="font:700 22px/1.3 Arial,sans-serif;color:#7B2FBE;">${content.subject}</h1>
  <p style="font:15px/1.6 Arial,sans-serif;">${corpoRastreado}</p>
  <a href="${ctaUrl}" style="display:inline-block;background:#7B2FBE;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Quero participar</a>
  <p style="margin-top:24px;font:12px/1.5 Arial,sans-serif;color:#6b6478;">
    <a href="${urlDescadastro}" style="color:#6b6478;">Descadastrar</a>
  </p>
</div>`;
}
