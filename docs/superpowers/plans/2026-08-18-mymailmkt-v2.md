# My_MailMKT v2.0.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portar o cockpit de e-mail marketing da CF Gauss (throttle compartilhado, cron único, regras no banco, outbox durável, dashboard) para o repo público como núcleo porta/adaptador + motor mail_mkt completo + plugs tracklink/LP + dashboard demo.

**Architecture:** Núcleo canal-agnóstico em TypeScript puro (`nucleo/`, zero dependências de runtime) com portas (repositório, fila, enviador, relógio, eventos). Adapters fiéis (Supabase/Resend) e adapters em-memória para a demo. Os 5 motores consomem o mesmo throttle; mail_mkt é portado por completo. Integrações tracklink (todo CTA vira tracking link) e LP (intake de leads). Dashboard demo standalone.

**Tech Stack:** TypeScript (Node 20+), vitest, Next.js 15 + Tailwind + shadcn/ui (dashboard/), npm workspaces.

## Global Constraints

- Idioma do repo: **inglês** (código, comentários, README) — spec e planos em PT-BR.
- Zero dependências de runtime em `nucleo/`, `motores/` e `integracoes/` (só `typescript`/`vitest` dev).
- Throttle: `maxPorLeadPorDia: 1`, `minHorasEntreEnvios: 20`.
- Fuso: `America/Sao_Paulo` sempre; nunca `Date#getHours()`.
- Prioridade dos motores: `mail_mkt > lancamento > esteira > digest > video_digest`.
- Slug de tracking do mail mkt: prefixo `mailmkt-`; `utm_source=mailmkt`, `utm_medium=email`, `utm_campaign=mailmkt_<slug>`.
- Analytics nunca derruba entrega (falha degrada pra URL crua + log).
- Copy nunca sai reprovada pelo piso: gate roda no salvar E no enviar.
- Cada task termina com commit; testes verdes antes de commitar.

---

### Task 0: Fase 0 — Rebuild do grafo CF Gauss (corpus novo)

**Files:**
- Modify: `/Users/luisroquette/cfgauss-agentic-graph/_build.py:12-18` (`COMPONENTS`)
- Create: `/tmp/cfgauss-main-v2` (checkout isolado de origin/main, descartável)

**Interfaces:**
- Produces: `graphify-out/graph.json` novo (com nós de `lib/nurture`, cron nurture, `components/admin/Cockpit`) + nota de hotspots (top 10 nós nurture por edges) em `docs/superpowers/plans/2026-08-18-mymailmkt-grafo-nota.md` (no repo MailMKT).

- [ ] **Step 1: Checkout isolado do origin/main do cfgauss-site (NUNCA tocar na working copy compartilhada)**

```bash
git -C /Users/luisroquette/Projects/cfgauss-site fetch origin main 2>/dev/null
rm -rf /tmp/cfgauss-main-v2
git clone --no-checkout /Users/luisroquette/Projects/cfgauss-site /tmp/cfgauss-main-v2
git -C /tmp/cfgauss-main-v2 checkout origin/main 2>&1 | tail -1
```

- [ ] **Step 2: Confirmar que os paths do cockpit existem nesse checkout**

```bash
ls /tmp/cfgauss-main-v2/lib/nurture/throttle.ts \
   /tmp/cfgauss-main-v2/app/api/cron/nurture-dispatcher/route.ts \
   /tmp/cfgauss-main-v2/components/admin/Cockpit/ 2>&1 | head -5
```
Expected: os 3 paths existem (throttle.ts, route.ts, listagem do Cockpit).

- [ ] **Step 3: Editar `COMPONENTS` em `_build.py` (linhas 12-18)**

Adicionar ao dicionário (manter os existentes):
```python
"nurture": f"{REPO}/lib/nurture",
"nurture-cron": f"{REPO}/app/api/cron",
"cockpit": f"{REPO}/components/admin/Cockpit",
```
E trocar `REPO` para `/tmp/cfgauss-main-v2` nesta rodada (checkout isolado). Manter guard `if __name__ == "__main__":` e filtro de `.ts`/`.tsx` existentes.

- [ ] **Step 4: Rodar build + label com o venv do graphify**

```bash
cd /Users/luisroquette/cfgauss-agentic-graph && \
/Users/luisroquette/.local/share/uv/tools/graphifyy/bin/python3 _build.py 2>&1 | tail -5 && \
/Users/luisroquette/.local/share/uv/tools/graphifyy/bin/python3 _label.py 2>&1 | tail -5
```
Expected: grafo novo gerado sem erro de multiprocessing (spawn).

- [ ] **Step 5: Verificar cobertura nova**

```bash
grep -c "nurture" /Users/luisroquette/cfgauss-agentic-graph/graphify-out/graph.json
```
Expected: > 0 (antes era 0).

- [ ] **Step 6: Extrair top 10 nós nurture por edges e salvar nota**

```bash
cd /Users/luisroquette/cfgauss-agentic-graph && \
python3 -c "
import json
g = json.load(open('graphify-out/graph.json'))
nos = g.get('nodes', g if isinstance(g, list) else [])
# adaptar à estrutura real do graph.json; imprimir top 10 por edges
" 2>&1 | head -15
```
Se o parse falhar, usar `jq` equivalente; o objetivo é a lista dos 10 nós de nurture mais conectados → salvar em `docs/superpowers/plans/2026-08-18-mymailmkt-grafo-nota.md` (no repo MailMKT, worktree).

- [ ] **Step 7: Commit da nota no repo MailMKT (worktree v2-20260818)**

```bash
cd /Users/luisroquette/Projects/My_MailMKT_makes_Neil_Proud/.worktrees/v2-20260818
git add docs/superpowers/plans/2026-08-18-mymailmkt-grafo-nota.md
git commit -m "docs: nota do grafo CF Gauss com corpus nurture (fase 0)"
```

---

