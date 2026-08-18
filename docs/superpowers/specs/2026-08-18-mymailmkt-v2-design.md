# Spec — My_MailMKT v2.0.0 (design aprovado)

Data: 2026-08-18 · Autor: Luis (dono) + Claude · Status: APROVADO em ondas socráticas (7 decisões)

## 1. Contexto

O repo `My_MailMKT_makes_Neil_Proud` (v1.1.1, 08/08/2026) é a camada de **conteúdo**
do e-mail marketing da CF Gauss: sequência de 25 dias, validator determinístico,
compliance guards, guia de implementação e product site. O que ele **não** mostra é
o que está no ar na CF Gauss desde 17-18/08/2026: o cockpit completo — throttle
compartilhado, cron único, regras no banco, outbox durável e dashboard.

Esta spec exporta a versão otimizada (nível do que hoje roda em produção) para o
repo público, com plugs ativos no ecossistema de marketing (tracklink + LP),
fechando o wrapper omnichannel iniciado por [[My_UTMs_Make_Me_Proud]] e
[[My_LP_Makes_Neil_Proud]].

## 2. Decisões do dono (ondas socráticas)

| # | Decisão | Resposta |
|---|---------|----------|
| 1 | Escopo | Cockpit **completo** + plugs ativos no ecossistema (opção mais completa) |
| 2 | Plug | **Rastreamento end-to-end**: todo CTA sai com tracking link (UTM + evento); LP alimenta o nurture |
| 3 | Dashboard | **Demo rodável** (Next.js + shadcn, skill dashboard-kit) + contratos de dados documentados |
| 4 | Estrutura | **Espelho do tracklink**: `nucleo/` + `motores/` + `integracoes/` + `dashboard/` + `SKILL.md` |
| 5 | Versão | **v2.0.0 única** com tag + GitHub Release |
| 6 | Grafo | **Rebuild do grafo CF Gauss antes do port** (corpus novo: nurture + cron + Cockpit) |
| 7 | Forma do núcleo | **Porta/adaptador**: TypeScript executável com contratos + adapters (Supabase/Resend fiéis + memória pra demo) |

## 3. Arquitetura

```
nucleo/            # canal-agnóstico — o aprendizado do incidente 17/08
  throttle.ts      # 1 e-mail/lead/dia + 20h; estado ÚNICO compartilhado por rodada
  dispatcher.ts    # alvosDaHora, ordem de prioridade, fusível, loop 240s < 300s
  outbox.ts        # reserve/claim/complete/release + lease 5min + dead-letter >23h
  config.ts        # CONFIG_PADRAO + mesclarConfig (config ausente = default atual, loga)
  regras.ts        # fusível, blackout, dias permitidos, fuso America/Sao_Paulo
  agenda.ts        # entradas por dia/hora; hora cheia truncada DE PROPÓSITO (tique :00 alcança default :30)
  contratos.ts     # portas: RepositorioDeLeads, EnviadorDeEmail, Relogio, Eventos
motores/           # os 5 motores; mail_mkt portado por completo, demais com contrato+spec
  mail-mkt/        # runner + cadência real (send_hour, interval_days, weekdays,
                   #   audience_filter, throttle_exempt) + sequência 25 dias + copy
                   #   (conteúdo v1.1.1 — sequência, validator, compliance — vira camada dele)
  esteira/ digest/ lancamento/ video-digest/   # contrato + spec fiel; port em fases posteriores
integracoes/       # plugs ATIVOS (decisão da onda 2)
  tracklink/       # todo CTA sai com tracking link UTM; abertura = pixel; clique = evento no lead
  lp/              # contrato de intake: lead da LP entra no nurture
adapters/
  supabase/        # fiel: RPCs do outbox, lerTudo paginado (nunca truncar 1000), jsonb
  resend/          # único caminho de saída; List-Unsubscribe RFC 8058 + unsubscribe 1 clique
  memoria/         # adapters em-memória: demo roda sem nada externo (fixtures determinísticos)
dashboard/         # demo standalone Next.js + shadcn (skill dashboard-kit), dados da memória
scripts/           # validar-campanha determinístico (evolução do validate.mjs) + init/install
docs/              # spec fiel, guia de implementação, product site atualizado
SKILL.md           # orquestra o ciclo: conteúdo → validação → envio → saúde → dashboard
```

## 4. Contratos do núcleo (portas)

- **RepositorioDeLeads**: leitura paginada (nunca `.select()` cru — PostgREST trunca em 1000
  silenciosamente), supressões, log de envio (janela 24–168h conforme `minHorasEntreEnvios`).
- **EnviadorDeEmail**: `send({to, subject, html, emailType, trackingId, idempotencyKey})`.
- **Relogio**: sempre `America/Sao_Paulo`; nunca `Date#getHours()` (runtime UTC na Vercel).
- **FilaOutbox**: 4 operações atômicas + retry <23h + dead-letter com alerta.
- **Eventos**: abertura / clique / conversão → consumidos pela integração tracklink.

