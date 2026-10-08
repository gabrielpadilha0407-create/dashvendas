import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import {
  type MetaGlobalP,
  type MetaIndividualP,
  type MetaSemanalP,
  type MetaSemanalSdrP,
  type PainelDados,
  type PessoaP,
  type ReuniaoP,
  type VendaP,
} from "./calc";

export type Tabela = "pessoas" | "vendas" | "metas" | "metas_individuais" | "reunioes" | "metas_semanais" | "metas_semanais_sdr";

export type CargaPainel = {
  dados: PainelDados;
  erros: { tabela: Tabela; mensagem: string }[];
};

type Resposta = { data: unknown[] | null; error: { message: string } | null };

/** O Supabase devolve no máximo 1000 linhas por consulta; busca em páginas até acabar. */
async function paginar(buscar: (de: number, ate: number) => PromiseLike<Resposta>) {
  const linhas: Record<string, unknown>[] = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await buscar(de, de + 999);
    if (error) return { linhas, erro: error.message };
    const pagina = (data ?? []) as Record<string, unknown>[];
    linhas.push(...pagina);
    if (pagina.length < 1000) break;
  }
  return { linhas, erro: null as string | null };
}

function mensagemAmigavel(tabela: Tabela, erro: string): string {
  if (tabela === "metas_individuais" && /meta_mrr|meta_nao_recorrente/.test(erro)) {
    return "Faltam as colunas de meta MRR / não recorrente por closer. Rode o arquivo supabase/003_metas_closer_mrr_nr.sql no SQL Editor do Supabase.";
  }
  if (/does not exist|schema cache|could not find/i.test(erro) && tabela === "metas_semanais_sdr") {
    return "A tabela de metas semanais por SDR ainda não existe. Rode o arquivo supabase/005_metas_semanais_sdr.sql no SQL Editor do Supabase.";
  }
  if (/does not exist|schema cache|could not find/i.test(erro) && tabela === "metas_semanais") {
    return "A tabela de metas semanais ainda não existe. Rode o arquivo supabase/004_metas_semanais.sql no SQL Editor do Supabase.";
  }
  if (/does not exist|schema cache|could not find/i.test(erro) && (tabela === "metas_individuais" || tabela === "reunioes")) {
    return `A tabela ${tabela} ainda não existe. Rode o arquivo supabase/002_painel.sql no SQL Editor do Supabase.`;
  }
  return erro;
}

const num = (v: unknown) => Number(v ?? 0) || 0;

/** Dados do ano escolhido, mais dezembro do ano anterior (para "copiar metas do mês anterior" em janeiro). */
export async function getPainelDados(ano: number): Promise<CargaPainel> {
  const sb = supabaseServer();
  const inicio = `${ano - 1}-12-01`;
  const fim = `${ano}-12-31`;
  const mesInicio = `${ano - 1}-12`;
  const mesFim = `${ano}-12`;

  const [pessoas, vendas, metas, metasInd, reunioes, metasSem, metasSemSdr] = await Promise.all([
    paginar((de, ate) => sb.from("pessoas").select("id,nome,papel,ativo").order("nome").range(de, ate)),
    paginar((de, ate) =>
      sb
        .from("vendas")
        .select("id,data,tipo,valor,valor_setup,sdr_id,closer_id")
        .gte("data", inicio)
        .lte("data", fim)
        .order("id")
        .range(de, ate),
    ),
    paginar((de, ate) =>
      sb.from("metas").select("mes,meta_mrr,meta_nao_recorrente").gte("mes", mesInicio).lte("mes", mesFim).range(de, ate),
    ),
    paginar((de, ate) =>
      sb
        .from("metas_individuais")
        .select("id,mes,pessoa_id,meta_mrr,meta_nao_recorrente,meta_reunioes")
        .gte("mes", mesInicio)
        .lte("mes", mesFim)
        .order("id")
        .range(de, ate),
    ),
    paginar((de, ate) =>
      sb
        .from("reunioes")
        .select("id,data,empresa,sdr_id,closer_id,status")
        .gte("data", inicio)
        .lte("data", fim)
        .order("data", { ascending: false })
        .order("created_at", { ascending: false })
        .range(de, ate),
    ),
    paginar((de, ate) =>
      sb
        .from("metas_semanais")
        .select("id,mes,semana,meta_mrr,meta_nao_recorrente")
        .gte("mes", mesInicio)
        .lte("mes", mesFim)
        .order("id")
        .range(de, ate),
    ),
    paginar((de, ate) =>
      sb
        .from("metas_semanais_sdr")
        .select("id,mes,semana,pessoa_id,meta_reunioes")
        .gte("mes", mesInicio)
        .lte("mes", mesFim)
        .order("id")
        .range(de, ate),
    ),
  ]);

  const erros: CargaPainel["erros"] = [];
  const conferir = (tabela: Tabela, r: { erro: string | null }) => {
    if (r.erro) erros.push({ tabela, mensagem: mensagemAmigavel(tabela, r.erro) });
  };
  conferir("pessoas", pessoas);
  conferir("vendas", vendas);
  conferir("metas", metas);
  conferir("metas_individuais", metasInd);
  conferir("reunioes", reunioes);
  conferir("metas_semanais", metasSem);
  conferir("metas_semanais_sdr", metasSemSdr);

  return {
    erros,
    dados: {
      pessoas: pessoas.linhas.map((p) => ({
        id: String(p.id),
        nome: String(p.nome),
        papel: p.papel as PessoaP["papel"],
        ativo: Boolean(p.ativo),
      })),
      vendas: vendas.linhas.map((v) => ({
        data: String(v.data),
        tipo: v.tipo as VendaP["tipo"],
        valor: num(v.valor),
        valor_setup: v.valor_setup == null ? null : num(v.valor_setup),
        sdr_id: (v.sdr_id as string | null) ?? null,
        closer_id: (v.closer_id as string | null) ?? null,
      })),
      metas: metas.linhas.map(
        (m): MetaGlobalP => ({ mes: String(m.mes), meta_mrr: num(m.meta_mrr), meta_nao_recorrente: num(m.meta_nao_recorrente) }),
      ),
      metasIndividuais: metasInd.linhas.map(
        (m): MetaIndividualP => ({
          mes: String(m.mes),
          pessoa_id: String(m.pessoa_id),
          meta_mrr: num(m.meta_mrr),
          meta_nao_recorrente: num(m.meta_nao_recorrente),
          meta_reunioes: num(m.meta_reunioes),
        }),
      ),
      reunioes: reunioes.linhas.map(
        (r): ReuniaoP => ({
          id: String(r.id),
          data: String(r.data),
          empresa: String(r.empresa ?? ""),
          sdr_id: String(r.sdr_id),
          closer_id: (r.closer_id as string | null) ?? null,
          status: r.status as ReuniaoP["status"],
        }),
      ),
      metasSemanais: metasSem.linhas.map(
        (m): MetaSemanalP => ({
          mes: String(m.mes),
          semana: num(m.semana),
          meta_mrr: num(m.meta_mrr),
          meta_nao_recorrente: num(m.meta_nao_recorrente),
        }),
      ),
      metasSemanaisSdr: metasSemSdr.linhas.map(
        (m): MetaSemanalSdrP => ({
          mes: String(m.mes),
          semana: num(m.semana),
          pessoa_id: String(m.pessoa_id),
          meta_reunioes: num(m.meta_reunioes),
        }),
      ),
    },
  };
}