### Task 1: Estrutura v2 — workspaces, config de teste, CHANGELOG

**Files:**
- Modify: `package.json` (workspaces + scripts), `CHANGELOG.md` (promover `[Unreleased]` → `[2.0.0]`)
- Create: `tsconfig.base.json`, `vitest.workspace.ts`, `nucleo/package.json`, `motores/package.json`, `integracoes/package.json`, `adapters/package.json`, `nucleo/tsconfig.json`, `motores/tsconfig.json`, `integracoes/tsconfig.json`, `adapters/tsconfig.json`

**Interfaces:**
- Produces: workspaces npm `nucleo`, `motores`, `integracoes`, `adapters`; `npm test` roda vitest em todos; imports cruzados via `"@mymailmkt/nucleo"` etc. mapeados em `tsconfig.base.json` (`paths`).

- [ ] **Step 1: package.json raiz**

```json
{
  "name": "my-mailmkt-makes-neil-proud",
  "private": true,
  "workspaces": ["nucleo", "motores", "integracoes", "adapters"],
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": { "typescript": "^5.6.0", "vitest": "^2.1.0" }
}
```
Preservar `type`, `scripts/` existentes e qualquer campo de metadados atual do package.json (ler antes de sobrescrever).

- [ ] **Step 2: tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "ESNext", "moduleResolution": "Bundler",
    "strict": true, "skipLibCheck": true, "noEmit": true,
    "paths": {
      "@mymailmkt/nucleo": ["./nucleo/src/index.ts"],
      "@mymailmkt/motores": ["./motores/src/index.ts"],
      "@mymailmkt/integracoes": ["./integracoes/src/index.ts"],
      "@mymailmkt/adapters": ["./adapters/src/index.ts"]
    }
  }
}
```
Cada workspace com `tsconfig.json` = `{ "extends": "../../tsconfig.base.json" }` e `package.json` = `{ "name": "@mymailmkt/<ws>", "private": true }`.

- [ ] **Step 3: vitest.workspace.ts**

```ts
import { defineWorkspace } from "vitest/config";
export default defineWorkspace(["nucleo", "motores", "integracoes", "adapters"]);
```

- [ ] **Step 4: CHANGELOG — promover Unreleased**

No `CHANGELOG.md`, substituir a seção `## Unreleased` por:

```markdown
## [2.0.0] - 2026-08-18

### Added

- `nucleo/` — throttle compartilhado (1 e-mail/lead/dia, 20h), dispatcher por prioridade,
  outbox durável (reserve/claim/complete/release, lease 5min, dead-letter 23h), config com
  fallback, agenda por dia/hora com fuso America/Sao_Paulo, fusível e prazo de loop.
- `motores/mail-mkt/` — cadência real por campanha (send_hour, interval_days, weekdays,
  audience_filter, throttle_exempt), sequência de 25 dias como camada de conteúdo.
- `integracoes/tracklink/` — todo CTA sai com tracking link (`mailmkt-<slug>`) + eventos.
- `integracoes/lp/` — contrato de intake de leads.
- `adapters/supabase` e `adapters/resend` — fiéis ao motor real da CF Gauss.
- `adapters/memoria` — demo roda sem serviços externos.
- `dashboard/` — demo standalone (hub, calendário 14 dias, regras, agenda, campanhas, copy).
```

- [ ] **Step 5: Verificar**

```bash
cd /Users/luisroquette/Projects/My_MailMKT_makes_Neil_Proud/.worktrees/v2-20260818
npm install 2>&1 | tail -2 && npm test 2>&1 | tail -3
```
Expected: install ok; vitest roda com "No test files found" (ainda não há testes — saída não-zero é aceitável aqui, mas sem erro de config).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.base.json vitest.workspace.ts CHANGELOG.md nucleo motores integracoes adapters
git commit -m "chore: workspaces v2 + vitest + CHANGELOG 2.0.0"
```

---

### Task 2: nucleo/contratos.ts — as portas

**Files:**
- Create: `nucleo/src/contratos.ts`

**Interfaces:**
- Produces (tipos usados por TODAS as tasks seguintes):

```ts
export interface LeadNurture {
  id: string; email: string; name: string; whatsapp?: string | null;
  company?: string | null; role?: string | null; segment?: string | null;
  interest?: string | null; source?: string | null; page?: string | null;
  createdAt: string; // ISO
}
export interface LinhaLogDeEnvio { email: string; emailType: string; sentAt: string; }
export interface Pagina<T> { itens: T[]; temMais: boolean; offset: number; }
export interface ReservaLog { leadId: string; email: string; emailType: string; sentAt: string; }
export type ResultadoReserva = "ok" | "duplicado" | "erro";
export interface EmailParaEnviar {
  to: string; subject: string; html: string; emailType: string;
  trackingId?: string | null; idempotencyKey: string;
}
export type ResultadoEnvio = "entregue" | "falhaDefinitiva" | "ambiguo";
export interface EventoDeEmail { tipo: "abertura" | "clique" | "conversao"; email: string; emailType: string; url?: string; em: string; }
export interface Relogio { agoraIso(): string; horaLocalHH(): string; diaDaSemanaLocal(): number; }
export interface RepositorioDeNurture {
  lerLeads(opts: { offset: number; limite: number }): Promise<Pagina<LeadNurture>>;
  lerSupressoes(): Promise<Set<string>>;
  lerLogDeEnvio(opts: { desde: string }): Promise<LinhaLogDeEnvio[]>;
  reservarNoLog(r: ReservaLog): Promise<ResultadoReserva>;
}
export interface FilaOutbox {
  reservar(e: EmailParaEnviar): Promise<boolean>;
  concluir(idempotencyKey: string): Promise<void>;
  liberar(idempotencyKey: string): Promise<void>;
}
export interface EnviadorDeEmail { enviar(e: EmailParaEnviar): Promise<ResultadoEnvio>; }
export interface RegistradorDeEventos { registrar(ev: EventoDeEmail): Promise<void>; }
export interface DependenciasDoNucleo {
  repo: RepositorioDeNurture; fila: FilaOutbox; enviador: EnviadorDeEmail;
  eventos: RegistradorDeEventos; relogio: Relogio; log(msg: string, meta?: unknown): void;
}
```

- [ ] **Step 1: Criar o arquivo com o conteúdo acima (ajustar comentários em inglês)**
- [ ] **Step 2: `npx tsc -p nucleo/tsconfig.json --noEmit`** → Expected: compila sem erro.
- [ ] **Step 3: Commit** — `git add nucleo/src/contratos.ts && git commit -m "feat(nucleo): contratos (portas) do núcleo porta/adaptador"`

---

### Task 3: nucleo/config.ts — CONFIG_PADRAO + mesclarConfig (puro, TDD)

**Files:**
- Create: `nucleo/src/config.ts`, `nucleo/src/config.test.ts`

**Interfaces:**
- Consumes: nada (puro).
- Produces:

```ts
export interface RegrasThrottle { maxPorLeadPorDia: number; minHorasEntreEnvios: number; }
export interface HorariosDosMotores { esteira: string; lancamento: string; mail_mkt: string; digest: string; video_digest: string; }
export type MotorId = keyof HorariosDosMotores;
export const PRIORIDADE_DOS_MOTORES: readonly MotorId[] = ["mail_mkt", "lancamento", "esteira", "digest", "video_digest"];
export interface ConfigNurture {
  throttle: RegrasThrottle;
  prioridade: MotorId[];
  horarios: HorariosDosMotores;
  digestDiaDaSemana: number; // 4 = quinta
  timezone: string; // "America/Sao_Paulo"
  janelas: { diasPermitidos: number[]; blackout: { inicio: string; fim: string }[] };
  fusivel: { email: number };
  agenda: AgendaEntrada[] | null; // null = derivar de horarios
}
export interface AgendaEntrada { dias: number[]; horas: string[]; alvo: MotorId; }
export const CONFIG_PADRAO: ConfigNurture;
export function mesclarConfig(parcial: unknown): ConfigNurture; // inválido cai no default, campo a campo
```

- [ ] **Step 1: Teste que falha** (`nucleo/src/config.test.ts`)

```ts
import { describe, it, expect } from "vitest";
import { CONFIG_PADRAO, mesclarConfig } from "./config";

