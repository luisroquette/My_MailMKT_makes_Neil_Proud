import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "/", rotulo: "Hub", ativo: true },
  { href: "/calendario", rotulo: "Calendário", ativo: false },
  { href: "/regras", rotulo: "Regras", ativo: false },
  { href: "/agenda", rotulo: "Agenda", ativo: false },
  { href: "/campanhas", rotulo: "Campanhas", ativo: false },
  { href: "/copy", rotulo: "Editor de copy", ativo: false },
] as const;

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r bg-background">
      <div className="px-4 py-5 border-b">
        <p className="text-sm font-semibold tracking-tight text-foreground">Mail MKT</p>
        <p className="text-xs text-muted-foreground mt-0.5">Motor de e-mail · demo</p>
        <Badge variant="outline" className="mt-2 font-mono text-[10px]">
          v2.0.0
        </Badge>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-1">
        {NAV.map((item) =>
          item.ativo ? (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-foreground bg-primary/10"
            >
              {item.rotulo}
            </Link>
          ) : (
            <span
              key={item.href}
              className="block rounded-md px-3 py-2 text-sm text-muted-foreground"
              title="próxima tela do demo"
            >
              {item.rotulo}
            </span>
          ),
        )}
      </nav>
      <div className="px-4 py-3 border-t text-[11px] text-muted-foreground">
        Fidelidade: produção CF Gauss
        <br />
        dados fixos · America/Sao_Paulo
      </div>
    </aside>
  );
}
