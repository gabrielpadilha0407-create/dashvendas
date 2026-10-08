"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { salvarMetasSemanaisSdr, type MetasSemanaisSdrDoMes } from "@/app/painel/actions";
import { parseValor, repasseSimples, type StatusSemana } from "@/lib/painel/calc";
import { dataCurta, inteiro, nomeMes, reunioesPorDia } from "@/lib/painel/formato";
import { cn } from "@/lib/utils";

export type SemanaSdrColuna = {
  numero: number;
  primeiroUtil: string;
  ultimoUtil: string;
  status: StatusSemana;
  diasRestantes: number;
};

export type SdrSemanas = {
  id: string;
  nome: string;
  ativo: boolean;
  porSemana: { metaPlanejada: number; realizadas: number }[];
};

type Props = { mes: string; semanas: SemanaSdrColuna[]; sdrs: SdrSemanas[] };

const chave = (id: string, semana: number) => `${id}:${semana}`;

/** Meta semanal de reuniões realizadas por SDR, com repasse do que faltou para a semana seguinte. */
export function EditorSemanasSdr({ mes, semanas, sdrs }: Props) {
  const [campos, setCampos] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      sdrs.flatMap((p) => semanas.map((s, i) => [chave(p.id, s.numero), p.porSemana[i].metaPlanejada ? String(p.porSemana[i].metaPlanejada) : ""])),
    ),
  );
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [salvando, iniciar] = useTransition();

  const valor = (k: string) => parseValor(campos[k] ?? "") ?? 0;

  function salvar() {
    const itens: MetasSemanaisSdrDoMes["itens"] = [];
    for (const p of sdrs) {
      for (const s of semanas) {
        const bruto = campos[chave(p.id, s.numero)] ?? "";
        const n = parseValor(bruto);
        if (n === null || !Number.isInteger(n)) {
          setMensagem({ tipo: "erro", texto: `Valor inválido para ${p.nome} na semana ${s.numero}: "${bruto}". Use números inteiros.` });
          return;
        }
        itens.push({ pessoaId: p.id, semana: s.numero, metaReunioes: n });
      }
    }
    iniciar(async () => {
      const r = await salvarMetasSemanaisSdr({ mes, itens });
      setMensagem(r.error ? { tipo: "erro", texto: r.error } : { tipo: "ok", texto: `Metas de reuniões de ${nomeMes(mes)} salvas.` });
    });
  }

  if (sdrs.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum SDR ativo. Cadastre em Vendas → Configurações.</p>;
  }

  // Totais do time por semana (meta já com repasse de cada SDR)
  const totais = semanas.map(() => ({ meta: 0, realizadas: 0 }));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Reuniões realizadas por SDR — {nomeMes(mes)} {mes.slice(0, 4)}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Meta semanal de reuniões com status Realizada, contadas na semana em que aconteceram. O que um SDR não bater numa
          semana encerrada passa inteiro para a semana seguinte dele. Os campos guardam a meta planejada; embaixo aparece
          realizadas / meta já com o repasse.
        </p>
      </div>

      <div className="-mx-3 overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: 220 + semanas.length * 150 }}>
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">SDR</th>
              {semanas.map((s) => (
                <th
                  key={s.numero}
                  className={cn("px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground", s.status === "atual" && "bg-primary/10")}
                >
                  <div>
                    Semana {s.numero}
                    {s.status === "atual" && <span className="ml-1 normal-case">(atual)</span>}
                  </div>
                  <div className="font-normal normal-case tabular-nums">
                    {dataCurta(s.primeiroUtil)} a {dataCurta(s.ultimoUtil)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sdrs.map((p) => {
              const ajustes = repasseSimples(
                semanas.map((s, i) => ({ meta: valor(chave(p.id, s.numero)), realizado: p.porSemana[i].realizadas, status: s.status })),
              );
              return (
                <tr key={p.id} className="border-b border-border/50 last:border-0">
                  <td className="px-3 py-3 text-left font-semibold">
                    <span className="whitespace-nowrap">{p.nome}</span>
                    {!p.ativo && <span className="ml-2 text-xs font-normal text-muted-foreground">(inativo)</span>}
                  </td>
                  {semanas.map((s, i) => {
                    const feitas = p.porSemana[i].realizadas;
                    const { meta, repasse } = ajustes[i];
                    totais[i].meta += meta;
                    totais[i].realizadas += feitas;
                    const falta = Math.max(0, meta - feitas);
                    const futura = s.status === "futura";
                    return (
                      <td key={s.numero} className={cn("px-3 py-3 text-center align-top", s.status === "atual" && "bg-primary/10")}>
                        <Input
                          aria-label={`Meta de reuniões de ${p.nome} na semana ${s.numero}`}
                          value={campos[chave(p.id, s.numero)] ?? ""}
                          onChange={(e) => {
                            setCampos((atual) => ({ ...atual, [chave(p.id, s.numero)]: e.target.value }));
                            setMensagem(null);
                          }}
                          inputMode="numeric"
                          placeholder="0"
                          className="mx-auto h-9 w-20 text-center text-base tabular-nums"
                        />
                        <div className="mt-1.5 text-sm tabular-nums">
                          {futura ? (
                            <span className="text-muted-foreground">meta {meta > 0 ? inteiro(meta) : "—"}</span>
                          ) : (
                            <>
                              <span className="font-semibold">{inteiro(feitas)}</span>
                              <span className="text-muted-foreground"> / {meta > 0 ? inteiro(meta) : "—"}</span>
                            </>
                          )}
                        </div>
                        {repasse > 0 && <div className="text-xs text-[#fab219]">+{inteiro(repasse)} da semana anterior</div>}
                        {!futura && meta > 0 && (
                          <div className="text-xs">
                            {falta === 0 ? (
                              <span className="text-[#3fd13f]">Meta batida</span>
                            ) : s.diasRestantes > 0 ? (
                              <span className="text-muted-foreground">
                                faltam {inteiro(falta)} · {reunioesPorDia(falta / s.diasRestantes)}
                              </span>
                            ) : (
                              <span className="text-[#d03b3b]">ficaram {inteiro(falta)}</span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border">
              <td className="px-3 py-3 text-left font-semibold">Time</td>
              {semanas.map((s, i) => (
                <td key={s.numero} className={cn("px-3 py-3 text-center text-sm tabular-nums", s.status === "atual" && "bg-primary/10")}>
                  {s.status === "futura" ? (
                    <span className="text-muted-foreground">meta {totais[i].meta > 0 ? inteiro(totais[i].meta) : "—"}</span>
                  ) : (
                    <>
                      <span className="font-semibold">{inteiro(totais[i].realizadas)}</span>
                      <span className="text-muted-foreground"> / {totais[i].meta > 0 ? inteiro(totais[i].meta) : "—"}</span>
                    </>
                  )}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-5">
        <Button onClick={salvar} disabled={salvando} className="h-11 px-6 text-base">
          {salvando ? "Salvando…" : "Salvar metas de reuniões"}
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
