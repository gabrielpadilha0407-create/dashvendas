"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMonthLabel, shiftMonth } from "@/lib/utils";

export function MonthSelector({ mes }: { mes: string }) {
  const router = useRouter();
  const go = (target: string) => router.push(`/?mes=${target}`);

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="icon" onClick={() => go(shiftMonth(mes, -1))} aria-label="Mês anterior">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-44 text-center text-lg font-semibold capitalize">{formatMonthLabel(mes)}</span>
      <Button variant="outline" size="icon" onClick={() => go(shiftMonth(mes, 1))} aria-label="Próximo mês">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
