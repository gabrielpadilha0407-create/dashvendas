"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { salvarMetas, type MetasDoMes } from "@/app/painel/actions";
import { parseValor } from "@/lib/painel/calc";
import { brl, nomeMes } from "@/lib/painel/formato";

type Valores = { mrr: number; naoRecorrente: number; reunioes: number };

export type PessoaMeta = {
  id: string;
  nome: string;
  papel: "Closer" | "SDR";
  ativo: boolean;
  atual: Valores | null;
  anterior: Valores | null;
};

type Props = {
  mes: string;
  mesAnterior: string | null;
  metaMrr: number | null;
  metaNaoRecorrente: number | null;
  anteriorMrr: number | null;
  anteriorNaoRecorrente: number | null;
  pessoas: PessoaMeta[];
};

// Cada campo editável tem uma chave: "<id>:mrr", "<id>:nr" (closers) ou "<id>:reunioes" (SDRs)
type Campo = "mrr" | "nr" | "reunioes";
const chave = (id: string, campo: Campo) => `${id}:${campo}`;
const texto = (n: number | null | undefined) => (n ? String(n) : "");

function camposDe(p: PessoaMeta, v: Valores | null): [string, string][] {
  return p.papel === "Closer"
    ? [
        [chave(p.id, "mrr"), texto(v?.mrr)],
        [chave(p.id, "nr"), texto(v?.naoRecorrente)],
      ]
    : [[chave(p.id, "reunioes"), texto(v?.reunioes)]];
}

const classeInput = "h-10 w-32 text-right text-base tabular-nums";
const titulo = "mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground";

