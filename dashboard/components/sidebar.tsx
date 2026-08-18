"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

export const NAV = [
  { href: "/", rotulo: "Hub" },
  { href: "/calendario", rotulo: "Calendário" },
  { href: "/regras", rotulo: "Regras" },
  { href: "/agenda", rotulo: "Agenda" },
  { href: "/campanhas", rotulo: "Campanhas" },
  { href: "/copy", rotulo: "Editor de copy" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r bg-background">
      <div className="px-4 py-5 border-b">
        <p className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-brand" />
          Mail MKT
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">Motor de e-mail · demo</p>
        <Badge variant="outline" className="mt-2 font-mono text-[10px]">
          v2.0.0
        </Badge>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-1">
        {NAV.map((item) => {
          const ativo = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo ? "page" : undefined}
              className={`block rounded-md px-3 py-2 text-sm ${
                ativo
                  ? "bg-primary/10 font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item.rotulo}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t text-[11px] text-muted-foreground">
        Fidelidade: produção CF Gauss
        <br />
        dados fixos · America/Sao_Paulo
      </div>
    </aside>
  );
}

/** Mobile-only top bar with a Sheet drawer — desktop keeps the fixed sidebar. */
export function NavMobile() {
  const pathname = usePathname();
  return (
    <div className="md:hidden flex items-center justify-between border-b bg-background px-4 py-3">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-brand" />
        Mail MKT
      </p>
      <Sheet>
        <SheetTrigger className="rounded-md border px-3 py-1.5 text-sm">Menu</SheetTrigger>
        <SheetContent side="left" className="w-64">
          <SheetTitle className="sr-only">Navegação</SheetTitle>
          <nav className="mt-6 space-y-1">
            {NAV.map((item) => {
              const ativo = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={ativo ? "page" : undefined}
                  className={`block rounded-md px-3 py-2 text-sm ${
                    ativo ? "bg-primary/10 font-medium" : "text-muted-foreground"
                  }`}
                >
                  {item.rotulo}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}