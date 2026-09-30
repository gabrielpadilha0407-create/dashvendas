"use client";

import { usePathname, useRouter } from "next/navigation";
import { NOMES_MESES } from "@/lib/painel/formato";

const classe = "h-10 rounded-md border border-input bg-card px-3 text-base font-medium";

/** Seletor de ano e mês. `anos` vem do servidor (2026 até o ano seguinte ao atual). */
export function SeletorMes({ mes, anos }: { mes: string; anos: number[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ano, numMes] = mes.split("-");
  const ir = (a: string, m: string) => router.push(`${pathname}?mes=${a}-${m}`);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="mes" className="sr-only">
        Mês
      </label>
      <select id="mes" value={numMes} onChange={(e) => ir(ano, e.target.value)} className={classe}>
        {NOMES_MESES.map((nome, i) => {
          const m = String(i + 1).padStart(2, "0");
          return (
            <option key={m} value={m}>
              {nome}
            </option>
          );
        })}
      </select>
      <label htmlFor="ano" className="sr-only">
        Ano
      </label>
      <select id="ano" value={ano} onChange={(e) => ir(e.target.value, numMes)} className={classe}>
        {anos.map((a) => (
          <option key={a} value={String(a)}>
            {a}
          </option>
        ))}
      </select>
    </div>
  );
}
