"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createVenda, updateVenda, type ActionState } from "@/app/actions";
import { todayISO } from "@/lib/utils";
import type { Pessoa, TipoVenda, VendaComPessoas } from "@/lib/types";

const initialState: ActionState = { error: null };

export function SaleFormDialog({
  pessoas,
  venda,
}: {
  pessoas: Pessoa[];
  venda?: VendaComPessoas;
}) {
  const isEdit = Boolean(venda);
  const action = isEdit ? updateVenda.bind(null, venda!.id) : createVenda;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<TipoVenda>(venda?.tipo ?? "MRR");
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!state.error) setOpen(false);
  }, [state]);

  const closers = pessoas.filter((p) => p.papel === "Closer" && (p.ativo || p.id === venda?.closer_id));
  const sdrs = pessoas.filter((p) => p.papel === "SDR" && (p.ativo || p.id === venda?.sdr_id));
  const operacionais = pessoas.filter(
    (p) => p.papel === "Operacional" && (p.ativo || p.id === venda?.operacional_id),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon" aria-label="Editar venda">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" />
            Adicionar venda
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar venda" : "Adicionar venda"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize os dados da venda." : "Registre uma nova venda do mês."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input id="data" name="data" type="date" defaultValue={venda?.data ?? todayISO()} required />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select name="tipo" value={tipo} onValueChange={(v) => setTipo(v as TipoVenda)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MRR">MRR</SelectItem>
                  <SelectItem value="Não recorrente">Não recorrente</SelectItem>
                  <SelectItem value="Monetização">Monetização/Upsell</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                name="valor"
                type="text"
                inputMode="decimal"
                defaultValue={venda?.valor}
                required
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Input id="cliente" name="cliente" defaultValue={venda?.cliente} required />
            </div>
          </div>

          {tipo === "Monetização" ? (
            <div className="space-y-2">
              <Label>Operacional responsável</Label>
              <Select name="operacional_id" defaultValue={venda?.operacional_id ?? undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {operacionais.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Closer (fechou)</Label>
                <Select name="closer_id" defaultValue={venda?.closer_id ?? undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {closers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>SDR (agendou)</Label>
                <Select name="sdr_id" defaultValue={venda?.sdr_id ?? "none"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {sdrs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {!isEdit && tipo === "MRR" && (
            <div className="space-y-2">
              <Label htmlFor="valor_setup">Setup / não recorrente (opcional)</Label>
              <Input
                id="valor_setup"
                name="valor_setup"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
              />
              <p className="text-xs text-muted-foreground">
                Se preenchido, lança automaticamente uma segunda venda do tipo Não recorrente para o mesmo cliente.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacao">Observação (opcional)</Label>
            <Textarea id="observacao" name="observacao" defaultValue={venda?.observacao ?? ""} />
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