## 5. Fluxo de dados (fiel ao real)

Lead (LP → nurture) → tick do cron → `alvosDaHora()` (agenda do banco) → motores em
prioridade (`mail_mkt > lancamento > esteira > digest > video_digest`) com **um** throttle
→ por lead: supressão? próximoPasso? `podeReceber()`? → copy (banco → fallback repo) →
reserva unique no log (23505 = já enviado, pula) → outbox reserve → Resend → complete →
`aplicarEnvio()`. Falha definitiva: release (retry amanhã). Resultado ambíguo:
**fail-closed**, nunca reenviar.

## 6. Erros e garantias (fidelidade crítica)

- Idempotência determinística: chave por lead/passo/ocorrência/ISO; trackingId = hash da chave
- Dedupe: `UNIQUE(email, emailType)`; `DRIP_EPOCH` protege leads antigos de rajada
- Fusível 100/execução + `PRAZO_DE_LOOP` 240s antes do maxDuration 300s
- Alertas separados: motor 0 enviados + falhas; campanha 0 enviados; dead-letter
- LGPD: List-Unsubscribe (mailto+https) + one-click em **toda** mensagem, sem exceção
- Anti-fabricação: gate de copy determinístico roda no **salvar E no enviar**
- Analytics nunca derruba entrega: falha de tracking degrada pra URL crua logando alto

## 7. Plug tracklink (achado de fidelidade da auditoria de hoje)

**Fato medido em `origin/main` do cfgauss-site (18/08):**

- O **mail mkt já passa obrigatoriamente pelo tracking-links system**:
  `lib/nurture/marketing/runner.ts` chama `obterOuCriarTrackingLinkMailMkt`
  (`lib/tracking-links/mailmkt.ts`) — um tracking_link por ocorrência, idempotente por
  slug `mailmkt-<slug>`, `utm_source=mailmkt`, `utm_medium=email`,
  `utm_campaign=mailmkt_<slug>`. Regra inviolável comentada no código: todo CTA do
  mail-mkt passa por ali antes do e-mail.
- **Os outros 3 motores de conteúdo NÃO passam pelo tracking-links system**:
  esteira (`envio.ts`), digest (`digest.ts` — usa `?utm_source=email&utm_medium=digest`
  inline) e lançamento (`campanha.ts`) embrulham o CTA só com `linkRastreado`
  (camada de pixel/clique do nurture), sem shortlink `/t/` nem UTM do tracklink.
- Resumo: o padrão de hoje é **parcial** — mail mkt sim, esteira/digest/lançamento não.

**Consequência para esta spec:**

- A integração `integracoes/tracklink/` do My_MailMKT define o contrato **para os 5
  motores**: todo CTA de qualquer motor sai com tracking link de slug prefixado
  (`mailmkt-<motor>-<slug>`), UTM padronizado e evento de clique no lead.
- O retrofit dos 3 motores restantes **no cfgauss-site** é sessão separada (prompt
  entregue ao dono em 18/08). A auditoria de "todos os links de divulgação" (rodada 2,
  além do e-mail) também é sessão separada.

## 8. Dashboard demo (contratos)

Telas portadas do Cockpit: hub (blocos por motor — leitura que falha é `null`, nunca 0),
calendário 14 dias (colisão prevista antes de acontecer), regras globais, agenda,
campanhas (criar/arquivar = `status=completed`, nunca apagar), detalhe da sequência,
editor de copy com gate de piso. Dados dos adapters memória; cada contrato de query
documentado para ligar no Supabase real.

## 9. Testes (padrão do dono)

- Guards de regressão: cron único (falha se rota antiga voltar), throttle compartilhado
  entre motores, dedupe UNIQUE, todo CTA passa pelo tracklink
- Núcleo testado com adapters memória — determinístico, zero rede
- Validator determinístico de campanha (evolução do `validate.mjs` v1.1.1)
- Suíte verde obrigatória antes do release v2.0.0

## 10. Fases (plano detalhado no writing-plans)

0. Rebuild do grafo CF Gauss com corpus novo — a partir de **checkout isolado de
   `origin/main`** (worktree/clone descartável), nunca mexendo na working copy
   compartilhada do cfgauss-site; `COMPONENTS` em `_build.py` + build/label
1. Estrutura v2 + SemVer/CHANGELOG
2. `nucleo/` porta/adaptador + adapters memória (com testes)
3. Adapters Supabase/Resend fiéis
4. Motor mail_mkt completo + plugs tracklink/LP
5. Dashboard demo (dashboard-kit)
6. Scripts, SKILL.md, docs/product site
7. Revisão final, tag v2.0.0 + GitHub Release

## 11. Defaults assumidos (ajustáveis)

- Idioma do repo segue **inglês** (como os dois irmãos públicos)
- Copy legada `marketing-4-0-2026` vira fixture/example, não código
- Trello e checkout viram contratos de evento fora do port
- Sufixo identificável dos tracking links do mail mkt: `mailmkt-` (o padrão real de
  hoje), não `MAILMKT_`
