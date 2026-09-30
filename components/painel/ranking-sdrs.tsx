import Link from "next/link";
import { faixaDe, rankingSdrs, type PainelDados } from "@/lib/painel/calc";
import { brl, inteiro, pct } from "@/lib/painel/formato";
import { cn } from "@/lib/utils";
import { Barra, Bloco, td, th } from "./ui";

export function RankingSdrs({ dados, mes }: { dados: PainelDados; mes: string }) {
  const { linhas, semSdr, somaMetas, totalRealizadas } = rankingSdrs(dados, mes);

  return (
    <Bloco titulo="Ranking de SDRs" extra="por receita originada">
      {linhas.length === 0 ? (
        <p className="text-muted-foreground">Nenhum SDR ativo ou com vendas neste mês.</p>
      ) : (
        <div className="-mx-3 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className={th}>#</th>
                <th className={th}>SDR</th>
                <th className={cn(th, "text-right")}>Reuniões / meta</th>
                <th className={cn(th, "w-40")}>% da meta</th>
                <th className={cn(th, "text-right")}>Vendas</th>
                <th className={cn(th, "text-right")}>Receita originada</th>
                <th className={cn(th, "text-right")}>Conversão</th>
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
                      <span className="font-semibold">{inteiro(l.realizadas)}</span>
                      <span className="text-muted-foreground"> / {l.metaReunioes === null ? "—" : inteiro(l.metaReunioes)}</span>
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-2">
                        <span className="w-12 shrink-0 text-right font-medium">{pct(l.pct)}</span>
                        <Barra pct={l.pct} faixa={faixa} />
                      </div>
                    </td>
                    <td className={cn(td, "text-right")}>{inteiro(l.vendas)}</td>
                    <td className={cn(td, "text-right font-semibold")}>{brl(l.receita)}</td>
                    <td className={cn(td, "text-right")}>{pct(l.conversao)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td className={td} />
                <td className={cn(td, "font-semibold")}>Soma</td>
                <td className={cn(td, "text-right font-semibold")}>
                  {inteiro(totalRealizadas)} <span className="font-normal text-muted-foreground">/ {inteiro(somaMetas)}</span>
                </td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      <div className="mt-4 space-y-1 text-sm tabular-nums text-muted-foreground">
        <p>Meta do SDR = reuniões realizadas no mês. Conversão = vendas originadas ÷ reuniões realizadas.</p>
        {semSdr.qtd > 0 && (
          <p>
            {semSdr.qtd} {semSdr.qtd === 1 ? "venda" : "vendas"} sem SDR (sem pré-venda): {brl(semSdr.aquisicao)}
          </p>
        )}
        <p>
          <Link href={`/painel/reunioes?mes=${mes}`} className="underline-offset-4 hover:text-foreground hover:underline">
            Lançar reuniões
          </Link>
        </p>
      </div>
    </Bloco>
  );
}
