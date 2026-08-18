"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MotorId } from "@/data/fixtures";

const MOTORES: { id: MotorId; nome: string; horario: string }[] = [
  { id: "mail_mkt", nome: "Mail MKT", horario: "10:30" },
  { id: "lancamento", nome: "Lançamento", horario: "09:30" },
  { id: "esteira", nome: "Esteira (drip)", horario: "10:00" },
  { id: "digest", nome: "Digest", horario: "11:00" },
  { id: "video_digest", nome: "Vídeo digest", horario: "20:45" },
];

const DIAS = [
  { n: 0, rotulo: "Dom" },
  { n: 1, rotulo: "Seg" },
  { n: 2, rotulo: "Ter" },
  { n: 3, rotulo: "Qua" },
  { n: 4, rotulo: "Qui" },
  { n: 5, rotulo: "Sex" },
  { n: 6, rotulo: "Sáb" },
];

export default function Agenda() {
  const [ativos, setAtivos] = useState<Record<number, boolean>>(
    Object.fromEntries(DIAS.map((d) => [d.n, true])),
  );

  return (
    <div className="max-w-5xl space-y-4">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Agenda semanal</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Dias permitidos por padrão — na produção, isto vive em nurture_config e é
          editado pela tela, nunca por deploy.
        </p>
      </header>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold">Dias permitidos</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <div className="flex flex-wrap gap-2">
            {DIAS.map((d) => (
              <button
                key={d.n}
                onClick={() => setAtivos((a) => ({ ...a, [d.n]: !a[d.n] }))}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  ativos[d.n]
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground"
                }`}
                aria-pressed={ativos[d.n]}
              >
                {d.rotulo}
              </button>
            ))}
          </div>

          <ul className="space-y-2">
            {MOTORES.map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{m.nome}</span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {m.horario}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {DIAS.filter((d) => ativos[d.n]).length} dias/semana
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
