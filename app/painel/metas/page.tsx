import { getPainelDados } from "@/lib/painel/data";
import { MESES, hojeSP, resolverMes } from "@/lib/painel/calc";
import { EditorMetas, type PessoaMeta } from "@/components/painel/editor-metas";
import { SeletorMes } from "@/components/painel/seletor-mes";
import { Bloco } from "@/components/painel/ui";

export const dynamic = "force-dynamic";

export default async function MetasPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const params = await searchParams;
  const mes = resolverMes(params.mes, hojeSP());
  const idx = MESES.indexOf(mes);
  const mesAnterior = idx > 0 ? MESES[idx - 1] : null;
  const { dados, erros } = await getPainelDados();

  const bloqueantes = erros.filter((e) => ["pessoas", "metas", "metas_individuais"].includes(e.tabela));
  if (bloqueantes.length > 0) {
    return (
      <>
        <SeletorMes mes={mes} />
        <div role="alert" className="rounded-lg border border-destructive/60 bg-destructive/10 px-4 py-3 text-sm">
          <p className="font-semibold">Não foi possível abrir as metas:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {bloqueantes.map((e) => (
              <li key={e.tabela}>
                <strong>{e.tabela}:</strong> {e.mensagem}
              </li>
            ))}
          </ul>
        </div>
      </>
    );
  }

  const doMes = (m: string) => new Map(dados.metasIndividuais.filter((x) => x.mes === m).map((x) => [x.pessoa_id, x]));
  const atuais = doMes(mes);
  const anteriores = doMes(mesAnterior ?? "");

  // Ativos, mais inativos que já tenham meta neste mês (para não sumir com um valor salvo)
  const pessoas: PessoaMeta[] = dados.pessoas
    .filter((p) => p.papel !== "Operacional" && (p.ativo || atuais.has(p.id)))
    .map((p) => ({
      id: p.id,
      nome: p.nome,
      papel: p.papel as "Closer" | "SDR",
      ativo: p.ativo,
      metaValor: atuais.get(p.id)?.meta_valor ?? null,
      metaReunioes: atuais.get(p.id)?.meta_reunioes ?? null,
      anteriorValor: anteriores.get(p.id)?.meta_valor ?? null,
      anteriorReunioes: anteriores.get(p.id)?.meta_reunioes ?? null,
    }));

  const global = dados.metas.find((m) => m.mes === mes);
  const globalAnterior = mesAnterior ? dados.metas.find((m) => m.mes === mesAnterior) : undefined;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SeletorMes mes={mes} />
        <p className="text-sm text-muted-foreground">As alterações aparecem no painel assim que você salvar.</p>
      </div>
      <Bloco>
        <EditorMetas
          key={mes}
          mes={mes}
          mesAnterior={mesAnterior}
          metaMrr={global?.meta_mrr ?? null}
          metaNaoRecorrente={global?.meta_nao_recorrente ?? null}
          anteriorMrr={globalAnterior?.meta_mrr ?? null}
          anteriorNaoRecorrente={globalAnterior?.meta_nao_recorrente ?? null}
          pessoas={pessoas}
        />
      </Bloco>
    </>
  );
}
