import { describe, it, expect, vi } from "vitest";
import { criarRunnerMailMkt, type ConteudoDeEmail } from "./runner";
import { criarAdaptersMemoria } from "@mymailmkt/adapters";
import {
  carregarEstadoThrottle,
  CONFIG_PADRAO,
  type DependenciasDoNucleo,
  type EstadoThrottle,
} from "@mymailmkt/nucleo";
import type { CampanhaDeMarketing } from "./cadencia";
import type { IntegracaoDeTracking } from "@mymailmkt/integracoes";

const AGORA = "2026-08-18T10:00:00-03:00";

function campanhaAtiva(parcial: Partial<CampanhaDeMarketing> = {}): CampanhaDeMarketing {
  return {
    id: "c1",
    slug: "marketing-4-0",
    name: "Marketing 4.0",
    offerName: "Workshop",
    offerUrl: "https://exemplo.com.br/workshop",
    objective: "Vender",
    audience: "Todos",
    status: "active",
    cadence: "daily",
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    timezone: "America/Sao_Paulo",
    startDate: "2026-08-01",
    endDate: null,
    nextSendOn: null,
    sendIndex: 0,
    sentOccurrences: 0,
    lastSentOn: null,
    pausedAt: null,
    throttleExempt: false,
    intervalDays: 1,
    sendHour: "10:30",
    audienceFilter: null,
    ...parcial,
  };
}

const conteudo: ConteudoDeEmail = {
  subject: "Oferta {{lead.nome}}",
  corpo: "Corpo com {{lead.nome}}.",
  ctaUrl: "https://exemplo.com.br/workshop",
};

const trackingOk: IntegracaoDeTracking = {
  obterOuCriarLink: vi.fn(async () => "https://t.exemplo.com/mailmkt-marketing-4-0"),
  registrarAbertura: vi.fn(async () => {}),
  registrarClique: vi.fn(async () => {}),
};

function ctx(throttle: EstadoThrottle) {
  return {
    config: CONFIG_PADRAO,
    throttle,
    horarioAlvo: "10",
    fusivel: { esgotado: () => false, consumir: () => true },
  };
}

