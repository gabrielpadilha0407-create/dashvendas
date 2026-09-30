"use client";

import { usePathname, useRouter } from "next/navigation";
import { MESES } from "@/lib/painel/calc";
import { nomeMes } from "@/lib/painel/formato";

export function SeletorMes({ mes }: { mes: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      <label htmlFor="mes" className="sr-only">
        Mês
      </label>
      <select
        id="mes"
        value={mes}
        onChange={(e) => router.push(`${pathname}?mes=${e.target.value}`)}
        className="h-10 rounded-md border border-input bg-card px-3 text-base font-medium"
      >
        {MESES.map((m) => (
          <option key={m} value={m}>
            {nomeMes(m)} 2026
          </option>
        ))}
      </select>
    </>
  );
}
