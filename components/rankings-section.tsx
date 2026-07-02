"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import type { RankingItem } from "@/lib/types";
import type { Rankings } from "@/lib/data";

function RankingList({
  title,
  items,
  showMrr,
}: {
  title: string;
  items: RankingItem[];
  showMrr: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem vendas no período.</p>
        ) : (
          <ol className="space-y-3">
            {items.map((item, i) => (
              <li key={item.pessoa_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                    {i + 1}
                  </span>
                  <span className="font-medium">{item.nome}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(item.total)}</div>
                  {showMrr && (
                    <div className="text-xs text-muted-foreground">{formatCurrency(item.totalMrr)} em MRR</div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export function RankingsSection({ rankings }: { rankings: Rankings }) {
  const [scope, setScope] = useState<"mes" | "total">("mes");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Rankings</h2>
        <Tabs value={scope} onValueChange={(v) => setScope(v as "mes" | "total")}>
          <TabsList>
            <TabsTrigger value="mes">Mês selecionado</TabsTrigger>
            <TabsTrigger value="total">Total geral</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <RankingList title="Closers" items={rankings.closers[scope]} showMrr />
        <RankingList title="SDRs" items={rankings.sdrs[scope]} showMrr />
        <RankingList title="Operacional (Monetização)" items={rankings.operacional[scope]} showMrr={false} />
      </div>
    </div>
  );
}
