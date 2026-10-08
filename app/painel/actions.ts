"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { ANO_INICIAL, anoDe, type StatusReuniao } from "@/lib/painel/calc";

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
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(dados.mes) || anoDe(dados.mes) < ANO_INICIAL) return { error: "Mês inválido." };
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

// ---------- Metas semanais (do time)

export type MetasSemanaisDoMes = {
  mes: string;
  semanas: { semana: number; metaMrr: number; metaNaoRecorrente: number }[];
};

export async function salvarMetasSemanais(dados: MetasSemanaisDoMes): Promise<ResultadoAcao> {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(dados.mes) || anoDe(dados.mes) < ANO_INICIAL) return { error: "Mês inválido." };
  for (const s of dados.semanas) {
    if (!Number.isInteger(s.semana) || s.semana < 1 || s.semana > 6) return { error: "Semana inválida." };
    if (!valido(s.metaMrr) || !valido(s.metaNaoRecorrente)) return { error: `Meta inválida na semana ${s.semana}.` };
  }

  const sb = supabaseServer();
  const { error } = await sb.from("metas_semanais").upsert(
    dados.semanas.map((s) => ({
      mes: dados.mes,
      semana: s.semana,
      meta_mrr: s.metaMrr,
      meta_nao_recorrente: s.metaNaoRecorrente,
    })),
    { onConflict: "mes,semana" },
  );
  if (error) return { error: `Erro ao salvar as metas semanais: ${error.message}` };

  atualizarTelas();
  return { error: null, enviadoEm: Date.now() };
}

// ---------- Metas semanais de reuniões realizadas, por SDR

export type MetasSemanaisSdrDoMes = {
  mes: string;
  itens: { pessoaId: string; semana: number; metaReunioes: number }[];
};

export async function salvarMetasSemanaisSdr(dados: MetasSemanaisSdrDoMes): Promise<ResultadoAcao> {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(dados.mes) || anoDe(dados.mes) < ANO_INICIAL) return { error: "Mês inválido." };
  for (const i of dados.itens) {
    if (!Number.isInteger(i.semana) || i.semana < 1 || i.semana > 6) return { error: "Semana inválida." };
    if (!valido(i.metaReunioes) || !Number.isInteger(i.metaReunioes)) {
      return { error: `Meta inválida na semana ${i.semana}. Use números inteiros de reuniões.` };
    }
  }
  if (dados.itens.length === 0) return { error: null, enviadoEm: Date.now() };

  const sb = supabaseServer();
  const { error } = await sb.from("metas_semanais_sdr").upsert(
    dados.itens.map((i) => ({ mes: dados.mes, semana: i.semana, pessoa_id: i.pessoaId, meta_reunioes: i.metaReunioes })),
    { onConflict: "mes,semana,pessoa_id" },
  );
  if (error) return { error: `Erro ao salvar as metas de reuniões: ${error.message}` };

  atualizarTelas();
  return { error: null, enviadoEm: Date.now() };
}