describe("mesclarConfig", () => {
  it("campo ausente usa default", () => {
    expect(mesclarConfig({}).throttle).toEqual({ maxPorLeadPorDia: 1, minHorasEntreEnvios: 20 });
  });
  it("valor válido vence", () => {
    const c = mesclarConfig({ throttle: { maxPorLeadPorDia: 3 } });
    expect(c.throttle.maxPorLeadPorDia).toBe(3);
    expect(c.throttle.minHorasEntreEnvios).toBe(20); // irmão preservado
  });
  it("valor inválido cai no default sem lançar", () => {
    expect(mesclarConfig({ throttle: { maxPorLeadPorDia: "abc" } }).throttle.maxPorLeadPorDia).toBe(1);
    expect(mesclarConfig({ horarios: { mail_mkt: "25:99" } }).horarios.mail_mkt).toBe("10:30");
  });
  it("prioridade fora do enum é descartada", () => {
    expect(mesclarConfig({ prioridade: ["digest", "lixo"] }).prioridade).toEqual(["digest"]);
  });
  it("fusível inválido cai no default", () => {
    expect(mesclarConfig({ fusivel: { email: -1 } }).fusivel.email).toBe(100);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run nucleo/src/config.test.ts` → Expected: FAIL (module not found).
- [ ] **Step 3: Implementar** — `config.ts` com `CONFIG_PADRAO` (valores reais da CF Gauss: throttle 1/20; horarios `esteira:"10:00", lancamento:"09:30", mail_mkt:"10:30", digest:"11:00", video_digest:"20:45"`; `digestDiaDaSemana:4`; `timezone:"America/Sao_Paulo"`; `janelas:{diasPermitidos:[0,1,2,3,4,5,6],blackout:[]}`; `fusivel:{email:100}`; `agenda:null`), validadores puros (`inteiro(n)`, `HORA = /^\d{2}:\d{2}$/ + faixa`, `DATA_ISO`), `mesclarConfig` campo a campo sem lançar.
- [ ] **Step 4: Rodar e ver passar** — mesmo comando → Expected: 5 PASS.
- [ ] **Step 5: Commit** — `git add nucleo/src/config.ts nucleo/src/config.test.ts && git commit -m "feat(nucleo): config com fallback — regras no banco com default do comportamento atual"`

---

### Task 4: nucleo/throttle.ts — o coração (TDD)

**Files:**
- Create: `nucleo/src/throttle.ts`, `nucleo/src/throttle.test.ts`

**Interfaces:**
- Consumes: `RegrasThrottle` (Task 3), `LinhaLogDeEnvio` (Task 2).
- Produces:

```ts
export interface EstadoThrottle { enviadosPorEmail: Map<string, string[]>; }
export function carregarEstadoThrottle(log: LinhaLogDeEnvio[], regras: RegrasThrottle, agoraIso: string): EstadoThrottle;
// janela = max(24h, minHorasEntreEnvios) atrás de agoraIso; mantém só envios dentro da janela
export function podeReceber(estado: EstadoThrottle, email: string, regras: RegrasThrottle, agoraIso: string):
  { permitido: true } | { permitido: false; motivo: "limite_por_dia" | "intervalo_minimo" };
// email normalizado lowercase pelo chamador; conta envios no dia local (America/Sao_Paulo) e
// distância até o mais recente
export function aplicarEnvio(estado: EstadoThrottle, email: string, agoraIso: string): void;
```

- [ ] **Step 1: Teste que falha** (`throttle.test.ts`) — casos:

```ts
const regras = { maxPorLeadPorDia: 1, minHorasEntreEnvios: 20 };
const AGORA = "2026-08-18T15:00:00-03:00"; // 15h BRT

it("lead sem envio pode receber", () => {
  const e = carregarEstadoThrottle([], regras, AGORA);
  expect(podeReceber(e, "a@x.com", regras, AGORA)).toEqual({ permitido: true });
});
it("bloqueia 2º e-mail no mesmo dia", () => {
  const e = carregarEstadoThrottle(
    [{ email: "a@x.com", emailType: "esteira", sentAt: "2026-08-18T12:00:00-03:00" }], regras, AGORA);
  expect(podeReceber(e, "a@x.com", regras, AGORA)).toEqual({ permitido: false, motivo: "limite_por_dia" });
});
it("bloqueia por intervalo mínimo mesmo em dias diferentes", () => {
  const e = carregarEstadoThrottle(
    [{ email: "a@x.com", emailType: "esteira", sentAt: "2026-08-17T20:00:00-03:00" }], regras, AGORA);
  expect(podeReceber(e, "a@x.com", regras, AGORA)).toEqual({ permitido: false, motivo: "intervalo_minimo" });
});
it("envio de outro motor no mesmo dia também conta (throttle compartilhado)", () => {
  const e = carregarEstadoThrottle(
    [{ email: "a@x.com", emailType: "mail_mkt", sentAt: "2026-08-18T10:00:00-03:00" }], regras, AGORA);
  expect(podeReceber(e, "a@x.com", regras, AGORA).permitido).toBe(false);
});
it("aplicarEnvio atualiza o estado em memória (segundo motor enxerga o primeiro)", () => {
  const e = carregarEstadoThrottle([], regras, AGORA);
  aplicarEnvio(e, "a@x.com", AGORA);
  expect(podeReceber(e, "a@x.com", regras, AGORA).permitido).toBe(false);
});
it("envio antigo fora da janela não bloqueia", () => {
  const e = carregarEstadoThrottle(
    [{ email: "a@x.com", emailType: "esteira", sentAt: "2026-08-16T09:00:00-03:00" }], regras, AGORA);
  expect(podeReceber(e, "a@x.com", regras, AGORA).permitido).toBe(true);
});
it("email vazio nunca recebe", () => {
  const e = carregarEstadoThrottle([], regras, AGORA);
  expect(podeReceber(e, "", regras, AGORA).permitido).toBe(false);
});
```

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run nucleo/src/throttle.test.ts` → FAIL.
- [ ] **Step 3: Implementar** — dia local via `new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year:"numeric",month:"2-digit",day:"2-digit" })` (nunca `getHours()`); janela de carregamento `max(24h, minHorasEntreEnvios)`; `aplicarEnvio` só muta o Map.
- [ ] **Step 4: Rodar e ver passar** → 7 PASS.
- [ ] **Step 5: Commit** — `feat(nucleo): throttle compartilhado 1/lead/dia + 20h — coração do incidente 17/08`

---

### Task 5: nucleo/agenda.ts — hora cheia truncada (TDD)

**Files:**
- Create: `nucleo/src/agenda.ts`, `nucleo/src/agenda.test.ts`

**Interfaces:**
- Consumes: `ConfigNurture`, `AgendaEntrada` (Task 3).
- Produces:

```ts
export function agendaPadraoDe(config: ConfigNurture): AgendaEntrada[];
// deriva: um motor por hora — [dias todos, [hora do motor], motor] na ordem de prioridade
export function alvosDaHora(agenda: AgendaEntrada[], horaLocal: string, diaDaSemana: number): MotorId[];
// horaLocal = "HH" (duas posições, truncada de hora cheia: "09" alcança "09:30")
```

- [ ] **Step 1: Teste que falha** — casos: default `mail_mkt` às `10:30` é alcançado por tique `"10"`; motor fora da hora não aparece; dia fora de `dias` não aparece; `agenda:null` deriva de `horarios`; agenda explícita vence derivada.
- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run nucleo/src/agenda.test.ts` → FAIL.
- [ ] **Step 3: Implementar** — truncamento: `horaLocal` chega já truncada do relógio (`horaLocalHH()` devolve `"HH"`); matching de `horas` truncado igualmente (comparar prefixo de 2).
- [ ] **Step 4: Rodar e ver passar.**
- [ ] **Step 5: Commit** — `feat(nucleo): agenda com hora cheia truncada — tique :00 alcança default :30`

---

### Task 6: nucleo/outbox.ts — fila durável (TDD, puro — contrato sobre o adaptador)

**Files:**
- Create: `nucleo/src/outbox.ts`, `nucleo/src/outbox.test.ts`

**Interfaces:**
- Consumes: `FilaOutbox` (Task 2).
- Produces:

```ts
export const LEASE_MS = 5 * 60 * 1000;
export const DEAD_LETTER_MS = 23 * 60 * 60 * 1000;
export function prazoDeRetomada(agoraIso: string): string; // < 23h atrás
export async function enviarComOutbox(deps: { fila: FilaOutbox; enviador: EnviadorDeEmail; log: DependenciasDoNucleo["log"] }, e: EmailParaEnviar): Promise<{ resultado: "enviado" | "reagendado" | "sem_fila"; detalhe?: string }>;
// fluxo fiel: reservar → enviar → "entregue" ⇒ concluir; "falhaDefinitiva" ⇒ liberar (retry amanhã);
// "ambiguo" ⇒ NÃO concluir NEM liberar (fail-closed, preserva reserva); reservar falhou ⇒ sem_fila
```

- [ ] **Step 1: Teste que falha** — com fakes em-memória: entregue ⇒ concluir chamado; falhaDefinitiva ⇒ liberar chamado; ambíguo ⇒ nenhum dos dois; reservar=false ⇒ enviador nunca chamado.
- [ ] **Step 2: Rodar e ver falhar** → FAIL.
- [ ] **Step 3: Implementar** — máquina de estados acima, sem I/O próprio.
- [ ] **Step 4: Rodar e ver passar.**
- [ ] **Step 5: Commit** — `feat(nucleo): outbox durável — ambiguidade fail-closed, nunca reenviar`

---

### Task 7: nucleo/dispatcher.ts — orquestrador (TDD)

**Files:**
- Create: `nucleo/src/dispatcher.ts`, `nucleo/src/dispatcher.test.ts`

**Interfaces:**
- Consumes: `DependenciasDoNucleo`, `ConfigNurture`, `EstadoThrottle`, `MotorId` (Tasks 2-4).
- Produces:

```ts
export interface ResultadoDaRodada {
  motor: MotorId; candidatos: number; enviados: number;
  pulados: { email: string; motivo: string }[];
  falhas: { email: string; erro: string }[];
}
export type RunnerDeMotor = (deps: DependenciasDoNucleo, ctx: {
  config: ConfigNurture; throttle: EstadoThrottle; horarioAlvo: string;
  fusivel: { esgotado(): boolean; consumir(): boolean };
}) => Promise<ResultadoDaRodada>;
export interface OpcoesDoDispatcher { dry?: boolean; motor?: MotorId; prazoMs?: number; }
export const PRAZO_DE_LOOP_MS = 240_000; // < maxDuration 300s
export async function rodarDispatcher(deps, config: ConfigNurture, motores: Record<MotorId, RunnerDeMotor>, opts?: OpcoesDoDispatcher): Promise<{ resultados: ResultadoDaRodada[]; cortePorPrazo?: MotorId }>;
// fluxo: agenda → motoresDaHora (ordem de PRIORIDADE) → carregarEstadoThrottle UMA vez (após
// limparReservasOrfas chamado pelos runners) → por motor: runner com MESMO estado → fusível
// compartilhado (consumir por envio) → corte por prazo → alerta "motor 0 enviados + falhas"
```

- [ ] **Step 1: Teste que falha** — casos: ordem de prioridade respeitada mesmo com agenda em outra ordem; throttle compartilhado (1º motor envia, 2º motor do mesmo lead é pulado com motivo throttle); `opts.motor` filtra; fusível esgotado corta; `PRAZO_DE_LOOP_MS` = 240_000.
- [ ] **Step 2: Rodar e ver falhar** → FAIL.
- [ ] **Step 3: Implementar** — com fakes; fusível como objeto compartilhado `{ esgotado(): boolean; consumir(): boolean }`.
- [ ] **Step 4: Rodar e ver passar.**
- [ ] **Step 5: Commit** — `feat(nucleo): dispatcher com prioridade, fusível e prazo de loop`

---

### Task 8: adapters/memoria — demo sem serviços externos (TDD)

**Files:**
- Create: `adapters/src/memoria/repositorio.ts`, `adapters/src/memoria/fila.ts`, `adapters/src/memoria/enviador.ts`, `adapters/src/memoria/relogio.ts`, `adapters/src/memoria/fixtures.ts`, `adapters/src/memoria/index.test.ts`

**Interfaces:**
- Consumes: portas da Task 2, `ConfigNurture` (Task 3).
- Produces: `criarAdaptersMemoria(seed?: Partial<Seed>)` → `DependenciasDoNucleo` + `estadoInterno` inspecionável (filas, enviados, log de eventos) pra dashboard demo e testes; fixtures determinísticos (`leads.ts`, `campanhas.ts`, `regras.ts`) sem datas dinâmicas (fixadas em ISO constante `2026-08-18T...`).

- [ ] **Step 1: Teste que falha** — inserir seed → `repo.lerLeads` paginado devolve em ordem; `fila.reservar`/`concluir`; `enviador` registra em `enviados[]`; relógio fixo devolve `horaLocalHH()` de `America/Sao_Paulo`.
- [ ] **Step 2: Rodar e ver falhar** → FAIL.
- [ ] **Step 3: Implementar** — estruturas em-memória puras; paginação real (offset/limite, `temMais`).
- [ ] **Step 4: Rodar e ver passar.**
- [ ] **Step 5: Commit** — `feat(adapters): memória — demo roda sem serviços externos`

---

### Task 9: motores/mail-mkt/cadencia.ts — cadência real por campanha (TDD)

**Files:**
- Create: `motores/src/mail-mkt/cadencia.ts`, `motores/src/mail-mkt/cadencia.test.ts`

**Interfaces:**
- Consumes: `LeadNurture`, `Relogio` (Task 2).
- Produces:

```ts
export interface CampanhaDeMarketing {
  id: string; slug: string; name: string; offerName: string; offerUrl: string;
  objective: string; audience: string; status: "active" | "paused" | "completed";
  cadence: "hourly" | "daily" | "weekly";
  weekdays: number[]; timezone: string; startDate: string; endDate: string | null;
  nextSendOn: string | null; sendIndex: number; sentOccurrences: number; lastSentOn: string | null;
  pausedAt: string | null; throttleExempt: boolean | null; intervalDays: number;
  sendHour: string; audienceFilter: { segmentos?: string[]; fontes?: string[]; idadeMinimaDias?: number } | null;
}
export function estaAtivaNaHora(c: CampanhaDeMarketing, horaLocal: string, diaSemana: number): boolean;
export function ocorrenciaId(c: CampanhaDeMarketing, horaLocal: string): string;
// hourly ⇒ ISO da hora; daily/weekly ⇒ data local YYYY-MM-DD — nunca next_send_on (agenda não avança no dia)
export function candidatos(c: CampanhaDeMarketing, leads: LeadNurture[], agoraIso: string): LeadNurture[];
// audienceFilter: segmentos IN, fontes IN, idadeMinimaDias por createdAt
```

- [ ] **Step 1: Teste que falha** — casos: `sendHour "10:30"` ativo no tique `"10"` (truncado); `weekdays` filtra; `throttleExempt` não muda cadência (é só throttle); `ocorrenciaId` muda a cada hora em hourly e é estável no dia em daily; `candidatos` aplica os 3 filtros e lead sem `createdAt` é excluído quando `idadeMinimaDias` existe.
- [ ] **Step 2: Rodar e ver falhar** → FAIL.
- [ ] **Step 3: Implementar** — funções puras.
- [ ] **Step 4: Rodar e ver passar.**
- [ ] **Step 5: Commit** — `feat(motores): cadência real do mail mkt (send_hour, weekdays, audience_filter)`

---

### Task 10: motores/mail-mkt/sequencia.ts + copy — camada de conteúdo v1.1.1 (port + TDD)

**Files:**
- Create: `motores/src/mail-mkt/sequencia.ts`, `motores/src/mail-mkt/sequencia.test.ts`
- Modify: (conteúdo v1.1.1 de `SKILL.md`/`examples/` vira seed tipado em `sequencia.ts`)

**Interfaces:**
- Produces:

```ts
export interface PassoDeSequencia { dia: number; formato: "lesson" | "letter" | "echo"; funcao: string; }
export const SEQUENCIA_25_DIAS: readonly PassoDeSequencia[];
// os 10 passos reais: D+0 lesson, D+1 letter, D+3 lesson, D+5 echo, D+7 lesson,
// D+9 letter, D+12 echo, D+14 lesson, D+18 letter, D+25 echo
export const FORMATOS_PERMITIDOS: readonly string[];
export function passoDadoDiaDesdeCadastro(diasDesde: number): PassoDeSequencia | null;
```

- [ ] **Step 1: Teste que falha** — sequência tem 10 passos e o 1º é D+0 lesson; `passoDadoDiaDesdeCadastro(25)` → echo final; dia sem passo (ex: 2) → null; nenhum passo com dia negativo.
- [ ] **Step 2: Rodar e ver falhar** → FAIL.
- [ ] **Step 3: Implementar** — port da tabela da sequência do SKILL.md v1.1.1 como dados tipados; seed de copy (subjects, letters) como objeto `COPY_SEED` (ex.: campanha exemplo b2b-ai-training de `examples/`) com comentário de origem.
- [ ] **Step 4: Rodar e ver passar.**
- [ ] **Step 5: Commit** — `feat(motores): sequência de 25 dias portada como camada de conteúdo`

---

### Task 11: integracoes/tracklink — todo CTA rastreado (TDD)

**Files:**
- Create: `integracoes/src/tracklink/contrato.ts`, `integracoes/src/tracklink/montar-url.ts`, `integracoes/src/tracklink/montar-url.test.ts`

**Interfaces:**
- Consumes: `EmailParaEnviar` (Task 2).
- Produces:

```ts
export interface IntegracaoDeTracking {
  obterOuCriarLink(opts: { campanhaSlug: string; campanhaNome: string; destino: string; motor?: string }):
    Promise<string>; // nunca lança: falha ⇒ devolve destino cru + log
  registrarAbertura(trackingId: string): Promise<void>;
  registrarClique(trackingId: string, url: string): Promise<void>;
}
export const SLUG_PREFIX = "mailmkt-";
export const UTM_SOURCE = "mailmkt";
export const UTM_MEDIUM = "email";
export function montarSlug(slugDaCampanha: string): string; // normaliza, prefixa, max 80, sem "-" final
export function montarUtmCampaign(slugDaCampanha: string): string; // "mailmkt_<slug>", max 120
export function montarUrlComUtms(destino: string, u: { source: string; medium: string; campaign: string }): string;
// nunca lança com destino inválido — devolve o destino cru
export function embrulharLinksDoHtml(html: string, mapeamento: (url: string) => string): string;
// TODOS os hrefs de <a> passam pelo mapeamento; exceções documentadas por URL literal:
// unsubscribe (contém "/unsubscribe") e âncora de e-mail (mailto:) ficam intactos
```

- [ ] **Step 1: Teste que falha** — casos: slug `"Marketing 4.0 · Lançamento"` → `mailmkt-marketing-40-lancamento`; utm_campaign prefixado; `montarUrlComUtms` preserva query existente; destino inválido devolve cru sem lançar; `embrulharLinksDoHtml` troca TODOS os `<a href>` menos unsubscribe/mailto; href com aspas duplas e entidades HTML escapadas.
- [ ] **Step 2: Rodar e ver falhar** → FAIL.
- [ ] **Step 3: Implementar** — funções puras; regex de `<a href="...">` com função de escape.
- [ ] **Step 4: Rodar e ver passar.**
- [ ] **Step 5: Commit** — `feat(integracoes): tracklink — todo CTA com slug mailmkt- + UTMs + eventos`

---

### Task 12: integracoes/lp — contrato de intake (TDD)

**Files:**
- Create: `integracoes/src/lp/contrato.ts`, `integracoes/src/lp/contrato.test.ts`

**Interfaces:**
- Consumes: `LeadNurture` (Task 2).
- Produces:

```ts
export interface ContratoDeIntake {
  registrarLead(input: {
    nome: string; whatsapp?: string; email?: string | null;
    origem: string; pagina?: string; interesse?: string;
    utms?: { source?: string; medium?: string; campaign?: string; content?: string; term?: string };
  }): Promise<{ ok: true; leadId: string } | { ok: false; erro: string }>;
}
export function normalizarEmail(e: string): string; // trim + lowercase
export function normalizarLead(input: unknown): { nome: string; whatsapp?: string; email?: string | null; origem: string };
// nunca lança; campos inválidos caem fora
```

- [ ] **Step 1: Teste que falha** — email `"  Joao@X.com "` → `"joao@x.com"`; input com campo estranho é ignorado; origem ausente → `{ok:false}`; utms opcionais propagam.
- [ ] **Step 2: Rodar e ver falhar** → FAIL.
- [ ] **Step 3: Implementar** — funções puras.
- [ ] **Step 4: Rodar e ver passar.**
- [ ] **Step 5: Commit** — `feat(integracoes): lp — contrato de intake de leads`

---

### Task 13: motores/mail-mkt/runner.ts — integração ponta a ponta (TDD)

**Files:**
- Create: `motores/src/mail-mkt/runner.ts`, `motores/src/mail-mkt/runner.test.ts`

**Interfaces:**
- Consumes: Tasks 2, 3, 4, 9, 10, 11 + `enviarComOutbox` (Task 6) + `renderEmail` local.
- Produces:

```ts
export function criarRunnerMailMkt(opts: {
  lerCampanhasAtivas(): Promise<CampanhaDeMarketing[]>;
  lerConteudo(emailType: string): Promise<ConteudoDeEmail | null>; // banco → seed → null
  tracking: IntegracaoDeTracking;
  siteUrl: string;
}): RunnerDeMotor;
// fluxo fiel ao real: campanhas ativas da hora → por campanha: candidatos →
// ctaUrl via tracking.obterOuCriarLink (UM por ocorrência, nunca por lead) →
// por lead: throttle (respeitando throttleExempt) → reserva no log (duplicado ⇒ pula) →
// embrulhar links → renderEmail → outbox → aplicarEnvio
// sucessos conta SÓ entregas reais (nunca tentativas)
```

- [ ] **Step 1: Teste que falha** — com adapters memória + fakes: e2e feliz (2 leads, 1 campanha, 2 enviados, 2 reservas); 2º lead do mesmo dia bloqueado por throttle compartilhado (motivo `throttle:*`); `throttleExempt` pula o throttle; tracking link chamado 1× por ocorrência (não por lead); falha do tracking ⇒ URL crua mas envio segue; reserva duplicada ⇒ pulado com `reserva_conflito`; falha definitiva do enviador ⇒ liberar + contar em falhas; ambíguo ⇒ nem concluir nem liberar.
- [ ] **Step 2: Rodar e ver falhar** → FAIL.
- [ ] **Step 3: Implementar** — com `renderEmail` local (template mínimo fiel: headline, body, CTA, footer com unsubscribe).
- [ ] **Step 4: Rodar e ver passar.**
- [ ] **Step 5: Commit** — `feat(motores): runner mail mkt ponta a ponta — tracking por ocorrência, throttle, outbox`

---

### Task 14: nucleo/piso.ts — gate de copy (TDD)

**Files:**
- Create: `nucleo/src/piso.ts`, `nucleo/src/piso.test.ts`

**Interfaces:**
- Consumes: nada (puro).
- Produces:

```ts
export const TERMOS_BANIDOS: readonly string[]; // port da lista real (termos sensacionalistas de spam)
export function avaliarCopy(copy: { subject: string; corpo: string }): { aprovado: boolean; achados: string[] };
// determinístico: reprova se algum termo banido (case-insensitive, palavra inteira) ou subject vazio
```

- [ ] **Step 1: Teste que falha** — subject vazio reprova; termo banido no corpo reprova com achado nomeado; variação de caixa também; copy limpa aprova.
- [ ] **Step 2: Rodar e ver falhar** → FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar e ver passar.**
- [ ] **Step 5: Commit** — `feat(nucleo): piso de copy — gate determinístico no salvar E no enviar`

---

### Task 15: adapters/supabase — fiéis ao real (implementação + teste de contrato)

**Files:**
- Create: `adapters/src/supabase/repositorio.ts`, `adapters/src/supabase/fila.ts`, `adapters/src/supabase/schema.sql`
- Modify: `adapters/package.json` (dep opcional `@supabase/supabase-js`)

**Interfaces:**
- Consumes: portas (Task 2).
- Produces: `criarAdapterSupabase(client: SupabaseClient): { repo: RepositorioDeNurture; fila: FilaOutbox }` — `lerLeads` paginado via `range(offset, offset+limite-1)` (nunca `.select()` cru); `reservarNoLog` trata 23505 como `"duplicado"`; fila via RPCs `reserve_nurture_email_outbox`/`complete_nurture_email_outbox`/`release_nurture_email_outbox`.

- [ ] **Step 1: `schema.sql`** — DDL fiel das tabelas (sem as CHECKs específicas de cfgauss.com.br: `offer_url` valida por coluna de config `ALLOWED_DOMAINS` documentada no README): `nurture_leads`, `nurture_email_log` (UNIQUE to_email+email_type), `nurture_suppressions`, `nurture_marketing_campaigns`, `nurture_email_outbox` (idempotency_key PK), `nurture_email_events`, `nurture_config` (singleton), `tracking_links`.
- [ ] **Step 2: Teste de contrato** — com mock do client (sem rede): paginação monta `range` correto; 23505 vira `duplicado`; RPC mapeia argumentos.
- [ ] **Step 3: Rodar e ver passar.**
- [ ] **Step 4: Commit** — `feat(adapters): supabase fiel — paginação, dedupe, RPCs do outbox`

---

### Task 16: adapters/resend — único caminho de saída (implementação + teste de contrato)

**Files:**
- Create: `adapters/src/resend/enviador.ts`, `adapters/src/resend/enviador.test.ts`
- Modify: `adapters/package.json` (dep opcional `resend`)

**Interfaces:**
- Consumes: `EnviadorDeEmail` (Task 2).
- Produces: `criarEnviadorResend(opts: { apiKey: string; from: string; replyTo?: string; siteUrl: string; tokenDeDescadastro: (email: string) => string }): EnviadorDeEmail` — headers `List-Unsubscribe` (mailto+https) e `List-Unsubscribe-Post: List-Unsubscribe=One-Click` em TODA mensagem; mapeia erro: 4xx definitivo ⇒ `falhaDefinitiva`; timeout/5xx/limite ⇒ `ambiguo`.

- [ ] **Step 1: Teste de contrato** — mock do SDK: payload inclui headers; erro 400 → falhaDefinitiva; erro 429/500/timeout → ambiguo; sucesso → entregue.
- [ ] **Step 2: Rodar e ver passar.**
- [ ] **Step 3: Commit** — `feat(adapters): resend fiel — List-Unsubscribe obrigatório, mapeamento de erros`

---

### Task 17: dashboard/ — scaffold + hub (dashboard-kit)

**Files:**
- Create: `dashboard/` (create-next-app TS+Tailwind, shadcn via CLI), `dashboard/src/components/hub/*`, `dashboard/src/data/contratos.ts`

**Interfaces:**
- Consumes: `DependenciasDoNucleo` via adapters memória (fixtures da Task 8).
- Produces: rota `/` = hub com blocos por motor; `contratos.ts` documenta cada query do Supabase real (SQL exato) ao lado do consumo mock.

- [ ] **Step 1: Scaffold** — `npx create-next-app@latest dashboard --ts --tailwind --app --no-src-dir --import-alias "@/*"` + `npx shadcn@latest init` + add `card`, `table`, `badge`, `tabs`, `dialog`, `select`, `calendar`.
- [ ] **Step 2: Ler a skill dashboard-kit e aplicar a direção visual (KPI tiles, estados de loading/vazio/erro, sem cara de template de IA).**
- [ ] **Step 3: Implementar hub** — blocos: "Última rodada" (por motor, leitura que falha é `null`, nunca 0), "Fusível" (consumo vs limite), "Agenda de hoje", "Alertas" (motor 0 enviados + falhas; campanha 0; dead-letter).
- [ ] **Step 4: Verificar** — `cd dashboard && npm run build` sem erro; abrir `npm run dev` e conferir visualmente.
- [ ] **Step 5: Commit** — `feat(dashboard): scaffold + hub com blocos por motor`

---

### Task 18: dashboard/ — calendário, regras, agenda, campanhas, copy

**Files:**
- Create: `dashboard/src/components/calendario/*`, `.../regras/*`, `.../agenda/*`, `.../campanhas/*`, `.../copy/*`

**Interfaces:**
- Consumes: contratos do hub (Task 17); fixtures (Task 8).

- [ ] **Step 1: Calendário de 14 dias** — grid dia×hora com colisão marcada (dois motores no mesmo horário) ANTES de acontecer; dados do fixture.
- [ ] **Step 2: Regras globais** — formulário de `ConfigNurture` (throttle, horários, blackout, fusível) com validação por campo idêntica à de `mesclarConfig` (reusa as funções puras) — edição mock que loga.
- [ ] **Step 3: Agenda** — grade semanal dos 5 motores; toggle de dias permitidos.
- [ ] **Step 4: Campanhas** — lista (active/paused/completed), criar (form com os campos da Task 9), arquivar (= status completed, nunca apagar — botão confirma em texto o que faz).
- [ ] **Step 5: Editor de copy** — textarea + avaliação do piso em tempo real (chama `avaliarCopy`); botão salvar desabilitado com copy reprovada (gate no salvar E no enviar).
- [ ] **Step 6: Verificar** — build sem erro + inspeção visual; estados vazio/erro em cada tela.
- [ ] **Step 7: Commit** — `feat(dashboard): calendário 14d, regras, agenda, campanhas e editor de copy`

---

### Task 19: scripts + SKILL.md + README + product site

**Files:**
- Modify: `scripts/validate.mjs` (estender pra validar campanha de marketing: campos da Task 9 + piso da copy), `SKILL.md` (orquestradora do ciclo de 5 estágios), `README.md` (quick-start novo), `docs/index.html` (product site atualizado com cockpit + dashboard).

**Interfaces:**
- Consumes: schema da Task 9/14.

- [ ] **Step 1: Estender `scripts/validate.mjs`** — valida `campaign.json` (campos obrigatórios, tipos, weekdays, send_hour formato, offer_url https) + `avaliarCopy` portado em JS puro no script (determinístico, sem dep).
- [ ] **Step 2: Testar o validator** — rodar contra `examples/b2b-ai-training/` e contra 1 fixture inválido (Expected: falha com mensagem de achado).
- [ ] **Step 3: SKILL.md** — orquestra: 1) intake (LP) 2) briefing de campanha 3) copy+validação 4) envio (núcleo+adapters) 5) saúde (dashboard/contratos). Referencia `nucleo/`, `motores/`, `integracoes/` como fonte de verdade dos contratos. Incluir em `docs/` a **rota de referência single-entry**: um route handler Next.js que chama `rodarDispatcher` — UM cron na produção, nunca rotas por motor (fidelidade do "1 cron só").
- [ ] **Step 4: README + product site** — quick-start em 3 comandos (clone → `npm install` → `npm test`; demo: `cd dashboard && npm run dev`); seção "How it maps to the CF Gauss reference" com tabela repo↔produção.
- [ ] **Step 5: Commit** — `docs: SKILL.md orquestradora, README quick-start, validator de campanha`

---

### Task 20: Revisão final, tag v2.0.0, release

**Files:**
- Modify: `CHANGELOG.md` (data), docs se necessário.

- [ ] **Step 1: Suíte completa** — `npm test` na raiz (todos os workspaces) → zero falhas.
- [ ] **Step 2: Whole-branch review (1 rodada opus)** — diff do branch v2.0.0 vs main; corrigir achados; **máximo 2 rodadas** (regra de cota).
- [ ] **Step 3: `npm run build` no dashboard + `npx tsc --noEmit` em cada workspace.**
- [ ] **Step 4: Merge na main + tag `v2.0.0` + GitHub Release** (só após aprovação do dono — deploy/publicação é pedido explícito).
- [ ] **Step 5: Atualizar CLAUDE.md (tabela de registros) e memória com o estado final.**