describe("runner mail mkt", () => {
  it("e2e feliz: 3 leads do seed, 3 enviados, 1 tracking por ocorrência", async () => {
    const { deps, estado } = criarAdaptersMemoria();
    const runner = criarRunnerMailMkt({
      lerCampanhasAtivas: async () => [campanhaAtiva()],
      lerConteudo: async () => conteudo,
      tracking: trackingOk,
      siteUrl: "https://exemplo.com.br",
    });
    const throttle = carregarEstadoThrottle([], CONFIG_PADRAO.throttle, AGORA);
    const r = await runner(deps, ctx(throttle));

    expect(r.motor).toBe("mail_mkt");
    expect(r.enviados).toBe(3); // seed tem 3 leads
    expect(estado.logDeEnvio).toHaveLength(3);
    expect(estado.enviados).toHaveLength(3);
    expect(trackingOk.obterOuCriarLink).toHaveBeenCalledTimes(1);
  });

  it("throttle compartilhado: lead que já recebeu hoje é pulado com throttle:*", async () => {
    const { deps, estado } = criarAdaptersMemoria();
    estado.logDeEnvio = [
      { email: "ana@empresa.com.br", emailType: "mail_mkt_marketing-4-0_2026-08-18", sentAt: "2026-08-18T09:00:00-03:00" },
    ];
    const runner = criarRunnerMailMkt({
      lerCampanhasAtivas: async () => [campanhaAtiva()],
      lerConteudo: async () => conteudo,
      tracking: trackingOk,
      siteUrl: "https://exemplo.com.br",
    });
    const throttle = carregarEstadoThrottle(estado.logDeEnvio, CONFIG_PADRAO.throttle, AGORA);
    const r = await runner(deps, ctx(throttle));

    expect(r.enviados).toBe(2); // os outros 2 leads
    const ana = r.pulados.find((p) => p.email === "ana@empresa.com.br");
    expect(ana?.motivo).toMatch(/^throttle:/);
  });

  it("throttleExempt pula o throttle", async () => {
    const { deps, estado } = criarAdaptersMemoria();
    estado.logDeEnvio = [
      { email: "ana@empresa.com.br", emailType: "x", sentAt: "2026-08-18T09:00:00-03:00" },
    ];
    const runner = criarRunnerMailMkt({
      lerCampanhasAtivas: async () => [campanhaAtiva({ throttleExempt: true })],
      lerConteudo: async () => conteudo,
      tracking: trackingOk,
      siteUrl: "https://exemplo.com.br",
    });
    const throttle = carregarEstadoThrottle(estado.logDeEnvio, CONFIG_PADRAO.throttle, AGORA);
    const r = await runner(deps, ctx(throttle));
    expect(r.enviados).toBe(3); // ana incluída de novo
  });

  it("falha do tracking degrada pra URL crua e o envio segue", async () => {
    const { deps } = criarAdaptersMemoria();
    const trackingRuim: IntegracaoDeTracking = {
      obterOuCriarLink: vi.fn(async () => {
        throw new Error("db down");
      }),
      registrarAbertura: vi.fn(async () => {}),
      registrarClique: vi.fn(async () => {}),
    };
    const runner = criarRunnerMailMkt({
      lerCampanhasAtivas: async () => [campanhaAtiva()],
      lerConteudo: async () => conteudo,
      tracking: trackingRuim,
      siteUrl: "https://exemplo.com.br",
    });
    const throttle = carregarEstadoThrottle([], CONFIG_PADRAO.throttle, AGORA);
    const r = await runner(deps, ctx(throttle));
    expect(r.enviados).toBe(3);
  });

  it("reserva duplicada é pulada com reserva_conflito (throttle_exempt + mesma ocorrência)", async () => {
    const { deps, estado } = criarAdaptersMemoria();
    const runner = criarRunnerMailMkt({
      lerCampanhasAtivas: async () => [campanhaAtiva({ throttleExempt: true })],
      lerConteudo: async () => conteudo,
      tracking: trackingOk,
      siteUrl: "https://exemplo.com.br",
    });
    const throttle = carregarEstadoThrottle([], CONFIG_PADRAO.throttle, AGORA);
    await runner(deps, ctx(throttle));
    // segunda rodada com MESMO dia/hora: ocorrência idêntica → UNIQUE do log pega
    const r2 = await runner(deps, ctx(throttle));
    expect(r2.enviados).toBe(0);
    expect(r2.pulados).toHaveLength(3);
    expect(r2.pulados.every((p) => p.motivo === "reserva_conflito")).toBe(true);
  });

  it("falha definitiva do enviador conta em falhas e libera a fila", async () => {
    const { deps, estado } = criarAdaptersMemoria();
    const original = deps.enviador.enviar;
    deps.enviador.enviar = async () => "falhaDefinitiva";
    const runner = criarRunnerMailMkt({
      lerCampanhasAtivas: async () => [campanhaAtiva()],
      lerConteudo: async () => conteudo,
      tracking: trackingOk,
      siteUrl: "https://exemplo.com.br",
    });
    const throttle = carregarEstadoThrottle([], CONFIG_PADRAO.throttle, AGORA);
    const r = await runner(deps, ctx(throttle));
    expect(r.falhas).toHaveLength(3);
    expect(estado.fila.liberadas).toHaveLength(3);
    expect(estado.fila.concluidas).toHaveLength(0);
    deps.enviador.enviar = original;
  });

  it("resultado ambíguo preserva reserva (fail-closed)", async () => {
    const { deps, estado } = criarAdaptersMemoria();
    const original = deps.enviador.enviar;
    deps.enviador.enviar = async () => "ambiguo";
    const runner = criarRunnerMailMkt({
      lerCampanhasAtivas: async () => [campanhaAtiva()],
      lerConteudo: async () => conteudo,
      tracking: trackingOk,
      siteUrl: "https://exemplo.com.br",
    });
    const throttle = carregarEstadoThrottle([], CONFIG_PADRAO.throttle, AGORA);
    await runner(deps, ctx(throttle));
    expect(estado.fila.concluidas).toHaveLength(0);
    expect(estado.fila.liberadas).toHaveLength(0);
    expect(estado.fila.reservadas).toHaveLength(3); // preservadas
    deps.enviador.enviar = original;
  });

  it("sucessos conta SÓ entregas reais — tentativa falha não conta como enviado", async () => {
    const { deps, estado } = criarAdaptersMemoria();
    const original = deps.enviador.enviar;
    deps.enviador.enviar = async (e) => (e.to === "ana@empresa.com.br" ? "entregue" : "falhaDefinitiva");
    const runner = criarRunnerMailMkt({
      lerCampanhasAtivas: async () => [campanhaAtiva()],
      lerConteudo: async () => conteudo,
      tracking: trackingOk,
      siteUrl: "https://exemplo.com.br",
    });
    const throttle = carregarEstadoThrottle([], CONFIG_PADRAO.throttle, AGORA);
    const r = await runner(deps, ctx(throttle));
    expect(r.enviados).toBe(1);
    expect(r.falhas).toHaveLength(2);
    deps.enviador.enviar = original;
  });
});
