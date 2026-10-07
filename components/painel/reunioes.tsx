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

const campoFiltro = "h-10 rounded-md border border-input bg-card px-3 text-base";

/** Lista de reuniões com filtro por período (de/até), status, SDR e busca por empresa. Começa mostrando o mês escolhido. */
export function ListaReunioes({
  reunioes,
  nomes,
  mes,
  hoje,
  limites,
}: {
  /** todas as reuniões carregadas (ano escolhido + dezembro anterior) */
  reunioes: ReuniaoP[];
  nomes: Record<string, string>;
  mes: string;
  hoje: string;
  limites: { min: string; max: string };
}) {
  const ultimoDia = new Date(Date.UTC(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0)).getUTCDate();
  const inicioMes = `${mes}-01`;
  const fimMes = `${mes}-${String(ultimoDia).padStart(2, "0")}`;
  const [de, setDe] = useState(inicioMes);
  const [ate, setAte] = useState(fimMes);
  const [status, setStatus] = useState<"" | StatusReuniao>("");
  const [sdr, setSdr] = useState("");
  const [busca, setBusca] = useState("");

  const doPeriodo = reunioes.filter((r) => (!de || r.data >= de) && (!ate || r.data <= ate));
  const sdrsDoMes = [...new Set(doPeriodo.map((r) => r.sdr_id))].sort((a, b) =>
    (nomes[a] ?? "").localeCompare(nomes[b] ?? "", "pt-BR"),
  );
  const termo = busca.trim().toLowerCase();
  const filtradas = doPeriodo.filter(
    (r) =>
      (!status || r.status === status) &&
      (!sdr || r.sdr_id === sdr) &&
      (!termo || r.empresa.toLowerCase().includes(termo)),
  );
  const periodoDoMes = de === inicioMes && ate === fimMes;
  const filtrando = Boolean(!periodoDoMes || status || sdr || termo);
  const textoPeriodo =
    de && ate && de === ate
      ? ` em ${dataCurta(de)}`
      : periodoDoMes
        ? " no mês"
        : ` de ${de ? dataCurta(de) : "início"} a ${ate ? dataCurta(ate) : "hoje"}`;

  // Resumo: reuniões realizadas no recorte, por SDR
  const realizadas = filtradas.filter((r) => r.status === "realizada");
  const porSdr = Object.entries(
    realizadas.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.sdr_id]: (acc[r.sdr_id] ?? 0) + 1 }), {}),
  ).sort((a, b) => b[1] - a[1]);

  const limpar = () => {
    setDe(inicioMes);
    setAte(fimMes);
    setStatus("");
    setSdr("");
    setBusca("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="f-de" className={rotulo}>
            De
          </label>
          <Input
            id="f-de"
            type="date"
            value={de}
            min={limites.min}
            max={limites.max}
            onChange={(e) => setDe(e.target.value)}
            className="h-10 w-44 text-base"
          />
        </div>
        <div>
          <label htmlFor="f-ate" className={rotulo}>
            Até
          </label>
          <Input
            id="f-ate"
            type="date"
            value={ate}
            min={limites.min}
            max={limites.max}
            onChange={(e) => setAte(e.target.value)}
            className="h-10 w-44 text-base"
          />
        </div>
        {hoje >= limites.min && hoje <= limites.max && (
          <Button
            variant="outline"
            className="h-10"
            onClick={() => {
              setDe(hoje);
              setAte(hoje);
            }}
          >
            Hoje
          </Button>
        )}
        <div>
          <label htmlFor="f-status" className={rotulo}>
            Status
          </label>
          <select
            id="f-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as "" | StatusReuniao)}
            className={campoFiltro}
          >
            <option value="">Todos</option>
            {STATUS_REUNIAO.map((s) => (
              <option key={s.valor} value={s.valor}>
                {s.rotulo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-sdr" className={rotulo}>
            SDR
          </label>
          <select id="f-sdr" value={sdr} onChange={(e) => setSdr(e.target.value)} className={campoFiltro}>
            <option value="">Todos</option>
            {sdrsDoMes.map((id) => (
              <option key={id} value={id}>
                {nomes[id] ?? "—"}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-48 flex-1">
          <label htmlFor="f-busca" className={rotulo}>
            Buscar empresa
          </label>
          <Input
            id="f-busca"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome da marmoraria"
            className="h-10 text-base"
          />
        </div>
        {filtrando && (
          <Button variant="outline" onClick={limpar} className="h-10">
            Limpar filtros
          </Button>
        )}
      </div>

      <p className="text-sm tabular-nums text-muted-foreground">
        <strong className="text-foreground">{realizadas.length}</strong>{" "}
        {realizadas.length === 1 ? "reunião realizada" : "reuniões realizadas"}
        {textoPeriodo}
        {porSdr.length > 0 && <> · {porSdr.map(([id, n]) => `${nomes[id] ?? "—"} ${n}`).join(" · ")}</>}
        {filtrando && (
          <>
            {" "}
            — mostrando {filtradas.length} {filtradas.length === 1 ? "lançamento" : "lançamentos"}
          </>
        )}
      </p>

      {filtradas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma reunião com esses filtros.</p>
      ) : (
        <TabelaReunioes reunioes={filtradas} nomes={nomes} />
      )}
    </div>
  );
}

function TabelaReunioes({ reunioes, nomes }: { reunioes: ReuniaoP[]; nomes: Record<string, string> }) {
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
