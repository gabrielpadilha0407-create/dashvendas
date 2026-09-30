import Link from "next/link";
import { faixaDe, metaGlobal, rankingClosers, type PainelDados } from "@/lib/painel/calc";
import { brl, inteiro, pct } from "@/lib/painel/formato";
import { cn } from "@/lib/utils";
import { Barra, Bloco, SeloFaixa, td, th } from "./ui";

export function RankingClosers({ dados, mes }: { dados: PainelDados; mes: string }) {
  const { linhas, somaMetas } = rankingClosers(dados, mes);
  const global = metaGlobal(dados, mes)?.aquisicao ?? 0;
  const totalRealizado = linhas.reduce((s, l) => s + l.realizado, 0);
  const diferenca = somaMetas - global;

  return (
    <Bloco titulo="Ranking de closers" extra="por aquisição total">
      {linhas.length === 0 ? (
        <p className="text-muted-foreground">Nenhum closer ativo ou com vendas neste mês.</p>
      ) : (
        <div className="-mx-3 overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className={th}>#</th>
                <th className={th}>Closer</th>
                <th className={cn(th, "text-right")}>Meta</th>
                <th className={cn(th, "text-right")}>Realizado</th>
                <th className={cn(th, "w-44")}>% da meta</th>
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
                    <td className={cn(td, "text-right text-muted-foreground")}>{l.meta === null ? "sem meta" : brl(l.meta)}</td>
                    <td className={cn(td, "text-right font-semibold")}>{brl(l.realizado)}</td>
                    <td className={td}>
                      <div className="flex items-center gap-2">
                        <span className="w-12 shrink-0 text-right font-medium">{pct(l.pct)}</span>
                        <Barra pct={l.pct} faixa={faixa} />
                      </div>
                    </td>
                    <td className={cn(td, "text-right")}>{brl(l.mrr)}</td>
                    <td className={cn(td, "text-right")}>{brl(l.naoRecorrente)}</td>
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
                <td className={cn(td, "text-right font-semibold")}>{brl(somaMetas)}</td>
                <td className={cn(td, "text-right font-semibold")}>{brl(totalRealizado)}</td>
                <td colSpan={5} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="mt-4 space-y-1 text-sm tabular-nums text-muted-foreground">
        <p>
          Soma das metas individuais: <strong className="text-foreground">{brl(somaMetas)}</strong> · Meta de aquisição
          do mês: <strong className="text-foreground">{global > 0 ? brl(global) : "não cadastrada"}</strong>
        </p>
        {global > 0 && Math.round(diferenca) !== 0 && (
          <p>
            <SeloFaixa
              faixa="atencao"
              texto={`As metas individuais ${diferenca > 0 ? "passam" : "ficam abaixo"} da meta global em ${brl(Math.abs(diferenca))}.`}
            />
          </p>
        )}
        <p>
          <Link href={`/painel/metas?mes=${mes}`} className="underline-offset-4 hover:text-foreground hover:underline">
            Editar metas
          </Link>
        </p>
      </div>
    </Bloco>
  );
}
