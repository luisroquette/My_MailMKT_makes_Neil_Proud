import { describe, it, expect } from "vitest";
import {
  montarSlug,
  montarUtmCampaign,
  montarUrlComUtms,
  embrulharLinksDoHtml,
  SLUG_PREFIX,
  UTM_SOURCE,
  UTM_MEDIUM,
} from "./montar-url";

describe("montarSlug", () => {
  it("normaliza e prefixa (fiel ao normalizarTrackingSlug real: '.' vira '-')", () => {
    expect(montarSlug("Marketing 4.0 · Lançamento")).toBe("mailmkt-marketing-4-0-lancamento");
  });
  it("corta em 80 e remove '-' final", () => {
    const longo = "x".repeat(100);
    const slug = montarSlug(longo);
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
    expect(slug.startsWith(SLUG_PREFIX)).toBe(true);
  });
});

describe("montarUtmCampaign", () => {
  it("prefixa com mailmkt_ e respeita 120 chars", () => {
    const u = montarUtmCampaign("marketing-40");
    expect(u).toBe("mailmkt_marketing-40");
    expect(u.length).toBeLessThanOrEqual(120);
  });
});

describe("montarUrlComUtms", () => {
  it("adiciona utm_source/medium/campaign e preserva query existente", () => {
    const url = montarUrlComUtms("https://exemplo.com.br/workshop?ref=site", {
      source: UTM_SOURCE,
      medium: UTM_MEDIUM,
      campaign: "mailmkt_marketing-40",
    });
    expect(url).toContain("utm_source=mailmkt");
    expect(url).toContain("utm_medium=email");
    expect(url).toContain("utm_campaign=mailmkt_marketing-40");
    expect(url).toContain("ref=site");
  });

  it("destino inválido devolve o cru sem lançar", () => {
    expect(montarUrlComUtms("nao-e-url", { source: "a", medium: "b", campaign: "c" })).toBe("nao-e-url");
  });
});

describe("embrulharLinksDoHtml", () => {
  const html = `<p>Olá</p>
<a href="https://exemplo.com.br/oferta">CTA</a>
<a href="https://exemplo.com.br/unsubscribe?token=x">Descadastrar</a>
<a href="mailto:contato@exemplo.com.br">Fale conosco</a>
<a href="https://exemplo.com.br/a&amp;b">Com entidade</a>`;

  it("troca TODOS os hrefs menos unsubscribe e mailto", () => {
    const out = embrulharLinksDoHtml(html, (u) => `https://t.exemplo.com/r/${u}`);
    expect(out).toContain(`href="https://t.exemplo.com/r/https://exemplo.com.br/oferta"`);
    expect(out).toContain(`href="https://exemplo.com.br/unsubscribe?token=x"`);
    expect(out).toContain(`href="mailto:contato@exemplo.com.br"`);
  });

  it("href com entidade HTML é preservado na troca", () => {
    const out = embrulharLinksDoHtml(html, (u) => u + "?x=1");
    expect(out).toContain(`href="https://exemplo.com.br/a&amp;b?x=1"`);
  });

  it("mapeamento nunca recebe unsubscribe nem mailto", () => {
    const vistos: string[] = [];
    embrulharLinksDoHtml(html, (u) => {
      vistos.push(u);
      return u;
    });
    expect(vistos).toContain("https://exemplo.com.br/oferta");
    expect(vistos.join(" ")).not.toContain("unsubscribe");
    expect(vistos.join(" ")).not.toContain("mailto:");
  });
});
