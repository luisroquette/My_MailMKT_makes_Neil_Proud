"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CAMPANHAS_DEMO, type CampanhaDemo } from "@/data/fixtures";

const STATUS: Record<CampanhaDemo["status"], string> = {
  active: "Ativa",
  paused: "Pausada",
  completed: "Arquivada",
};

export default function Campanhas() {
  const [campanhas, setCampanhas] = useState(CAMPANHAS_DEMO);

  // Archive = status 'completed' — NEVER delete (fidelity).
  function arquivar(id: string) {
    setCampanhas((cs) =>
      cs.map((c) => (c.id === id ? { ...c, status: "completed" as const } : c)),
    );
  }

  return (
    <div className="max-w-4xl space-y-4">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Campanhas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Arquivar vira status completed — o histórico nunca é apagado.
          </p>
        </div>
        <Dialog>
          <DialogTrigger className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Nova campanha
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova campanha</DialogTitle>
              <DialogDescription>
                Demo — na produção este formulário grava nurture_marketing_campaigns
                com cadência, público e copy editáveis por tela.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <label className="block">
                <span className="text-muted-foreground">Nome</span>
                <input
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5"
                  placeholder="Marketing 4.0"
                />
              </label>
              <label className="block">
                <span className="text-muted-foreground">URL da oferta (https)</span>
                <input
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 font-mono text-xs"
                  placeholder="https://exemplo.com.br/workshop"
                />
              </label>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="space-y-3">
        {campanhas.map((c) => (
          <Card key={c.id}>
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm font-semibold">{c.name}</CardTitle>
                <Badge
                  variant={
                    c.status === "active"
                      ? "default"
                      : c.status === "paused"
                        ? "outline"
                        : "secondary"
                  }
                  className="text-[10px]"
                >
                  {STATUS[c.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Cadência</dt>
                  <dd className="tabular-nums">{c.cadence} · {c.sendHour}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Enviados</dt>
                  <dd className="tabular-nums">{c.sentOccurrences}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Público</dt>
                  <dd>
                    {c.audienceFilter
                      ? `${c.audienceFilter.segmentos.join(", ")} · ${c.audienceFilter.fontes.join(", ")}`
                      : "todos"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Throttle</dt>
                  <dd>{c.throttleExempt ? "isento" : "padrão (1/dia)"}</dd>
                </div>
              </dl>
              {c.status !== "completed" ? (
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => arquivar(c.id)}>
                    Arquivar
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
