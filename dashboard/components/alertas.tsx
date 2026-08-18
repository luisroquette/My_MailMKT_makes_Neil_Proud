import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Alerta } from "@/data/fixtures";

const ROTULO: Record<Alerta["tipo"], string> = {
  motor_zero_falhas: "Motor zerado",
  campanha_zero: "Campanha zerada",
  dead_letter: "Dead-letter",
};

export function PainelDeAlertas({ alertas }: { alertas: Alerta[] }) {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold">Alertas</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {alertas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum alerta ativo.</p>
        ) : (
          <ul className="space-y-2">
            {alertas.map((a) => (
              <li key={a.tipo + a.mensagem} className="flex items-start gap-2 text-sm">
                <Badge variant="destructive" className="shrink-0 text-[10px]">
                  {ROTULO[a.tipo]}
                </Badge>
                <span className="text-muted-foreground">{a.mensagem}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
