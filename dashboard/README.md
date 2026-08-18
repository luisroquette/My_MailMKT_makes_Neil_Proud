# Dashboard demo — Mail MKT cockpit

Demo standalone (Next.js + shadcn) do cockpit do motor de e-mail. Dados são
fixtures determinísticos (`data/fixtures.ts`) — nunca datas dinâmicas, nunca
serviços externos. Os contratos de query da produção estão em
`data/contratos.ts`, tela a tela.

## Rodar

```bash
npm install
npm run dev
```

## O que a demo demonstra

- **Hub** (`/`) — KPIs, bloco por motor, alertas. É a única tela que demonstra
  os 3 estados de dados (carregando/vazio/erro) — o seletor "Dados/Vazio/Erro"
  no topo existe de propósito para isso; as outras telas são formulários/leitura
  estática da demo.
- **Calendário** (`/calendario`) — 14 dias com colisões de tique de hora cheia.
- **Regras** (`/regras`) — superfície editável do nurture_config com a mesma
  validação do `mesclarConfig` (inválido cai no default).
- **Agenda** (`/agenda`) — dias permitidos por motor.
- **Campanhas** (`/campanhas`) — criar/arquivar; arquivar = `completed`, nunca apagar.
- **Editor de copy** (`/copy`) — gate do piso rodando em tempo real.

## Fidelidade

Leitura que falha é `null`, nunca `0`. Fusível, throttle e prioridades espelham
os defaults do núcleo (`nucleo/src/config.ts`). Tudo em PT-BR.
