import { describe, it, expect, vi } from "vitest";
import { rodarDispatcher, PRAZO_DE_LOOP_MS, type RunnerDeMotor, type ResultadoDaRodada } from "./dispatcher";
import type { DependenciasDoNucleo, Relogio, RepositorioDeNurture, FilaOutbox, EnviadorDeEmail, RegistradorDeEventos } from "./contratos";
import { CONFIG_PADRAO, type ConfigNurture, type MotorId } from "./config";

const AGORA = "2026-08-18T10:00:00-03:00";

function deps(): DependenciasDoNucleo {
  const relogio: Relogio = {
    agoraIso: () => AGORA,
    horaLocalHH: () => "10",
    diaDaSemanaLocal: () => 2,
  };
  const repo: RepositorioDeNurture = {
    lerLeads: async () => ({ itens: [], temMais: false, offset: 0 }),
    lerSupressoes: async () => new Set(),
    lerLogDeEnvio: async () => [],
    reservarNoLog: async () => "ok",
  };
  const fila: FilaOutbox = {
    reservar: async () => true,
    reivindicar: async () => null,
    concluir: async () => {},
    liberar: async () => {},
    listarPendentes: async () => [],
    removerOrfas: async () => 0,
    descartar: async () => {},
  };
  return {
    repo,
    fila,
    enviador: {} as EnviadorDeEmail,
    eventos: {} as RegistradorDeEventos,
    relogio,
    log: () => {},
  };
}

function runnerFake(nome: MotorId, enviados: string[]) {
  const runner: RunnerDeMotor = async () => {
    const resultado: ResultadoDaRodada = {
      motor: nome,
      candidatos: 1,
      enviados: 1,
      pulados: [],
      falhas: [],
    };
    enviados.push(nome);
    return resultado;
  };
  return runner;
}

// agenda explícita: os 5 motores devidos no mesmo tique "10" — a ordem real
// é resolvida por PRIORIDADE, não pela ordem da agenda
function configComTodosNaHora(): ConfigNurture {
  return {
    ...CONFIG_PADRAO,
    agenda: ["mail_mkt", "lancamento", "esteira", "digest", "video_digest"].map((alvo) => ({
      dias: [0, 1, 2, 3, 4, 5, 6],
      horas: ["10:00"],
      alvo: alvo as MotorId,
    })),
  };
}

describe("rodarDispatcher", () => {
  it("ordem de prioridade respeitada mesmo com agenda em outra ordem", async () => {
    const ordem: string[] = [];
    const motores = {
      mail_mkt: runnerFake("mail_mkt", ordem),
      lancamento: runnerFake("lancamento", ordem),
      esteira: runnerFake("esteira", ordem),
      digest: runnerFake("digest", ordem),
      video_digest: runnerFake("video_digest", ordem),
    } as Record<MotorId, RunnerDeMotor>;
    // agenda em ordem invertida de propósito
    const config: ConfigNurture = {
      ...configComTodosNaHora(),
      agenda: [...configComTodosNaHora().agenda!].reverse(),
    };
    await rodarDispatcher(deps(), config, motores);
    expect(ordem).toEqual(["mail_mkt", "lancamento", "esteira", "digest", "video_digest"]);
  });

  it("opts.motor filtra só o motor pedido", async () => {
    const ordem: string[] = [];
    const motores = {
      mail_mkt: runnerFake("mail_mkt", ordem),
      lancamento: runnerFake("lancamento", ordem),
      esteira: runnerFake("esteira", ordem),
      digest: runnerFake("digest", ordem),
      video_digest: runnerFake("video_digest", ordem),
    } as Record<MotorId, RunnerDeMotor>;
    await rodarDispatcher(deps(), configComTodosNaHora(), motores, { motor: "digest" });
    expect(ordem).toEqual(["digest"]);
  });

  it("defaults reais: tique '10' roda mail_mkt + esteira na ordem de prioridade", async () => {
    const ordem: string[] = [];
    const motores = {
      mail_mkt: runnerFake("mail_mkt", ordem),
      lancamento: runnerFake("lancamento", ordem),
      esteira: runnerFake("esteira", ordem),
      digest: runnerFake("digest", ordem),
      video_digest: runnerFake("video_digest", ordem),
    } as Record<MotorId, RunnerDeMotor>;
    await rodarDispatcher(deps(), CONFIG_PADRAO, motores);
    expect(ordem).toEqual(["mail_mkt", "esteira"]);
  });

  it("REGRESSÃO: prioridade do config (banco) vence a ordem da agenda", async () => {
    const ordem: string[] = [];
    const motores = {
      mail_mkt: runnerFake("mail_mkt", ordem),
      lancamento: runnerFake("lancamento", ordem),
      esteira: runnerFake("esteira", ordem),
      digest: runnerFake("digest", ordem),
      video_digest: runnerFake("video_digest", ordem),
    } as Record<MotorId, RunnerDeMotor>;
    const config: ConfigNurture = {
      ...configComTodosNaHora(),
      prioridade: ["digest", "esteira", "mail_mkt", "lancamento", "video_digest"],
    };
    await rodarDispatcher(deps(), config, motores);
    expect(ordem).toEqual(["digest", "esteira", "mail_mkt", "lancamento", "video_digest"]);
  });

  it("PRAZO_DE_LOOP_MS é 240s (abaixo do maxDuration 300s)", () => {
    expect(PRAZO_DE_LOOP_MS).toBe(240_000);
  });

  it("horário sem motor não roda nada", async () => {
    const d = deps();
    d.relogio.horaLocalHH = () => "03";
    const espiao = vi.fn(async () => ({
      motor: "mail_mkt" as MotorId, candidatos: 0, enviados: 0, pulados: [], falhas: [],
    }));
    const motores = { mail_mkt: espiao } as unknown as Record<MotorId, RunnerDeMotor>;
    const { resultados } = await rodarDispatcher(d, CONFIG_PADRAO, motores);
    expect(resultados).toEqual([]);
    expect(espiao).not.toHaveBeenCalled();
  });
});
