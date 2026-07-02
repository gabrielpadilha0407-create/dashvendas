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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createPessoa, updatePessoa, type ActionState } from "@/app/configuracoes/actions";
import type { Pessoa } from "@/lib/types";

const initialState: ActionState = { error: null };

export function PersonFormDialog({ pessoa }: { pessoa?: Pessoa }) {
  const isEdit = Boolean(pessoa);
  const action = isEdit ? updatePessoa.bind(null, pessoa!.id) : createPessoa;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [open, setOpen] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!state.error) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon" aria-label="Editar pessoa">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" />
            Adicionar pessoa
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar pessoa" : "Adicionar pessoa"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize o nome ou o papel da pessoa." : "Cadastre um novo membro do time."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" defaultValue={pessoa?.nome} required />
          </div>
          <div className="space-y-2">
            <Label>Papel</Label>
            <Select name="papel" defaultValue={pessoa?.papel ?? "SDR"}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SDR">SDR</SelectItem>
                <SelectItem value="Closer">Closer</SelectItem>
                <SelectItem value="Operacional">Operacional</SelectItem>
              </SelectContent>
            </Select>
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
