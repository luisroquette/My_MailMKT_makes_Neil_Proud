"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COPY_DEMO, TERMOS_BANIDOS_DEMO } from "@/data/fixtures";

/**
 * Copy editor — the floor gate (nucleo/piso.ts port) runs on SAVE and on
 * SEND. A rejected line falls back to the repo seed and logs; it never
 * ships. The demo reproduces the same deterministic verdict locally.
 */
function avaliar(subject: string, corpo: string): string[] {
  const achados: string[] = [];
  if (!subject.trim()) achados.push("subject vazio");
  const texto = (subject + "\n" + corpo).toLowerCase();
  for (const termo of TERMOS_BANIDOS_DEMO) {
    if (texto.includes(termo)) achados.push(termo);
  }
  return achados;
}

export default function EditorDeCopy() {
  const [subject, setSubject] = useState<string>(COPY_DEMO.subject);
  const [corpo, setCorpo] = useState<string>(COPY_DEMO.corpo);
  const [salvo, setSalvo] = useState(false);

  const achados = useMemo(() => avaliar(subject, corpo), [subject, corpo]);
  const aprovado = achados.length === 0;

  return (
    <div className="max-w-3xl space-y-4">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Editor de copy</h1>
        <p className="text-sm text-muted-foreground mt-1">
          O gate do piso roda no salvar E no enviar — linha reprovada cai no seed e loga,
          nunca sai.
        </p>
      </header>

      <Card>
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">E-mail da campanha</CardTitle>
            <Badge variant={aprovado ? "outline" : "destructive"} className="text-[10px]">
              {aprovado ? "Aprovada no piso" : `${achados.length} achado(s)`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <label className="block text-sm">
            <span className="text-muted-foreground">Subject</span>
            <input
              value={subject}
              onChange={(e) => {
                setSalvo(false);
                setSubject(e.target.value);
              }}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">Corpo</span>
            <textarea
              value={corpo}
              onChange={(e) => {
                setSalvo(false);
                setCorpo(e.target.value);
              }}
              rows={8}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            />
          </label>

          {!aprovado ? (
            <ul className="text-sm text-destructive space-y-1">
              {achados.map((a) => (
                <li key={a}>• {a}</li>
              ))}
            </ul>
          ) : null}

          <div className="flex items-center gap-3">
            <Button disabled={!aprovado} onClick={() => setSalvo(true)}>
              Salvar
            </Button>
            {salvo ? (
              <Badge variant="outline" className="text-[10px]">
                Salvo (demo — nada gravado)
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
