import type { DependenciasDoNucleo } from "./contratos";
import type { ConfigNurture, MotorId } from "./config";
import { PRIORIDADE_DOS_MOTORES } from "./config";
import { alvosDaHora, agendaPadraoDe } from "./agenda";
import { carregarEstadoThrottle, type EstadoThrottle } from "./throttle";
import { PRAZO_DE_LOOP_MS } from "./outbox";

export { PRAZO_DE_LOOP_MS };

export interface ResultadoDaRodada {
  motor: MotorId;
  candidatos: number;
  enviados: number;
  pulados: { email: string; motivo: string }[];
  falhas: { email: string; erro: string }[];
}

export interface ContextoDoMotor {
  config: ConfigNurture;
  throttle: EstadoThrottle;
  horarioAlvo: string;
  fusivel: { esgotado(): boolean; consumir(): boolean };
}

export type RunnerDeMotor = (
  deps: DependenciasDoNucleo,
  ctx: ContextoDoMotor,
) => Promise<ResultadoDaRodada>;

export interface OpcoesDoDispatcher {
  dry?: boolean;
  motor?: MotorId;
  prazoMs?: number;
}

export interface ResultadoDoDispatcher {
  resultados: ResultadoDaRodada[];
  cortePorPrazo?: MotorId;
}

/**
 * Single dispatch point — the "one cron" of the reference system.
 *
 * Fidelity contract (CF Gauss, `nurture-dispatcher`, "0 * * * *"): one tick
 * asks the database-backed agenda "who is due at this hour", then runs the
 * due motors in PRIORITY order sharing ONE throttle state, ONE shared fuse
 * and ONE hard loop budget (240s < the 300s platform maxDuration). Alerts
 * fire for a motor with zero sends plus failures — the caller wires `log`
 * to the alerting channel.
 */
export async function rodarDispatcher(
  deps: DependenciasDoNucleo,
  config: ConfigNurture,
  motores: Record<MotorId, RunnerDeMotor>,
  opts?: OpcoesDoDispatcher,
): Promise<ResultadoDoDispatcher> {
  const agora = deps.relogio.agoraIso();
  const hora = deps.relogio.horaLocalHH();
  const dia = deps.relogio.diaDaSemanaLocal();

  const agenda = config.agenda ?? agendaPadraoDe(config);
  let devidos = alvosDaHora(agenda, hora, dia);

  if (opts?.motor) devidos = devidos.filter((m) => m === opts.motor);
  // reorder by global priority (alvosDaHora preserves agenda order, which
  // may differ from PRIORIDADE_DOS_MOTORES)
  const ordenados = PRIORIDADE_DOS_MOTORES.filter((m) => devidos.includes(m));

  // One shared throttle state loaded once per round — the second motor sees
  // what the first served. (Callers must clean orphan reservations BEFORE
  // this — see the reference: load-after-clean, never the reverse.)
  // Fetch a 168h window; carregarEstadoThrottle trims to the effective
  // window (max(24h, minHorasEntreEnvios)) in memory.
  const desde = new Date(new Date(agora).getTime() - 168 * 60 * 60 * 1000).toISOString();
  const logDeEnvio = await deps.repo.lerLogDeEnvio({ desde });
  const throttle = carregarEstadoThrottle(logDeEnvio, config.throttle, agora);

  // One shared fuse for the whole round.
  let restante = config.fusivel.email;
  const fusivel = {
    esgotado: () => restante <= 0,
    consumir: () => {
      if (restante <= 0) return false;
      restante -= 1;
      return true;
    },
  };

  const prazoMs = opts?.prazoMs ?? PRAZO_DE_LOOP_MS;
  const inicio = Date.now();
  const resultados: ResultadoDaRodada[] = [];

  for (const motor of ordenados) {
    if (Date.now() - inicio >= prazoMs) {
      return { resultados, cortePorPrazo: motor };
    }
    const runner = motores[motor];
    if (!runner) {
      deps.log(`[dispatcher] motor ${motor} da hora mas sem runner registrado`);
      continue;
    }
    const resultado = await runner(deps, {
      config,
      throttle,
      horarioAlvo: hora,
      fusivel,
    });
    resultados.push(resultado);

    // Alert: motor with zero sends AND failures — separate from
    // "campaign with zero sends" (checked inside the marketing runner).
    if (resultado.enviados === 0 && resultado.falhas.length > 0) {
      deps.log("[alerta] motor com 0 enviados e falhas", {
        motor: resultado.motor,
        falhas: resultado.falhas.length,
      });
    }
  }

  return { resultados };
}
