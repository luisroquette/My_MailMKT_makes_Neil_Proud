import { montarSlug, montarUtmCampaign, montarUrlComUtms, UTM_SOURCE, UTM_MEDIUM } from "./montar-url";

/**
 * Tracking integration port — the mail-mkt runner depends ONLY on this
 * interface. The Supabase-backed adapter (`tracking_links` table) and the
 * in-memory adapter both implement it; the contract is owned by the
 * tracklink skill (My_UTMs_Make_Me_Proud) and referenced here.
 */
export interface IntegracaoDeTracking {
  /**
   * Return the tracked public URL for a campaign CTA. Called ONCE per
   * occurrence (same destination for all leads of the round), never per
   * lead. NEVER throws: on failure it returns the raw destination and logs —
   * analytics must not block delivery.
   */
  obterOuCriarLink(opts: {
    campanhaSlug: string;
    campanhaNome: string;
    destino: string;
    motor?: string;
  }): Promise<string>;

  registrarAbertura(trackingId: string): Promise<void>;
  registrarClique(trackingId: string, url: string): Promise<void>;
}

export interface OpcoesDeTracking {
  siteUrl: string;
  salvarLink: (link: {
    slug: string;
    destino: string;
    destinoRastreado: string;
    nome: string;
  }) => Promise<{ ok: true } | { ok: false; codigo?: string }>;
  /** Best-effort destination refresh on reuse (offer changed). Failure is fine. */
  atualizarLink: (slug: string, destino: string, destinoRastreado: string) => Promise<void>;
}

/**
 * Reference implementation against the Supabase tracking_links table shape.
 * Idempotent by slug: the first call creates; later calls REUSE the existing
 * link — a unique violation (23505) is the NORMAL reuse path and must keep
 * the tracked URL, not degrade to the raw destination. Only a real error
 * degrades (analytics never blocks delivery).
 */
export function criarIntegracaoDeTracking(
  opts: OpcoesDeTracking,
  log: (msg: string, meta?: unknown) => void,
): IntegracaoDeTracking {
  return {
    async obterOuCriarLink({ campanhaSlug, campanhaNome, destino, motor }) {
      const slug = montarSlug(motor ? `${motor}-${campanhaSlug}` : campanhaSlug);
      const utmCampaign = montarUtmCampaign(motor ? `${motor}-${campanhaSlug}` : campanhaSlug);
      const destinoRastreado = montarUrlComUtms(destino, {
        source: UTM_SOURCE,
        medium: UTM_MEDIUM,
        campaign: utmCampaign,
      });
      try {
        const r = await opts.salvarLink({
          slug,
          destino,
          destinoRastreado,
          nome: `Mail Mkt · ${campanhaNome}`.slice(0, 100),
        });
        if (!r.ok && r.codigo !== "23505") {
          log("[tracklink] persistência falhou — envio segue com URL crua", {
            slug,
            codigo: r.codigo,
          });
          return destino;
        }
        // 23505 (reuse): refresh the destination in case the offer changed —
        // best effort, a refresh failure must not degrade the tracked URL.
        if (!r.ok) {
          try {
            await opts.atualizarLink(slug, destino, destinoRastreado);
          } catch {
            log("[tracklink] refresh do destino falhou — segue com o destino registrado", { slug });
          }
        }
      } catch (erro) {
        log("[tracklink] persistência falhou — envio segue com URL crua", {
          slug,
          erro: erro instanceof Error ? erro.message : String(erro),
        });
        return destino;
      }
      return `${opts.siteUrl}/t/${slug}`;
    },
    async registrarAbertura(trackingId) {
      await registrarEvento(opts, log, { trackingId, tipo: "abertura" });
    },
    async registrarClique(trackingId, url) {
      await registrarEvento(opts, log, { trackingId, tipo: "clique", url });
    },
  };
}

async function registrarEvento(
  opts: OpcoesDeTracking,
  log: (msg: string, meta?: unknown) => void,
  ev: { trackingId: string; tipo: string; url?: string },
): Promise<void> {
  // Events are the tracklink layer's job; the adapter records them best-effort.
  // Kept as a no-op seam here — analytics must never block delivery.
  void opts;
  void ev;
  log("[tracklink] evento", ev);
}
