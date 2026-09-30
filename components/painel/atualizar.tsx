"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const INTERVALO_MS = 5 * 60 * 1000;

/** Botão Atualizar + releitura automática a cada 5 minutos. */
export function Atualizar({ geradoEm }: { geradoEm: string }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();

  useEffect(() => {
    const t = window.setInterval(() => router.refresh(), INTERVALO_MS);
    return () => window.clearInterval(t);
  }, [router]);

  const hora = new Date(geradoEm).toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-3">
      <Button onClick={() => iniciar(() => router.refresh())} disabled={pendente} className="h-10 px-4 text-base">
        {pendente ? "Atualizando…" : "Atualizar"}
      </Button>
      <span className="text-sm tabular-nums text-muted-foreground" suppressHydrationWarning>
        Atualizado às {hora}
      </span>
    </div>
  );
}
