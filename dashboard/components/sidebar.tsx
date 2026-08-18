"use client";

import { useEffect, useState } from "react";
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
    <aside className="hidden md:flex w-56 shrink-0 flex-col bg-ink text-white">
      <div className="px-4 py-5 border-b border-white/10">
        <img src="/logo.png" alt="CF Gauss" className="h-9 w-9 rounded-md" />
        <p className="mt-3 text-sm font-semibold tracking-tight text-white">Mail MKT</p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.11em] text-lilac">
          Motor de e-mail
        </p>
        <Badge variant="outline" className="mt-2 border-white/20 font-mono text-[10px] text-white">
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
                  ? "bg-brand font-medium text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.rotulo}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-white/10 text-[11px] text-white/60">
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
  const [aberto, setAberto] = useState(false);
  // close the drawer on navigation — the sheet persists across routes
  useEffect(() => {
    setAberto(false);
  }, [pathname]);
  return (
    <div className="md:hidden flex items-center justify-between border-b bg-background px-4 py-3">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <img src="/logo.png" alt="CF Gauss" className="h-6 w-6 rounded" />
        Mail MKT
      </p>
      <Sheet open={aberto} onOpenChange={setAberto}>
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
                  onClick={() => setAberto(false)}
                  aria-current={ativo ? "page" : undefined}
                  className={`block rounded-md px-3 py-2 text-sm ${
                    ativo ? "bg-brand/15 font-semibold text-brand" : "text-muted-foreground"
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