"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { salvarMetas, type MetasDoMes } from "@/app/painel/actions";
import { parseValor } from "@/lib/painel/calc";
import { brl, nomeMes } from "@/lib/painel/formato";

export type PessoaMeta = {
  id: string;
  nome: string;
  papel: "Closer" | "SDR";
  ativo: boolean;
  metaValor: number | null;
  metaReunioes: number | null;
  anteriorValor: number | null;
  anteriorReunioes: number | null;
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

const texto = (n: number | null) => (n === null || n === 0 ? "" : String(n));

export function EditorMetas(props: Props) {
  const { mes, mesAnterior, pessoas } = props;
  const [mrr, setMrr] = useState(texto(props.metaMrr));
  const [naoRec, setNaoRec] = useState(texto(props.metaNaoRecorrente));
  const [valores, setValores] = useState<Record<string, string>>(() =>
    Object.fromEntries(pessoas.map((p) => [p.id, texto(p.papel === "Closer" ? p.metaValor : p.metaReunioes)])),
  );
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [salvando, iniciar] = useTransition();

  const closers = pessoas.filter((p) => p.papel === "Closer");
  const sdrs = pessoas.filter((p) => p.papel === "SDR");

  const numMrr = parseValor(mrr);
  const numNaoRec = parseValor(naoRec);
  const aquisicao = (numMrr ?? 0) + (numNaoRec ?? 0);
  const somaClosers = closers.reduce((s, p) => s + (parseValor(valores[p.id] ?? "") ?? 0), 0);

  const alterar = (id: string, v: string) => {
    setValores((atual) => ({ ...atual, [id]: v }));
    setMensagem(null);
  };

  const temAnterior =
    props.anteriorMrr !== null ||
    pessoas.some((p) => (p.papel === "Closer" ? p.anteriorValor : p.anteriorReunioes) !== null);

  // Copia só o que existe no mês anterior; quem não tinha meta lá mantém o valor atual
  function copiarAnterior() {
    if (props.anteriorMrr !== null) setMrr(texto(props.anteriorMrr));
    if (props.anteriorNaoRecorrente !== null) setNaoRec(texto(props.anteriorNaoRecorrente));
    setValores((atual) =>
      Object.fromEntries(
        pessoas.map((p) => {
          const anterior = p.papel === "Closer" ? p.anteriorValor : p.anteriorReunioes;
          return [p.id, anterior ? texto(anterior) : (atual[p.id] ?? "")];
        }),
      ),
    );
    setMensagem({ tipo: "ok", texto: `Valores de ${nomeMes(mesAnterior ?? mes)} copiados. Confira e clique em Salvar.` });
  }

  function salvar() {
    if (numMrr === null || numNaoRec === null) {
      setMensagem({ tipo: "erro", texto: "Meta global com valor inválido. Use só números, ex.: 25000." });
      return;
    }
    const individuais: MetasDoMes["individuais"] = [];
    for (const p of pessoas) {
      const bruto = valores[p.id] ?? "";
      const n = parseValor(bruto);
      if (n === null || (p.papel === "SDR" && !Number.isInteger(n))) {
        setMensagem({ tipo: "erro", texto: `Valor inválido para ${p.nome}: "${bruto}".` });
        return;
      }
      individuais.push({
        pessoaId: p.id,
        metaValor: p.papel === "Closer" ? n : 0,
        metaReunioes: p.papel === "SDR" ? n : 0,
      });
    }
    iniciar(async () => {
      const r = await salvarMetas({ mes, metaMrr: numMrr, metaNaoRecorrente: numNaoRec, individuais });
      setMensagem(
        r.error ? { tipo: "erro", texto: r.error } : { tipo: "ok", texto: `Metas de ${nomeMes(mes)} salvas.` },
      );
    });
  }

  const linhaPessoa = (p: PessoaMeta, sufixo: string, placeholder: string) => (
    <div key={p.id} className="flex items-center justify-between gap-3 border-b border-border/50 py-2 last:border-0">
      <label htmlFor={`meta-${p.id}`} className="min-w-0 flex-1 truncate text-base font-medium">
        {p.nome}
        {!p.ativo && <span className="ml-2 text-xs text-muted-foreground">(inativo)</span>}
      </label>
      <div className="flex items-center gap-2">
        <Input
          id={`meta-${p.id}`}
          value={valores[p.id] ?? ""}
          onChange={(e) => alterar(p.id, e.target.value)}
          inputMode="decimal"
          placeholder={placeholder}
          className="h-10 w-36 text-right text-base tabular-nums"
        />
        <span className="w-16 text-sm text-muted-foreground">{sufixo}</span>
      </div>
    </div>
  );

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
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Meta global do mês</h3>
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
            <p className="flex h-10 items-center text-xl font-semibold tabular-nums">{brl(aquisicao)}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Closers — meta de aquisição (R$)
          </h3>
          {closers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum closer ativo. Cadastre em Vendas → Configurações.</p>
          ) : (
            closers.map((p) => linhaPessoa(p, "R$", "0"))
          )}
          <p className="mt-3 text-sm tabular-nums text-muted-foreground">
            Soma das metas dos closers: <strong className="text-foreground">{brl(somaClosers)}</strong>
            {aquisicao > 0 && Math.round(somaClosers - aquisicao) !== 0 && (
              <span>
                {" "}
                · {somaClosers > aquisicao ? "passa" : "fica abaixo"} da aquisição total em {brl(Math.abs(somaClosers - aquisicao))}
              </span>
            )}
          </p>
        </section>

        <section>
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            SDRs — meta de reuniões realizadas
          </h3>
          {sdrs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum SDR ativo. Cadastre em Vendas → Configurações.</p>
          ) : (
            sdrs.map((p) => linhaPessoa(p, "reuniões", "0"))
          )}
        </section>
      </div>

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
