import Link from "next/link";
import { faixaDe, metaGlobal, rankingClosers, type PainelDados } from "@/lib/painel/calc";
import { brl, brlCurto, inteiro, pct } from "@/lib/painel/formato";
import { cn } from "@/lib/utils";
import { Barra, Bloco, SeloFaixa, td, th } from "./ui";

/** Realizado / meta com mini barra de progresso, para as colunas de MRR e não recorrente. */
function Parcial({ realizado, meta, p }: { realizado: number; meta: number; p: number | null }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="whitespace-nowrap">
        <span className="font-semibold">{brl(realizado)}</span>
        <span className="text-sm text-muted-foreground"> / {meta > 0 ? brlCurto(meta) : "—"}</span>
      </span>
      <div className="flex w-full max-w-[9rem] items-center gap-2">
        <span className="w-10 shrink-0 text-right text-sm">{pct(p)}</span>
        <Barra pct={p} faixa={faixaDe(p)} />
      </div>
    </div>
  );
}

export function RankingClosers({ dados, mes }: { dados: PainelDados; mes: string }) {
  const { linhas, somaMetas } = rankingClosers(dados, mes);
  const global = metaGlobal(dados, mes);
  const totalRealizado = linhas.reduce((s, l) => s + l.realizado, 0);
  const totalMrr = linhas.reduce((s, l) => s + l.mrr, 0);
  const totalNr = linhas.reduce((s, l) => s + l.naoRecorrente, 0);

  const avisos: string[] = [];
  const comparar = (rotulo: string, soma: number, meta: number | undefined) => {
    if (meta && Math.round(soma - meta) !== 0)
      avisos.push(`${rotulo}: as metas dos closers ${soma > meta ? "passam" : "ficam abaixo"} da meta global em ${brl(Math.abs(soma - meta))}.`);
  };
  comparar("MRR", somaMetas.mrr, global?.mrr);
  comparar("Não recorrente", somaMetas.naoRecorrente, global?.naoRecorrente);

  return (
    <Bloco titulo="Ranking de closers" extra="por aquisição total">
      {linhas.length === 0 ? (
        <p className="text-muted-foreground">Nenhum closer ativo ou com vendas neste mês.</p>
      ) : (
        <div className="-mx-3 overflow-x-auto">
          <table className="w-full min-w-[940px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className={th}>#</th>
                <th className={th}>Closer</th>
                <th className={cn(th, "text-right")}>Realizado / meta</th>
                <th className={cn(th, "w-40")}>% da meta</th>
                <th className={cn(th, "text-right")}>MRR</th>
                <th className={cn(th, "text-right")}>Não recorrente</th>
                <th className={cn(th, "text-right")}>Vendas</th>
                <th className={cn(th, "text-right")}>Ticket médio</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l, i) => {
                const faixa = faixaDe(l.pct);
                const bateu = faixa === "batida";
                return (
                  <tr key={l.id} className={cn("border-b border-border/50 last:border-0", bateu && "bg-[#0ca30c]/10")}>
                    <td className={cn(td, "font-semibold text-muted-foreground")}>{i + 1}</td>
                    <td className={cn(td, "whitespace-nowrap font-semibold")}>
                      {l.nome}
                      {bateu && (
                        <span className="ml-2 rounded border border-[#0ca30c]/50 px-1.5 py-0.5 text-xs font-medium text-[#3fd13f]">
                          Meta batida
                        </span>
                      )}
                    </td>
                    <td className={cn(td, "whitespace-nowrap text-right")}>
                      <span className="font-semibold">{brl(l.realizado)}</span>
                      <span className="text-sm text-muted-foreground"> / {l.meta === null ? "sem meta" : brlCurto(l.meta)}</span>
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-2">
                        <span className="w-12 shrink-0 text-right font-medium">{pct(l.pct)}</span>
                        <Barra pct={l.pct} faixa={faixa} />
                      </div>
                    </td>
                    <td className={td}>
                      <Parcial realizado={l.mrr} meta={l.metaMrr} p={l.pctMrr} />
                    </td>
                    <td className={td}>
                      <Parcial realizado={l.naoRecorrente} meta={l.metaNaoRecorrente} p={l.pctNaoRecorrente} />
                    </td>
                    <td className={cn(td, "text-right")}>{inteiro(l.qtd)}</td>
                    <td className={cn(td, "text-right")}>{l.ticket === null ? "—" : brl(l.ticket)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td className={td} />
                <td className={cn(td, "font-semibold")}>Soma</td>
                <td className={cn(td, "whitespace-nowrap text-right")}>
                  <span className="font-semibold">{brl(totalRealizado)}</span>
                  <span className="text-sm text-muted-foreground"> / {brlCurto(somaMetas.total)}</span>
                </td>
                <td className={td} />
                <td className={cn(td, "whitespace-nowrap text-right")}>
                  <span className="font-semibold">{brl(totalMrr)}</span>
                  <span className="text-sm text-muted-foreground"> / {brlCurto(somaMetas.mrr)}</span>
                </td>
                <td className={cn(td, "whitespace-nowrap text-right")}>
                  <span className="font-semibold">{brl(totalNr)}</span>
                  <span className="text-sm text-muted-foreground"> / {brlCurto(somaMetas.naoRecorrente)}</span>
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="mt-4 space-y-1 text-sm tabular-nums text-muted-foreground">
        <p>
          Metas dos closers — MRR <strong className="text-foreground">{brl(somaMetas.mrr)}</strong> · não recorrente{" "}
          <strong className="text-foreground">{brl(somaMetas.naoRecorrente)}</strong>. Meta global — MRR{" "}
          <strong className="text-foreground">{global?.mrr ? brl(global.mrr) : "não cadastrada"}</strong> · não recorrente{" "}
          <strong className="text-foreground">{global?.naoRecorrente ? brl(global.naoRecorrente) : "não cadastrada"}</strong>.
        </p>
        {avisos.map((a) => (
          <p key={a}>
            <SeloFaixa faixa="atencao" texto={a} />
          </p>
        ))}
        <p>
          <Link href={`/painel/metas?mes=${mes}`} className="underline-offset-4 hover:text-foreground hover:underline">
            Editar metas
          </Link>
        </p>
      </div>
    </Bloco>
  );
}
