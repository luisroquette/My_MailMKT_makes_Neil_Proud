"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Kpi } from "@/components/kpi";
import { BlocoMotor } from "@/components/bloco-motor";
import { PainelDeAlertas } from "@/components/alertas";
import { formatarDataHora } from "@/data/formatos";
import {
  ALERTAS,
  BLOCOS_DOS_MOTORES,
  RESUMO_DO_DIA,
  AGORA_FIXA,
} from "@/data/fixtures";

type EstadoDemo = "ok" | "vazio" | "erro";

export default function Hub() {
  const [estado, setEstado] = useState<EstadoDemo>("ok");
  const [carregando, setCarregando] = useState(true);

  // Simulated fetch — deterministic 600ms, like the real cockpit queries.
  useEffect(() => {
    setCarregando(true);
    const t = setTimeout(() => setCarregando(false), 600);
    return () => clearTimeout(t);
  }, [estado]);

  const semDados = estado === "vazio" || estado === "erro" || carregando;

  return (
    <div className="max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            O que precisa de mim hoje
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Última rodada do dispatcher: {formatarDataHora(AGORA_FIXA)} · America/Sao_Paulo
          </p>
        </div>
        <Tabs value={estado} onValueChange={(v) => setEstado(v as EstadoDemo)}>
          <TabsList>
            <TabsTrigger value="ok">Dados</TabsTrigger>
            <TabsTrigger value="vazio">Vazio</TabsTrigger>
            <TabsTrigger value="erro">Erro</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {estado === "erro" ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <p className="text-sm font-medium text-destructive">
              Não foi possível ler a última rodada.
            </p>
            <p className="text-sm text-muted-foreground">
              Leitura que falha é null — a dashboard degrada, o envio não.
            </p>
            <Button variant="outline" onClick={() => setEstado("ok")}>
              Tentar de novo
            </Button>
          </CardContent>
        </Card>
      ) : estado === "vazio" ? (
        <Card>
          <CardContent className="p-8 text-center space-y-2">
            <p className="text-sm font-medium">Nenhuma rodada registrada ainda.</p>
            <p className="text-sm text-muted-foreground">
              O próximo tique do cron é às 11:00 (America/Sao_Paulo).
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi
              dados={
                semDados
                  ? null
                  : { rotulo: "Enviados hoje", valor: String(RESUMO_DO_DIA.enviadosHoje) }
              }
            />
            <Kpi
              dados={
                semDados
                  ? null
                  : {
                      rotulo: "Aberturas hoje",
                      valor: String(RESUMO_DO_DIA.aberturasHoje),
                      delta: "vs ontem",
                      deltaDirecao: "up",
                    }
              }
            />
            <Kpi
              dados={
                semDados
                  ? null
                  : { rotulo: "Leads ativos", valor: String(RESUMO_DO_DIA.leadsAtivos) }
              }
            />
            <Kpi
              dados={
                semDados
                  ? null
                  : {
                      rotulo: "Fusível",
                      valor: `${RESUMO_DO_DIA.fusivel.usado}/${RESUMO_DO_DIA.fusivel.limite}`,
                    }
              }
            />
          </section>

          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">
              Motores da rodada
            </h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {BLOCOS_DOS_MOTORES.map((b) => (
                <BlocoMotor key={b.motor} bloco={carregando ? null : b} />
              ))}
            </div>
          </section>

          <section className="max-w-md">
            <PainelDeAlertas alertas={carregando ? null : ALERTAS} />
          </section>
        </>
      )}
    </div>
  );
}
