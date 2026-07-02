"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import type { Papel } from "@/lib/types";

export type ActionState = { error: string | null };

type ParseResult =
  | { ok: true; payload: { nome: string; papel: Papel } }
  | { ok: false; error: string };

function parsePessoaForm(formData: FormData): ParseResult {
  const nome = ((formData.get("nome") as string) ?? "").trim();
  const papel = formData.get("papel") as Papel;
  if (!nome || !papel) {
    return { ok: false, error: "Preencha nome e papel." };
  }
  return { ok: true, payload: { nome, papel } };
}

export async function createPessoa(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parsePessoaForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = supabaseServer();
  const { error } = await supabase.from("pessoas").insert({ ...parsed.payload, ativo: true });
  if (error) return { error: error.message };

  revalidatePath("/configuracoes");
  revalidatePath("/");
  return { error: null };
}

export async function updatePessoa(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parsePessoaForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = supabaseServer();
  const { error } = await supabase.from("pessoas").update(parsed.payload).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/configuracoes");
  revalidatePath("/");
  return { error: null };
}

export async function togglePessoaAtivo(id: string, ativo: boolean): Promise<void> {
  const supabase = supabaseServer();
  await supabase.from("pessoas").update({ ativo }).eq("id", id);
  revalidatePath("/configuracoes");
  revalidatePath("/");
}
