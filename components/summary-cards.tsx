"use client";

import { useState, useTransition } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import { updateMeta } from "@/app/actions";
import type { Meta, VendaComPessoas } from "@/lib/types";

type MetaField = "meta_mrr" | "meta_nao_recorrente" | "meta_monetizacao";

function GoalCard({
  label,
  atual,
  meta,
  mes,
  field,
}: {
  label: string;
  atual: number;
  meta: number;
  mes: string;
  field: MetaField | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(meta));
  const [isPending, startTransition] = useTransition();
  const pct = meta > 0 ? (atual / meta) * 100 : atual > 0 ? 100 : 0;
  const restante = meta - atual;

  function save() {
    const parsed = Number(value.replace(",", "."));
    if (Number.isNaN(parsed) || parsed < 0 || !field) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      await updateMeta(mes, field, parsed);
      setEditing(false);
    });
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          {field && !editing && (
            <button
              onClick={() => {
                setValue(String(meta));
                setEditing(true);
              }}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label={`Editar meta de ${label}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="text-2xl font-bold tracking-tight">{formatCurrency(atual)}</div>

        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-7 text-sm"
              inputMode="decimal"
            />
            <Button size="icon" className="h-7 w-7 shrink-0" onClick={save} disabled={isPending}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={() => setEditing(false)}
              disabled={isPending}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">
              Meta: {formatCurrency(meta)} · {formatPercent(pct)}
            </p>
            {meta > 0 && (
              <p className={cn("text-xs font-medium", restante > 0 ? "text-warning" : "text-success")}>
                {restante > 0
                  ? `Falta ${formatCurrency(restante)}`
                  : `Meta batida (+${formatCurrency(-restante)})`}
              </p>
            )}
          </div>
        )}

        <Progress value={Math.min(pct, 100)} />
      </CardContent>
    </Card>
  );
}

export function SummaryCards({
  mes,
  meta,
  vendas,
}: {
  mes: string;
  meta: Meta;
  vendas: VendaComPessoas[];
}) {
  const totalMrr = vendas.filter((v) => v.tipo === "MRR").reduce((s, v) => s + v.valor, 0);
  const totalSetup = vendas
    .filter((v) => v.tipo === "MRR")
    .reduce((s, v) => s + (v.valor_setup ?? 0), 0);
  const totalNaoRecorrente =
    vendas.filter((v) => v.tipo === "Não recorrente").reduce((s, v) => s + v.valor, 0) + totalSetup;
  const totalMonetizacao = vendas
    .filter((v) => v.tipo === "Monetização")
    .reduce((s, v) => s + v.valor, 0);
  const totalVendas = totalMrr + totalNaoRecorrente + totalMonetizacao;
  const metaTotal = meta.meta_mrr + meta.meta_nao_recorrente + meta.meta_monetizacao;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <GoalCard label="Vendas totais" atual={totalVendas} meta={metaTotal} mes={mes} field={null} />
      <GoalCard label="Meta de MRR" atual={totalMrr} meta={meta.meta_mrr} mes={mes} field="meta_mrr" />
      <GoalCard
        label="Não recorrente"
        atual={totalNaoRecorrente}
        meta={meta.meta_nao_recorrente}
        mes={mes}
        field="meta_nao_recorrente"
      />
      <GoalCard
        label="Monetização"
        atual={totalMonetizacao}
        meta={meta.meta_monetizacao}
        mes={mes}
        field="meta_monetizacao"
      />
    </div>
  );
}
