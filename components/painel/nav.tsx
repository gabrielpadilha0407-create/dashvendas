"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const ABAS = [
  { href: "/painel", rotulo: "Painel" },
  { href: "/painel/metas", rotulo: "Metas" },
  { href: "/painel/reunioes", rotulo: "Reuniões" },
];

export function NavPainel() {
  const pathname = usePathname();
  const mes = useSearchParams().get("mes");
  const sufixo = mes ? `?mes=${mes}` : "";

  return (
    <nav className="flex flex-wrap items-center gap-1">
      {ABAS.map((a) => (
        <Link
          key={a.href}
          href={`${a.href}${sufixo}`}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            pathname === a.href ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {a.rotulo}
        </Link>
      ))}
      <Link href="/" className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        Vendas
      </Link>
    </nav>
  );
}
