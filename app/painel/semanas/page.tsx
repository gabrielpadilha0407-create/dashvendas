import { getPainelDados } from "@/lib/painel/data";
import {
  anoDe,
  anosDisponiveis,
  diasUteisEntre,
  hojeSP,
  metaGlobal,
  resolverMes,
  visaoSemanas,
  visaoSemanasSdr,
} from "@/lib/painel/calc";
import { EditorSemanas, type SemanaEditavel } from "@/components/painel/editor-semanas";
import { EditorSemanasSdr } from "@/components/painel/editor-semanas-sdr";
import { SeletorMes } from "@/components/painel/seletor-mes";
import { Bloco, ErroBloco } from "@/components/painel/ui";

export const dynamic = "force-dynamic";

export default async function SemanasPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const params = await searchParams;
  const hoje = hojeSP();
  const anos = anosDisponiveis(hoje);
  const mes = resolverMes(params.mes, hoje);
  const { dados, erros } = await getPainelDados(anoDe(mes));

  const bloqueantes = erros.filter((e) => ["vendas", "metas", "metas_semanais"].includes(e.tabela));
  if (bloqueantes.length > 0) {
    return (
      <>
        <SeletorMes mes={mes} anos={anos} />
        <div role="alert" className="rounded-lg border border-destructive/60 bg-destructive/10 px-4 py-3 text-sm">
          <p className="font-semibold">Não foi possível abrir as metas semanais:</p>
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

  const semanas: SemanaEditavel[] = visaoSemanas(dados, mes, hoje).map((s) => ({
    numero: s.numero,
    inicio: s.inicio,
    fim: s.fim,
    primeiroUtil: s.primeiroUtil,
    ultimoUtil: s.ultimoUtil,
    diasUteis: s.diasUteis,
    diasRestantes: diasUteisEntre(s.inicio, s.fim, hoje),
    status: s.status,
    metaMrr: s.metaMrrPlanejada,
    metaNaoRecorrente: s.metaNaoRecorrentePlanejada,
    realizadoMrr: s.realizado.mrr,
    realizadoNaoRecorrente: s.realizado.naoRecorrente,
  }));
  const global = metaGlobal(dados, mes);
  const falhasSdr = erros.filter((e) => ["pessoas", "reunioes", "metas_semanais_sdr"].includes(e.tabela));
  const sdr = visaoSemanasSdr(dados, mes, hoje);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SeletorMes mes={mes} anos={anos} />
        <p className="text-sm text-muted-foreground">Vendas: metas do time inteiro. Reuniões: meta por SDR.</p>
      </div>
      <Bloco>
        <EditorSemanas
          key={mes}
          mes={mes}
          semanas={semanas}
          metaMesMrr={global?.mrr ?? 0}
          metaMesNaoRecorrente={global?.naoRecorrente ?? 0}
        />
      </Bloco>
      <Bloco>
        {falhasSdr.length > 0 ? (
          <>
            <ErroBloco tabelas={falhasSdr.map((e) => e.tabela)} />
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
              {falhasSdr.map((e) => (
                <li key={e.tabela}>{e.mensagem}</li>
              ))}
            </ul>
          </>
        ) : (
          <EditorSemanasSdr
            key={`sdr-${mes}`}
            mes={mes}
            semanas={sdr.semanas.map((s) => ({
              numero: s.numero,
              primeiroUtil: s.primeiroUtil,
              ultimoUtil: s.ultimoUtil,
              status: s.status,
              diasRestantes: s.diasRestantes,
            }))}
            sdrs={sdr.linhas}
          />
        )}
      </Bloco>
    </>
  );
}
