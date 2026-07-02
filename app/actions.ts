"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import type { TipoVenda } from "@/lib/types";

export type ActionState = { error: string | null };

interface VendaPayload {
  data: string;
  tipo: TipoVenda;
  valor: number;
  valor_setup: number | null;
  cliente: string;
  observacao: string | null;
  sdr_id: string | null;
  closer_id: string | null;
  operacional_id: string | null;
}

type ParseResult = { ok: true; payload: VendaPayload } | { ok: false; error: string };

function parseVendaForm(formData: FormData): ParseResult {
  const data = formData.get("data") as string;
  const tipo = formData.get("tipo") as TipoVenda;
  const valorRaw = (formData.get("valor") as string) ?? "";
  const cliente = ((formData.get("cliente") as string) ?? "").trim();
  const observacao = ((formData.get("observacao") as string) ?? "").trim() || null;
  const sdrIdRaw = (formData.get("sdr_id") as string) || null;
  const sdrId = sdrIdRaw === "none" ? null : sdrIdRaw;
  const closerId = (formData.get("closer_id") as string) || null;
  const operacionalId = (formData.get("operacional_id") as string) || null;
  const valor = Number(valorRaw.replace(",", "."));

  if (!data || !tipo || !cliente || Number.isNaN(valor) || valor <= 0) {
    return { ok: false, error: "Preencha data, tipo, cliente e um valor válido." };
  }

  const setupRaw = ((formData.get("valor_setup") as string) ?? "").trim();
  let valorSetup: number | null = null;
  if (tipo === "MRR" && setupRaw) {
    valorSetup = Number(setupRaw.replace(",", "."));
    if (Number.isNaN(valorSetup) || valorSetup <= 0) {
      return { ok: false, error: "Valor de setup inválido." };
    }
  }

  if (tipo === "Monetização") {
    if (!operacionalId) {
      return { ok: false, error: "Selecione quem da Operação fechou essa monetização." };
    }
    return {
      ok: true,
      payload: {
        data,
        tipo,
        valor,
        valor_setup: null,
        cliente,
        observacao,
        sdr_id: null,
        closer_id: null,
        operacional_id: operacionalId,
      },
    };
  }

  if (!closerId) {
    return { ok: false, error: "Selecione o Closer que fechou a venda." };
  }
  return {
    ok: true,
    payload: {
      data,
      tipo,
      valor,
      valor_setup: valorSetup,
      cliente,
      observacao,
      sdr_id: sdrId,
      closer_id: closerId,
      operacional_id: null,
    },
  };
}

export async function createVenda(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseVendaForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = supabaseServer();
  const { error } = await supabase.from("vendas").insert(parsed.payload);
  if (error) return { error: error.message };

  revalidatePath("/");
  return { error: null };
}

export async function updateVenda(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseVendaForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = supabaseServer();
  const { error } = await supabase.from("vendas").update(parsed.payload).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/");
  return { error: null };
}

export async function deleteVenda(id: string): Promise<void> {
  const supabase = supabaseServer();
  await supabase.from("vendas").delete().eq("id", id);
  revalidatePath("/");
}

export async function updateMeta(
  mes: string,
  field: "meta_mrr" | "meta_nao_recorrente" | "meta_monetizacao",
  value: number,
): Promise<void> {
  const supabase = supabaseServer();
  await supabase.from("metas").update({ [field]: value }).eq("mes", mes);
  revalidatePath("/");
}
