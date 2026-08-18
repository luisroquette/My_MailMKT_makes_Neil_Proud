import { describe, it, expect } from "vitest";
import { estaAtivaNaHora, ocorrenciaId, candidatos, type CampanhaDeMarketing } from "./cadencia";
import type { LeadNurture } from "@mymailmkt/nucleo";

function campanha(parcial: Partial<CampanhaDeMarketing> = {}): CampanhaDeMarketing {
  return {
    id: "c1",
    slug: "marketing-4-0",
    name: "Marketing 4.0",
    offerName: "Workshop",
    offerUrl: "https://exemplo.com.br/workshop",
    objective: "Vender workshop",
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

const lead = (parcial: Partial<LeadNurture> = {}): LeadNurture => ({
  id: "l1",
  email: "a@x.com",
  name: "A",
  createdAt: "2026-08-10T00:00:00-03:00",
  ...parcial,
});

describe("estaAtivaNaHora", () => {
  it("sendHour :30 é alcançado pelo tique de hora cheia (truncado)", () => {
    expect(estaAtivaNaHora(campanha({ sendHour: "10:30" }), "10", 2, "2026-08-18")).toBe(true);
  });

  it("hora diferente não ativa", () => {
    expect(estaAtivaNaHora(campanha({ sendHour: "10:30" }), "11", 2, "2026-08-18")).toBe(false);
  });

  it("weekdays filtra", () => {
    const c = campanha({ sendHour: "10:30", weekdays: [1] });
    expect(estaAtivaNaHora(c, "10", 1, "2026-08-18")).toBe(true);
    expect(estaAtivaNaHora(c, "10", 2, "2026-08-18")).toBe(false);
  });

  it("status não-active nunca ativa", () => {
    expect(estaAtivaNaHora(campanha({ status: "paused" }), "10", 2, "2026-08-18")).toBe(false);
    expect(estaAtivaNaHora(campanha({ status: "completed" }), "10", 2, "2026-08-18")).toBe(false);
  });

  it("endDate no passado não ativa", () => {
    expect(estaAtivaNaHora(campanha({ endDate: "2026-08-17" }), "10", 2, "2026-08-18")).toBe(false);
  });

  it("REGRESSÃO: startDate no futuro não ativa (agendamento)", () => {
    expect(estaAtivaNaHora(campanha({ startDate: "2026-08-20" }), "10", 2, "2026-08-18")).toBe(false);
    expect(estaAtivaNaHora(campanha({ startDate: "2026-08-18" }), "10", 2, "2026-08-18")).toBe(true);
  });
});

describe("ocorrenciaId", () => {
  it("cadência horária muda a cada hora", () => {
    const c = campanha({ cadence: "hourly" });
    expect(ocorrenciaId(c, "10", "2026-08-18")).not.toBe(ocorrenciaId(c, "11", "2026-08-18"));
  });

  it("cadência diária é estável dentro do dia", () => {
    const c = campanha({ cadence: "daily" });
    expect(ocorrenciaId(c, "10", "2026-08-18")).toBe(ocorrenciaId(c, "11", "2026-08-18"));
  });

  it("nunca usa nextSendOn (agenda não avança no dia)", () => {
    const c = campanha({ cadence: "daily", nextSendOn: "2026-08-19T10:00:00Z" });
    expect(ocorrenciaId(c, "10", "2026-08-18")).toContain("2026-08-18");
  });
});

describe("candidatos", () => {
  it("aplica segmentos, fontes e idade mínima", () => {
    const c = campanha({
      audienceFilter: { segmentos: ["empresa"], fontes: ["lp-kit"], idadeMinimaDias: 3 },
    });
    const leads = [
      lead({ id: "ok", segment: "empresa", source: "lp-kit", createdAt: "2026-08-10T00:00:00-03:00" }),
      lead({ id: "seg-errado", segment: "aluno", source: "lp-kit", createdAt: "2026-08-10T00:00:00-03:00" }),
      lead({ id: "fonte-errada", segment: "empresa", source: "workshop", createdAt: "2026-08-10T00:00:00-03:00" }),
      lead({ id: "novo-demais", segment: "empresa", source: "lp-kit", createdAt: "2026-08-17T00:00:00-03:00" }),
    ];
    const agora = "2026-08-18T10:00:00-03:00";
    expect(candidatos(c, leads, agora).map((l) => l.id)).toEqual(["ok"]);
  });

  it("sem audienceFilter devolve todos", () => {
    const c = campanha();
    const leads = [lead({ id: "a" }), lead({ id: "b", segment: "empresa" })];
    expect(candidatos(c, leads, "2026-08-18T10:00:00-03:00").map((l) => l.id)).toEqual(["a", "b"]);
  });
});
