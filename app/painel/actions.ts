"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { MESES, type StatusReuniao } from "@/lib/painel/calc";

export type ResultadoAcao = { error: string | null; enviadoEm?: number };

const STATUS: StatusReuniao[] = ["realizada", "no_show", "remarcada"];

function atualizarTelas() {
  revalidatePath("/painel", "layout");
}

// ---------- Metas

export type MetasDoMes = {
  mes: string;
  metaMrr: number;
  metaNaoRecorrente: number;
  individuais: { pessoaId: string; metaMrr: number; metaNaoRecorrente: number; metaReunioes: number }[];
};

const valido = (n: number) => Number.isFinite(n) && n >= 0;

export async function salvarMetas(dados: MetasDoMes): Promise<ResultadoAcao> {
  if (!MESES.includes(dados.mes)) return { error: "Mês inválido." };
  if (!valido(dados.metaMrr) || !valido(dados.metaNaoRecorrente)) return { error: "Meta global inválida." };
  for (const i of dados.individuais) {
    if (!valido(i.metaMrr) || !valido(i.metaNaoRecorrente) || !valido(i.metaReunioes) || !Number.isInteger(i.metaReunioes)) {
      return { error: "Há uma meta individual inválida. Use números positivos (reuniões sem casas decimais)." };
    }
  }

  const sb = supabaseServer();
  const global = await sb
    .from("metas")
    .upsert(
      { mes: dados.mes, meta_mrr: dados.metaMrr, meta_nao_recorrente: dados.metaNaoRecorrente },
      { onConflict: "mes" },
    );
  if (global.error) return { error: `Erro ao salvar a meta global: ${global.error.message}` };

  if (dados.individuais.length > 0) {
    const individuais = await sb.from("metas_individuais").upsert(
      dados.individuais.map((i) => ({
        mes: dados.mes,
        pessoa_id: i.pessoaId,
        meta_mrr: i.metaMrr,
        meta_nao_recorrente: i.metaNaoRecorrente,
        meta_valor: i.metaMrr + i.metaNaoRecorrente,
        meta_reunioes: i.metaReunioes,
      })),
      { onConflict: "mes,pessoa_id" },
    );
    if (individuais.error) return { error: `Erro ao salvar as metas individuais: ${individuais.error.message}` };
  }

  atualizarTelas();
  revalidatePath("/");
  return { error: null, enviadoEm: Date.now() };
}

// ---------- Reuniões

export async function criarReuniao(_prev: ResultadoAcao, formData: FormData): Promise<ResultadoAcao> {
  const data = String(formData.get("data") ?? "");
  const empresa = String(formData.get("empresa") ?? "").trim();
  const sdrId = String(formData.get("sdr_id") ?? "");
  const closerId = String(formData.get("closer_id") ?? "") || null;
  const status = String(formData.get("status") ?? "") as StatusReuniao;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return { error: "Informe a data da reunião." };
  if (!empresa) return { error: "Informe a empresa." };
  if (!sdrId) return { error: "Selecione o SDR." };
  if (!STATUS.includes(status)) return { error: "Selecione o status." };

  const sb = supabaseServer();
  const { error } = await sb.from("reunioes").insert({ data, empresa, sdr_id: sdrId, closer_id: closerId, status });
  if (error) return { error: error.message };

  atualizarTelas();
  return { error: null, enviadoEm: Date.now() };
}

export async function alterarStatusReuniao(id: string, status: StatusReuniao): Promise<ResultadoAcao> {
  if (!STATUS.includes(status)) return { error: "Status inválido." };
  const sb = supabaseServer();
  const { error } = await sb.from("reunioes").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  atualizarTelas();
  return { error: null };
}

export async function excluirReuniao(id: string): Promise<ResultadoAcao> {
  const sb = supabaseServer();
  const { error } = await sb.from("reunioes").delete().eq("id", id);
  if (error) return { error: error.message };
  atualizarTelas();
  return { error: null };
}
