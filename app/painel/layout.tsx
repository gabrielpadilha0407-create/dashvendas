import { Suspense } from "react";
import type { Metadata } from "next";
import { NavPainel } from "@/components/painel/nav";

export const metadata: Metadata = {
  title: "Painel Comercial QH4",
};

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1920px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-foreground px-2.5 py-1 text-lg font-bold tracking-tight text-background">QH4</span>
            <span className="text-xl font-semibold tracking-tight sm:text-2xl">Painel Comercial</span>
          </div>
          <Suspense fallback={null}>
            <NavPainel />
          </Suspense>
        </div>
      </div>
      <main className="mx-auto max-w-[1920px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