export function EditorMetas(props: Props) {
  const { mes, mesAnterior, pessoas } = props;
  const [mrr, setMrr] = useState(texto(props.metaMrr));
  const [naoRec, setNaoRec] = useState(texto(props.metaNaoRecorrente));
  const [campos, setCampos] = useState<Record<string, string>>(() =>
    Object.fromEntries(pessoas.flatMap((p) => camposDe(p, p.atual))),
  );
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [salvando, iniciar] = useTransition();

  const closers = pessoas.filter((p) => p.papel === "Closer");
  const sdrs = pessoas.filter((p) => p.papel === "SDR");

  const valor = (k: string) => parseValor(campos[k] ?? "") ?? 0;
  const numMrr = parseValor(mrr);
  const numNaoRec = parseValor(naoRec);
  const somaMrr = closers.reduce((s, p) => s + valor(chave(p.id, "mrr")), 0);
  const somaNr = closers.reduce((s, p) => s + valor(chave(p.id, "nr")), 0);

  const alterar = (k: string, v: string) => {
    setCampos((atual) => ({ ...atual, [k]: v }));
    setMensagem(null);
  };

  const temAnterior = props.anteriorMrr !== null || pessoas.some((p) => p.anterior !== null);

  // Copia só o que existe no mês anterior; quem não tinha meta lá mantém o valor atual
  function copiarAnterior() {
    if (props.anteriorMrr !== null) setMrr(texto(props.anteriorMrr));
    if (props.anteriorNaoRecorrente !== null) setNaoRec(texto(props.anteriorNaoRecorrente));
    setCampos((atual) => {
      const novo = { ...atual };
      for (const p of pessoas) if (p.anterior) Object.assign(novo, Object.fromEntries(camposDe(p, p.anterior)));
      return novo;
    });
    setMensagem({ tipo: "ok", texto: `Valores de ${nomeMes(mesAnterior ?? mes)} copiados. Confira e clique em Salvar.` });
  }

  function salvar() {
    if (numMrr === null || numNaoRec === null) {
      setMensagem({ tipo: "erro", texto: "Meta global com valor inválido. Use só números, ex.: 25000." });
      return;
    }
    const individuais: MetasDoMes["individuais"] = [];
    for (const p of pessoas) {
      const lidos: Partial<Record<Campo, number>> = {};
      const usados: Campo[] = p.papel === "Closer" ? ["mrr", "nr"] : ["reunioes"];
      for (const c of usados) {
        const bruto = campos[chave(p.id, c)] ?? "";
        const n = parseValor(bruto);
        if (n === null || (c === "reunioes" && !Number.isInteger(n))) {
          setMensagem({ tipo: "erro", texto: `Valor inválido para ${p.nome}: "${bruto}".` });
          return;
        }
        lidos[c] = n;
      }
      individuais.push({
        pessoaId: p.id,
        metaMrr: lidos.mrr ?? 0,
        metaNaoRecorrente: lidos.nr ?? 0,
        metaReunioes: lidos.reunioes ?? 0,
      });
    }
    iniciar(async () => {
      const r = await salvarMetas({ mes, metaMrr: numMrr, metaNaoRecorrente: numNaoRec, individuais });
      setMensagem(r.error ? { tipo: "erro", texto: r.error } : { tipo: "ok", texto: `Metas de ${nomeMes(mes)} salvas.` });
    });
  }

  const campo = (k: string, rotulo: string, placeholder = "0") => (
    <Input
      id={k}
      aria-label={rotulo}
      value={campos[k] ?? ""}
      onChange={(e) => alterar(k, e.target.value)}
      inputMode="decimal"
      placeholder={placeholder}
      className={classeInput}
    />
  );

  const nomePessoa = (p: PessoaMeta) => (
    <span className="min-w-0 flex-1 truncate text-base font-medium">
      {p.nome}
      {!p.ativo && <span className="ml-2 text-xs text-muted-foreground">(inativo)</span>}
    </span>
  );

  const diferenca = (soma: number, global: number) =>
    global > 0 && Math.round(soma - global) !== 0
      ? ` · ${soma > global ? "passa" : "fica abaixo"} da meta global em ${brl(Math.abs(soma - global))}`
      : "";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Metas de {nomeMes(mes)} 2026</h2>
        {mesAnterior && temAnterior && (
          <Button variant="outline" onClick={copiarAnterior} disabled={salvando}>
            Copiar metas de {nomeMes(mesAnterior)}
          </Button>
        )}
      </div>

      <section>
        <h3 className={titulo}>Meta global do mês</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="meta-mrr" className="text-sm text-muted-foreground">
              MRR (R$)
            </label>
            <Input
              id="meta-mrr"
              value={mrr}
              onChange={(e) => {
                setMrr(e.target.value);
                setMensagem(null);
              }}
              inputMode="decimal"
              placeholder="0"
              className="h-10 text-right text-base tabular-nums"
            />
          </div>
          <div>
            <label htmlFor="meta-nr" className="text-sm text-muted-foreground">
              Não recorrente (R$)
            </label>
            <Input
              id="meta-nr"
              value={naoRec}
              onChange={(e) => {
                setNaoRec(e.target.value);
                setMensagem(null);
              }}
              inputMode="decimal"
              placeholder="0"
              className="h-10 text-right text-base tabular-nums"
            />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Aquisição total</p>
            <p className="flex h-10 items-center text-xl font-semibold tabular-nums">
              {brl((numMrr ?? 0) + (numNaoRec ?? 0))}
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-3xl">
        <h3 className={titulo}>Closers — metas em R$</h3>
        {closers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum closer ativo. Cadastre em Vendas → Configurações.</p>
        ) : (
          <div className="-mx-3 overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2 text-left font-semibold">Closer</th>
                  <th className="px-3 py-2 text-right font-semibold">MRR</th>
                  <th className="px-3 py-2 text-right font-semibold">Não recorrente</th>
                  <th className="px-3 py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {closers.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-2">{nomePessoa(p)}</td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end">{campo(chave(p.id, "mrr"), `Meta de MRR de ${p.nome}`)}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end">{campo(chave(p.id, "nr"), `Meta de não recorrente de ${p.nome}`)}</div>
                    </td>
                    <td className="px-3 py-2 text-right text-base font-semibold tabular-nums">
                      {brl(valor(chave(p.id, "mrr")) + valor(chave(p.id, "nr")))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border text-base font-semibold tabular-nums">
                  <td className="px-3 py-2">Soma</td>
                  <td className="px-3 py-2 text-right">{brl(somaMrr)}</td>
                  <td className="px-3 py-2 text-right">{brl(somaNr)}</td>
                  <td className="px-3 py-2 text-right">{brl(somaMrr + somaNr)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        {closers.length > 0 && (
          <div className="mt-2 space-y-0.5 text-sm tabular-nums text-muted-foreground">
            <p>MRR dos closers: {brl(somaMrr)}{diferenca(somaMrr, numMrr ?? 0)}</p>
            <p>Não recorrente dos closers: {brl(somaNr)}{diferenca(somaNr, numNaoRec ?? 0)}</p>
          </div>
        )}
      </section>

      <section className="max-w-xl">
        <h3 className={titulo}>SDRs — meta de reuniões realizadas</h3>
        {sdrs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum SDR ativo. Cadastre em Vendas → Configurações.</p>
        ) : (
          sdrs.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 border-b border-border/50 py-2 last:border-0">
              {nomePessoa(p)}
              <div className="flex items-center gap-2">
                {campo(chave(p.id, "reunioes"), `Meta de reuniões de ${p.nome}`)}
                <span className="w-16 text-sm text-muted-foreground">reuniões</span>
              </div>
            </div>
          ))
        )}
      </section>

      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-5">
        <Button onClick={salvar} disabled={salvando} className="h-11 px-6 text-base">
          {salvando ? "Salvando…" : "Salvar metas"}
        </Button>
        {mensagem && (
          <p className={mensagem.tipo === "erro" ? "text-sm text-destructive" : "text-sm text-[#3fd13f]"} role="status">
            {mensagem.texto}
          </p>
        )}
      </div>
    </div>
  );
}
