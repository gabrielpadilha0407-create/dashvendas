import "server-only";
import { supabaseServer } from "./supabase/server";
import { monthRange } from "./utils";
import type { Meta, Pessoa, VendaComPessoas, RankingItem, TipoVenda } from "./types";

export async function ensureMonthMeta(mes: string): Promise<void> {
  const supabase = supabaseServer();
  await supabase
    .from("metas")
    .upsert(
      { mes, meta_mrr: 0, meta_nao_recorrente: 0, meta_monetizacao: 0 },
      { onConflict: "mes", ignoreDuplicates: true },
    );
}

export async function getMeta(mes: string): Promise<Meta> {
  await ensureMonthMeta(mes);
  const supabase = supabaseServer();
  const { data, error } = await supabase.from("metas").select("*").eq("mes", mes).single();
  if (error) throw error;
  return data as Meta;
}

export async function getPessoas(): Promise<Pessoa[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase.from("pessoas").select("*").order("nome");
  if (error) throw error;
  return data as Pessoa[];
}

export async function getVendasDoMes(mes: string): Promise<VendaComPessoas[]> {
  const supabase = supabaseServer();
  const { start, end } = monthRange(mes);
  const { data, error } = await supabase
    .from("vendas")
    .select(
      "*, sdr:pessoas!vendas_sdr_id_fkey(id,nome), closer:pessoas!vendas_closer_id_fkey(id,nome), operacional:pessoas!vendas_operacional_id_fkey(id,nome)",
    )
    .gte("data", start)
    .lte("data", end)
    .order("data", { ascending: false });
  if (error) throw error;
  return data as unknown as VendaComPessoas[];
}

interface SaleAgg {
  data: string;
  tipo: TipoVenda;
  valor: number;
  valor_setup: number | null;
  sdr_id: string | null;
  closer_id: string | null;
  operacional_id: string | null;
}

export interface Rankings {
  closers: { mes: RankingItem[]; total: RankingItem[] };
  sdrs: { mes: RankingItem[]; total: RankingItem[] };
  operacional: { mes: RankingItem[]; total: RankingItem[] };
}

export async function getRankingData(mes: string): Promise<Rankings> {
  const supabase = supabaseServer();
  const { data: vendas, error } = await supabase
    .from("vendas")
    .select("data, tipo, valor, valor_setup, sdr_id, closer_id, operacional_id");
  if (error) throw error;

  const pessoas = await getPessoas();
  const { start, end } = monthRange(mes);
  const isInMonth = (data: string) => data >= start && data <= end;
  const all = vendas as SaleAgg[];

  function rank(key: "sdr_id" | "closer_id" | "operacional_id", papel: Pessoa["papel"]) {
    const build = (rows: SaleAgg[]): RankingItem[] => {
      const map = new Map<string, { total: number; totalMrr: number }>();
      for (const v of rows) {
        const pessoaId = v[key];
        if (!pessoaId) continue;
        const entry = map.get(pessoaId) ?? { total: 0, totalMrr: 0 };
        entry.total += v.valor + (v.valor_setup ?? 0);
        if (v.tipo === "MRR") entry.totalMrr += v.valor;
        map.set(pessoaId, entry);
      }
      return pessoas
        .filter((p) => p.papel === papel && map.has(p.id))
        .map((p) => ({ pessoa_id: p.id, nome: p.nome, ...map.get(p.id)! }))
        .sort((a, b) => b.total - a.total);
    };
    return {
      mes: build(all.filter((v) => isInMonth(v.data))),
      total: build(all),
    };
  }

  return {
    closers: rank("closer_id", "Closer"),
    sdrs: rank("sdr_id", "SDR"),
    operacional: rank("operacional_id", "Operacional"),
  };
}
