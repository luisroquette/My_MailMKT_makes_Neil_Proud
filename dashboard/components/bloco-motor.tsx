import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { BlocoDoMotor } from "@/data/fixtures";

export function BlocoMotor({ bloco }: { bloco: BlocoDoMotor | null }) {
  if (!bloco) {
    return (
      <Card>
        <CardContent className="p-4 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{bloco.nome}</CardTitle>
          <Badge variant="outline" className="font-mono text-[10px]">
            {bloco.horario}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {bloco.ultimaRodada === null ? (
          <p className="text-sm text-muted-foreground">Última rodada: indisponível</p>
        ) : (
          <dl className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Enviados</dt>
              <dd className="font-semibold tabular-nums">{bloco.ultimaRodada.enviados}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Candidatos</dt>
              <dd className="tabular-nums">{bloco.ultimaRodada.candidatos}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Falhas</dt>
              <dd
                className={`tabular-nums font-medium ${
                  bloco.ultimaRodada.falhas > 0 ? "text-destructive" : ""
                }`}
              >
                {bloco.ultimaRodada.falhas}
              </dd>
            </div>
          </dl>
        )}
        <p className="mt-2 text-[11px] text-muted-foreground">
          Prioridade {bloco.prioridade} ·{" "}
          {bloco.ultimaRodada?.executadoEm ?? "sem registro de rodada"}
        </p>
      </CardContent>
    </Card>
  );
}
