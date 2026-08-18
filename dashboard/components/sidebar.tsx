import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "/", rotulo: "Hub" },
  { href: "/calendario", rotulo: "Calendário" },
  { href: "/regras", rotulo: "Regras" },
  { href: "/agenda", rotulo: "Agenda" },
  { href: "/campanhas", rotulo: "Campanhas" },
  { href: "/copy", rotulo: "Editor de copy" },
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
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {item.rotulo}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-3 border-t text-[11px] text-muted-foreground">
        Fidelidade: produção CF Gauss
        <br />
        dados fixos · America/Sao_Paulo
      </div>
    </aside>
  );
}
