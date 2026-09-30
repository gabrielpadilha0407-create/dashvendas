import type { ReactNode } from "react";
import type { Faixa } from "@/lib/painel/calc";
import { COR_FAIXA, ROTULO_FAIXA } from "@/lib/painel/formato";
import { cn } from "@/lib/utils";

export function Bloco({
  titulo,
  extra,
  children,
  className,
}: {
  titulo?: string;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6", className)}>
      {(titulo || extra) && (
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          {titulo && <h2 className="text-lg font-semibold tracking-tight lg:text-xl">{titulo}</h2>}
          {extra && <div className="text-sm text-muted-foreground">{extra}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Barra({ pct, faixa, alta = false }: { pct: number | null; faixa: Faixa; alta?: boolean }) {
  const largura = pct === null ? 0 : Math.max(0, Math.min(100, pct));
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-secondary", alta ? "h-3" : "h-2")}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(largura)}
    >
      <div className="h-full rounded-full" style={{ width: `${largura}%`, backgroundColor: COR_FAIXA[faixa] }} />
    </div>
  );
}

/** Indicador de faixa: a cor vem sempre acompanhada de rótulo. */
export function SeloFaixa({ faixa, texto, className }: { faixa: Faixa; texto?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground", className)}>
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: COR_FAIXA[faixa] }} />
      {texto ?? ROTULO_FAIXA[faixa]}
    </span>
  );
}

export function ErroBloco({ tabelas }: { tabelas: string[] }) {
  return (
    <p className="rounded-lg border border-dashed border-destructive/60 p-4 text-sm text-destructive">
      Não foi possível montar este bloco: falha ao ler {tabelas.join(", ")}. Veja o erro no topo da página.
    </p>
  );
}

export function Esqueleto({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-secondary", className)} />;
}

export const th = "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground";
export const td = "px-3 py-3 text-base tabular-nums lg:text-lg";
