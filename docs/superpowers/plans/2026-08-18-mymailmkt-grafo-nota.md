# Nota do grafo — CF Gauss com corpus nurture (Fase 0, 18/08/2026)

Rebuild do grafo graphify a partir de checkout isolado de `origin/main` (`a4418622`).
**331 → 903 nós · 672 → 1948 edges · 20 → 64 comunidades.** 313 nós de
`lib/nurture` + cron nurture + `components/admin/Cockpit`.

## Top hotspots do motor de e-mail (grau no grafo)

| Grau | Arquivo | Papel |
|-----:|---------|-------|
| 57 | `lib/nurture/cockpit/queries.ts` | Hub de leitura da dashboard — consome todo o motor |
| 46 | `lib/nurture/lancamento/campanha.ts` | Runner do lançamento |
| 45 | `lib/nurture/marketing/runner.ts` | Runner do mail mkt (o coração do port) |
| 36 | `lib/nurture/dispatcher.ts` | Orquestrador único |
| 36 | `lib/nurture/envio.ts` | Esteira/drip |
| 33 | `components/admin/Cockpit/DetalheCampanha.tsx` | Tela de detalhe da campanha |
| 32 | `lib/nurture/digest.ts` | Digest semanal |
| 32 | `components/admin/Cockpit/GradeSemanal.tsx` | Grade semanal da dashboard |
| 30 | `lib/nurture/cockpit/actions.ts` | Ações da dashboard |
| 25 | `lib/nurture/config-core.ts` | Defaults de config |

## Implicações para o port v2.0.0

1. **`marketing/runner.ts` como centro** — valida o foco do port no mail mkt; o runner
   concentra cadência + throttle + tracking + outbox.
2. **Dashboard é o maior consumidor** — `cockpit/queries.ts` (57) confirma a decisão da
   onda 3: demo com contratos de query explícitos, porque é exatamente essa camada que
   acopla a UI ao motor.
3. **Disparo de acoplamento para os plugs** — o runner toca tracking-links
   (`obterOuCriarTrackingLinkMailMkt`) e outbox; o port mantém essas bordas como
   portas (`IntegracaoDeTracking`, `FilaOutbox`), fiéis ao real.

## Comandos usados

```bash
# checkout isolado (working copy local do cfgauss-site está 20+ commits atrás;
# git clone de path local copia refs/heads, NÃO refs/remotes — clonar do GitHub)
git clone --no-checkout https://github.com/luisroquette/cfgauss-site.git /tmp/cfgauss-main-v2
git -C /tmp/cfgauss-main-v2 checkout origin/main
# _build.py: REPO → /tmp/cfgauss-main-v2 (temporário) + 3 COMPONENTS novos
/Users/luisroquette/.local/share/uv/tools/graphifyy/bin/python3 _build.py
/Users/luisroquette/.local/share/uv/tools/graphifyy/bin/python3 _label.py
```
