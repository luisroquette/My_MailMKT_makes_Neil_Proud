"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Rules screen — the editable surface of nurture_config. The demo validates
 * with the same rules as nucleo/config.ts mesclarConfig (invalid falls back
 * to the default, never throws). Production: this form writes the singleton
 * jsonb row; the engine merges it over CONFIG_PADRAO.
 */

const RE_HORA = /^\d{2}:\d{2}$/;

function ehHoraValida(v: string): boolean {
  if (!RE_HORA.test(v)) return false;
  const [h, m] = v.split(":").map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

const DEFAULTS = {
  maxPorLeadPorDia: 1,
  minHorasEntreEnvios: 20,
  mailMkt: "10:30",
  esteira: "10:00",
  digest: "11:00",
  fusivel: 100,
  blackoutInicio: "22:00",
  blackoutFim: "06:00",
};

export default function Regras() {
  const [regras, setRegras] = useState(DEFAULTS);
  const [salvo, setSalvo] = useState(false);

  const invalidos = [
    !Number.isInteger(regras.maxPorLeadPorDia) || regras.maxPorLeadPorDia < 1,
    !Number.isInteger(regras.minHorasEntreEnvios) || regras.minHorasEntreEnvios < 1,
    !ehHoraValida(regras.mailMkt),
    !ehHoraValida(regras.esteira),
    !ehHoraValida(regras.digest),
    !ehHoraValida(regras.blackoutInicio),
    !ehHoraValida(regras.blackoutFim),
    !Number.isInteger(regras.fusivel) || regras.fusivel < 1,
  ].filter(Boolean).length;

  return (
    <div className="max-w-2xl space-y-4">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Regras globais</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Valores inválidos caem no default (mesclarConfig) — nada é gravado cru.
        </p>
      </header>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold">Throttle compartilhado</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <label className="block text-sm">
            <span className="text-muted-foreground">Máx. e-mails por lead por dia</span>
            <input
              type="number"
              min={1}
              value={regras.maxPorLeadPorDia}
              onChange={(e) => {
                setSalvo(false);
                setRegras({ ...regras, maxPorLeadPorDia: Number(e.target.value) });
              }}
              className="mt-1 w-32 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">Intervalo mínimo entre envios (horas)</span>
            <input
              type="number"
              min={1}
              value={regras.minHorasEntreEnvios}
              onChange={(e) => {
                setSalvo(false);
                setRegras({ ...regras, minHorasEntreEnvios: Number(e.target.value) });
              }}
              className="mt-1 w-32 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold">Horários dos motores</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 grid gap-4 sm:grid-cols-3">
          {(
            [
              ["Mail MKT", "mailMkt"],
              ["Esteira", "esteira"],
              ["Digest", "digest"],
            ] as const
          ).map(([rotulo, chave]) => (
            <label key={chave} className="block text-sm">
              <span className="text-muted-foreground">{rotulo}</span>
              <input
                value={regras[chave]}
                onChange={(e) => {
                  setSalvo(false);
                  setRegras({ ...regras, [chave]: e.target.value });
                }}
                className={`mt-1 w-full rounded-md border px-3 py-1.5 text-sm font-mono ${
                  ehHoraValida(regras[chave]) ? "border-input bg-background" : "border-destructive"
                }`}
              />
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold">Fusível e blackout</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="text-muted-foreground">Fusível (envios/execução)</span>
            <input
              type="number"
              min={1}
              value={regras.fusivel}
              onChange={(e) => {
                setSalvo(false);
                setRegras({ ...regras, fusivel: Number(e.target.value) });
              }}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">Blackout — início</span>
            <input
              value={regras.blackoutInicio}
              onChange={(e) => {
                setSalvo(false);
                setRegras({ ...regras, blackoutInicio: e.target.value });
              }}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm font-mono"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">Blackout — fim</span>
            <input
              value={regras.blackoutFim}
              onChange={(e) => {
                setSalvo(false);
                setRegras({ ...regras, blackoutFim: e.target.value });
              }}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm font-mono"
            />
          </label>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button disabled={invalidos > 0} onClick={() => setSalvo(true)}>
          Salvar regras
        </Button>
        {invalidos > 0 ? (
          <span className="text-sm text-destructive">{invalidos} campo(s) inválido(s)</span>
        ) : salvo ? (
          <Badge variant="outline" className="text-[10px]">
            Salvo (demo — nada gravado)
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
