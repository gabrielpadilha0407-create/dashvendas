export type Papel = "SDR" | "Closer" | "Operacional";

export type TipoVenda = "MRR" | "Não recorrente" | "Monetização";

export interface Pessoa {
  id: string;
  nome: string;
  papel: Papel;
  ativo: boolean;
  created_at: string;
}

export interface Venda {
  id: string;
  data: string;
  tipo: TipoVenda;
  valor: number;
  cliente: string;
  observacao: string | null;
  sdr_id: string | null;
  closer_id: string | null;
  operacional_id: string | null;
  created_at: string;
}

export interface VendaComPessoas extends Venda {
  sdr: Pick<Pessoa, "id" | "nome"> | null;
  closer: Pick<Pessoa, "id" | "nome"> | null;
  operacional: Pick<Pessoa, "id" | "nome"> | null;
}

export interface Meta {
  id: string;
  mes: string;
  meta_mrr: number;
  meta_nao_recorrente: number;
  meta_monetizacao: number;
}

export interface RankingItem {
  pessoa_id: string;
  nome: string;
  total: number;
  totalMrr: number;
}
