import { getPainelDados } from "@/lib/painel/data";
import { hojeSP, resolverMes } from "@/lib/painel/calc";
import { FormReuniao, ListaReunioes } from "@/components/painel/reunioes";
import { SeletorMes } from "@/components/painel/seletor-mes";
import { Bloco } from "@/components/painel/ui";

export const dynamic = "force-dynamic";

export default async function ReunioesPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const params = await searchParams;
  const hoje = hojeSP();
  const mes = resolverMes(params.mes, hoje);
  const { dados, erros } = await getPainelDados();

  const bloqueantes = erros.filter((e) => e.tabela === "pessoas" || e.tabela === "reunioes");
  if (bloqueantes.length > 0) {
    return (
      <div role="alert" className="rounded-lg border border-destructive/60 bg-destructive/10 px-4 py-3 text-sm">
        <p className="font-semibold">Não foi possível abrir as reuniões:</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          {bloqueantes.map((e) => (
            <li key={e.tabela}>
              <strong>{e.tabela}:</strong> {e.mensagem}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const nomes = Object.fromEntries(dados.pessoas.map((p) => [p.id, p.nome]));
  const sdrs = dados.pessoas.filter((p) => p.papel === "SDR" && p.ativo).map((p) => ({ id: p.id, nome: p.nome }));
  const closers = dados.pessoas.filter((p) => p.papel === "Closer" && p.ativo).map((p) => ({ id: p.id, nome: p.nome }));
  const doMes = dados.reunioes.filter((r) => r.data.startsWith(mes));
  // Lançamentos novos usam hoje se o mês selecionado for o atual; senão o 1º dia do mês selecionado
  const dataPadrao = hoje.startsWith(mes) ? hoje : `${mes}-01`;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SeletorMes mes={mes} />
      </div>
      <Bloco titulo="Lançar reunião">
        <FormReuniao sdrs={sdrs} closers={closers} dataPadrao={dataPadrao} />
      </Bloco>
      <Bloco titulo="Reuniões do mês" extra={`${doMes.length} ${doMes.length === 1 ? "lançamento" : "lançamentos"}`}>
        <ListaReunioes reunioes={doMes} nomes={nomes} />
      </Bloco>
    </>
  );
}
