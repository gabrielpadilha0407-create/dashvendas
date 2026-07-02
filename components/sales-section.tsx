"use client";

import { useState } from "react";
import { Trash2, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SaleFormDialog } from "@/components/sale-form-dialog";
import { deleteVenda } from "@/app/actions";
import { formatCurrency } from "@/lib/utils";
import type { Pessoa, TipoVenda, VendaComPessoas } from "@/lib/types";

type SortKey = "data" | "valor";

const tipoBadgeVariant: Record<TipoVenda, "success" | "secondary" | "default"> = {
  MRR: "success",
  "Não recorrente": "secondary",
  "Monetização": "default",
};

export function SalesSection({
  vendas,
  pessoas,
}: {
  vendas: VendaComPessoas[];
  pessoas: Pessoa[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("data");
  const [sortDesc, setSortDesc] = useState(true);

  const sorted = [...vendas].sort((a, b) => {
    const dir = sortDesc ? -1 : 1;
    if (sortKey === "valor") return (a.valor - b.valor) * dir;
    return (a.data < b.data ? -1 : a.data > b.data ? 1 : 0) * dir;
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDesc((d) => !d);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir esta venda?")) return;
    await deleteVenda(id);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Vendas do mês</CardTitle>
        <SaleFormDialog pessoas={pessoas} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("data")}>
                  Data <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>SDR</TableHead>
              <TableHead>Closer / Operacional</TableHead>
              <TableHead>
                <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("valor")}>
                  Valor <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhuma venda registrada neste mês.
                </TableCell>
              </TableRow>
            )}
            {sorted.map((venda) => (
              <TableRow key={venda.id}>
                <TableCell>{new Date(`${venda.data}T00:00:00`).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>
                  <Badge variant={tipoBadgeVariant[venda.tipo]}>{venda.tipo}</Badge>
                </TableCell>
                <TableCell>{venda.cliente}</TableCell>
                <TableCell className="text-muted-foreground">{venda.sdr?.nome ?? "—"}</TableCell>
                <TableCell>{venda.closer?.nome ?? venda.operacional?.nome ?? "—"}</TableCell>
                <TableCell className="font-medium">{formatCurrency(venda.valor)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <SaleFormDialog pessoas={pessoas} venda={venda} />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(venda.id)}
                      aria-label="Excluir venda"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
