"use client";

import { useTransition } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PersonFormDialog } from "@/components/person-form-dialog";
import { togglePessoaAtivo } from "@/app/configuracoes/actions";
import type { Pessoa } from "@/lib/types";

const papelBadgeVariant: Record<Pessoa["papel"], "default" | "secondary" | "outline"> = {
  SDR: "secondary",
  Closer: "default",
  Operacional: "outline",
};

export function PeopleTable({ pessoas }: { pessoas: Pessoa[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Papel</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pessoas.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground">
              Nenhuma pessoa cadastrada.
            </TableCell>
          </TableRow>
        )}
        {pessoas.map((pessoa) => (
          <TableRow key={pessoa.id}>
            <TableCell className="font-medium">{pessoa.nome}</TableCell>
            <TableCell>
              <Badge variant={papelBadgeVariant[pessoa.papel]}>{pessoa.papel}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={pessoa.ativo ? "success" : "secondary"}>
                {pessoa.ativo ? "Ativo" : "Inativo"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <PersonFormDialog pessoa={pessoa} />
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await togglePessoaAtivo(pessoa.id, !pessoa.ativo);
                    })
                  }
                >
                  {pessoa.ativo ? "Inativar" : "Ativar"}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
