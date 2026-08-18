import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface KpiDados {
  rotulo: string;
  valor: string;
  delta?: string;
  deltaDirecao?: "up" | "down";
}

export function Kpi({ dados }: { dados: KpiDados | null }) {
  if (!dados) {
    return (
      <Card>
        <CardContent className="p-4 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-16" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground">{dados.rotulo}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {dados.valor}
          </span>
          {dados.delta ? (
            <span
              className={`text-xs font-medium tabular-nums ${
                dados.deltaDirecao === "down" ? "text-destructive" : "text-emerald-700 dark:text-emerald-400"
              }`}
            >
              {dados.deltaDirecao === "down" ? "▼" : "▲"} {dados.delta}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
