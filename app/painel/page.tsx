import Link from "next/link";
import { getPainelDados, type Tabela } from "@/lib/painel/data";
import { anoDe, anosDisponiveis, hojeSP, metaGlobal, pendencias, resolverMes, resumir } from "@/lib/painel/calc";
import { Atualizar } from "@/components/painel/atualizar";
import { Comemoracao, type MetaComemoravel } from "@/components/painel/comemoracao";
import { CartoesMetas } from "@/components/painel/cartoes-metas";
import { SemanaAtual } from "@/components/painel/semana-atual";
import { RankingClosers } from "@/components/painel/ranking-closers";
import { RankingSdrs } from "@/components/painel/ranking-sdrs";
import { SeletorMes } from "@/components/painel/seletor-mes";
import { Bloco, ErroBloco } from "@/components/painel/ui";
import { VisaoAno } from "@/components/painel/visao-ano";

export const dynamic = "force-dynamic";

export default async function PainelPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; comemorar?: string }>;
}) {
  const params = await searchParams;
  const hoje = hojeSP();
  const mesAtual = hoje.slice(0, 7);
  const mes = resolverMes(params.mes, hoje);
  const ano = anoDe(mes);
  const { dados, erros } = await getPainelDados(ano);
  const geradoEm = new Date().toISOString();

  const falhou = new Set<Tabela>(erros.map((e) => e.tabela));
  const faltando = (...tabelas: Tabela[]) => tabelas.filter((t) => falhou.has(t));
  const pend = pendencias(dados, mes);

  // Comemoração: só no mês corrente e só com vendas e metas lidas sem erro
  const global = metaGlobal(dados, mes);
  const feito = resumir(dados.vendas.filter((v) => v.data.startsWith(mes)));
  const bateu = (realizado: number, meta: number | undefined) => !!meta && meta > 0 && realizado >= meta;
  const podeComemorar = mes === mesAtual && !falhou.has("vendas") && !falhou.has("metas");
  const metasComemoraveis: MetaComemoravel[] = podeComemorar
    ? [
        { chave: "aquisicao", rotulo: "aquisição total", batida: bateu(feito.aquisicao, global?.aquisicao) },
        { chave: "mrr", rotulo: "MRR", batida: bateu(feito.mrr, global?.mrr) },
        { chave: "nao_recorrente", rotulo: "não recorrente", batida: bateu(feito.naoRecorrente, global?.naoRecorrente) },
      ]
    : [];

  const blocoOuErro = (tabelas: Tabela[], titulo: string, conteudo: React.ReactNode) => {
    const f = faltando(...tabelas);
    return f.length > 0 ? (
      <Bloco titulo={titulo}>
        <ErroBloco tabelas={f} />
      </Bloco>
    ) : (
      conteudo
    );
  };

  return (
    <>
      <Comemoracao mes={mes} metas={metasComemoraveis} forcar={params.comemorar === "1"} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SeletorMes mes={mes} anos={anosDisponiveis(hoje)} />
        </div>
        <Atualizar geradoEm={geradoEm} />
      </div>

      {erros.length > 0 && (
        <div role="alert" className="rounded-lg border border-destructive/60 bg-destructive/10 px-4 py-3 text-sm">
          <p className="font-semibold">Alguns dados não carregaram:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {erros.map((e) => (
              <li key={e.tabela}>
                <strong>{e.tabela}:</strong> {e.mensagem}
              </li>
            ))}
          </ul>
        </div>
      )}

      {blocoOuErro(["vendas", "metas"], "Metas do mês", <CartoesMetas dados={dados} mes={mes} hoje={hoje} />)}

      {mes === mesAtual && blocoOuErro(["vendas", "metas_semanais"], "Meta da semana", <SemanaAtual dados={dados} mes={mes} hoje={hoje} />)}

      <div className="grid gap-6 min-[2400px]:grid-cols-[11fr_9fr]">
        {blocoOuErro(
          ["pessoas", "vendas", "metas_individuais"],
          "Ranking de closers",
          <RankingClosers dados={dados} mes={mes} hoje={hoje} />,
        )}
        {blocoOuErro(
          ["pessoas", "vendas", "metas_individuais", "reunioes"],
          "Ranking de SDRs",
          <RankingSdrs dados={dados} mes={mes} hoje={hoje} />,
        )}
      </div>

      {blocoOuErro(["vendas", "metas"], "Visão do ano", <VisaoAno dados={dados} mesAtual={mesAtual} mesSelecionado={mes} />)}

      {falhou.size === 0 && pend.length > 0 && (
        <Bloco titulo="Pendências do mês">
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {pend.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <Link href={`/painel/metas?mes=${mes}`} className="mt-3 inline-block text-sm underline-offset-4 hover:underline">
            Cadastrar metas
          </Link>
        </Bloco>
      )}
    </>
  );
}
