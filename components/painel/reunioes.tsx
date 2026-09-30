"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { alterarStatusReuniao, criarReuniao, excluirReuniao, type ResultadoAcao } from "@/app/painel/actions";
import { STATUS_REUNIAO, type ReuniaoP, type StatusReuniao } from "@/lib/painel/calc";
import { dataCurta } from "@/lib/painel/formato";
import { cn } from "@/lib/utils";

type Opcao = { id: string; nome: string };

const campoSelect = "h-10 w-full rounded-md border border-input bg-card px-3 text-base";
const rotulo = "mb-1 block text-sm text-muted-foreground";

export function FormReuniao({ sdrs, closers, dataPadrao }: { sdrs: Opcao[]; closers: Opcao[]; dataPadrao: string }) {
  const [estado, enviar, enviando] = useActionState<ResultadoAcao, FormData>(criarReuniao, { error: null });
  const form = useRef<HTMLFormElement>(null);

  // O React limpa o formulário após o envio; devolve o foco à empresa para lançar a próxima
  useEffect(() => {
    if (estado.enviadoEm) (form.current?.elements.namedItem("empresa") as HTMLInputElement | null)?.focus();
  }, [estado]);

  return (
    <form ref={form} action={enviar} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6 xl:items-end">
      <div>
        <label htmlFor="r-data" className={rotulo}>
          Data
        </label>
        <Input id="r-data" name="data" type="date" defaultValue={dataPadrao} required className="h-10 text-base" />
      </div>
      <div className="xl:col-span-2">
        <label htmlFor="r-empresa" className={rotulo}>
          Empresa
        </label>
        <Input id="r-empresa" name="empresa" required placeholder="Nome da marmoraria" className="h-10 text-base" />
      </div>
      <div>
        <label htmlFor="r-sdr" className={rotulo}>
          SDR
        </label>
        <select id="r-sdr" name="sdr_id" required defaultValue="" className={campoSelect}>
          <option value="" disabled>
            Selecione
          </option>
          {sdrs.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="r-closer" className={rotulo}>
          Closer
        </label>
        <select id="r-closer" name="closer_id" defaultValue="" className={campoSelect}>
          <option value="">—</option>
          {closers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="r-status" className={rotulo}>
          Status
        </label>
        <select id="r-status" name="status" defaultValue="realizada" className={campoSelect}>
          {STATUS_REUNIAO.map((s) => (
            <option key={s.valor} value={s.valor}>
              {s.rotulo}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2 xl:col-span-6">
        <Button type="submit" disabled={enviando} className="h-11 px-6 text-base">
          {enviando ? "Salvando…" : "Lançar reunião"}
        </Button>
        {estado.error && <p className="text-sm text-destructive">{estado.error}</p>}
        {!estado.error && estado.enviadoEm && <p className="text-sm text-[#3fd13f]">Reunião lançada.</p>}
      </div>
    </form>
  );
}

export function ListaReunioes({ reunioes, nomes }: { reunioes: ReuniaoP[]; nomes: Record<string, string> }) {
  if (reunioes.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma reunião lançada neste mês.</p>;
  }
  return (
    <div className="-mx-3 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-base">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2 font-semibold">Data</th>
            <th className="px-3 py-2 font-semibold">Empresa</th>
            <th className="px-3 py-2 font-semibold">SDR</th>
            <th className="px-3 py-2 font-semibold">Closer</th>
            <th className="px-3 py-2 font-semibold">Status</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {reunioes.map((r) => (
            <LinhaReuniao key={r.id} reuniao={r} nomes={nomes} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LinhaReuniao({ reuniao, nomes }: { reuniao: ReuniaoP; nomes: Record<string, string> }) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const mudarStatus = (status: StatusReuniao) =>
    iniciar(async () => {
      const r = await alterarStatusReuniao(reuniao.id, status);
      setErro(r.error);
    });

  const excluir = () => {
    if (!window.confirm(`Excluir a reunião com ${reuniao.empresa} (${dataCurta(reuniao.data)})?`)) return;
    iniciar(async () => {
      const r = await excluirReuniao(reuniao.id);
      setErro(r.error);
    });
  };

  return (
    <tr className={cn("border-b border-border/50 last:border-0", pendente && "opacity-50")}>
      <td className="px-3 py-2 tabular-nums">{dataCurta(reuniao.data)}</td>
      <td className="px-3 py-2 font-medium">
        {reuniao.empresa}
        {erro && <span className="block text-xs text-destructive">{erro}</span>}
      </td>
      <td className="px-3 py-2">{nomes[reuniao.sdr_id] ?? "—"}</td>
      <td className="px-3 py-2">{reuniao.closer_id ? (nomes[reuniao.closer_id] ?? "—") : "—"}</td>
      <td className="px-3 py-2">
        <select
          aria-label="Status"
          value={reuniao.status}
          disabled={pendente}
          onChange={(e) => mudarStatus(e.target.value as StatusReuniao)}
          className="h-9 rounded-md border border-input bg-card px-2 text-sm"
        >
          {STATUS_REUNIAO.map((s) => (
            <option key={s.valor} value={s.valor}>
              {s.rotulo}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2 text-right">
        <Button variant="ghost" size="icon" onClick={excluir} disabled={pendente} aria-label="Excluir reunião">
          <Trash2 />
        </Button>
      </td>
    </tr>
  );
}
