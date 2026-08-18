"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CALENDARIO_14_DIAS, type MotorId } from "@/data/fixtures";
import { formatarDia } from "@/data/formatos";

const NOME: Record<MotorId, string> = {
  mail_mkt: "Mail MKT",
  lancamento: "Lançamento",
  esteira: "Esteira",
  digest: "Digest",
  video_digest: "Vídeo digest",
};

export default function Calendario() {
  const dias = Array.from(new Set(CALENDARIO_14_DIAS.map((m) => m.diaISO)));

  return (
    <div className="max-w-5xl space-y-4">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Calendário de 14 dias</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Colisões marcadas antes de acontecer — dois motores no mesmo tique de hora cheia.
        </p>
      </header>

      {dias.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma marcação nos próximos 14 dias.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">Próximas rodadas</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="py-2 pr-4 font-medium">Dia</th>
                    <th className="py-2 pr-4 font-medium">Hora</th>
                    <th className="py-2 pr-4 font-medium">Motor</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {CALENDARIO_14_DIAS.map((m) => (
                    <tr key={`${m.diaISO}-${m.hora}-${m.motor}`} className="border-b last:border-0">
                      <td className="py-2 pr-4 tabular-nums">{formatarDia(m.diaISO)}</td>
                      <td className="py-2 pr-4 tabular-nums font-mono text-xs">{m.hora}</td>
                      <td className="py-2 pr-4">{NOME[m.motor]}</td>
                      <td className="py-2">
                        {m.colide ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Colisão no tique
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            Ok
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
