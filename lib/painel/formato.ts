import type { Faixa } from "./calc";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const INTEIRO = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const UMA_CASA = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export const brl = (n: number) => BRL.format(Math.round(n));
export const inteiro = (n: number) => INTEIRO.format(n);

/** Reuniões por dia com uma casa: 0,6 · 1,5 · 2 */
export const reunioesPorDia = (n: number | null) => (n === null ? "—" : `${UMA_CASA.format(n)} por dia`);

/** R$ 58 mil, R$ 1,2 mi — para eixos e tabelas compactas. */
export function brlCurto(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `R$ ${UMA_CASA.format(n / 1_000_000)} mi`;
  if (a >= 1_000) return `R$ ${UMA_CASA.format(n / 1_000)} mil`;
  return `R$ ${INTEIRO.format(n)}`;
}

/** Arredonda para baixo, para que 99,6% não apareça como 100%. */
export const pct = (p: number | null) => (p === null ? "—" : `${INTEIRO.format(Math.floor(p))}%`);

export const NOMES_MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
export const nomeMes = (mes: string) => NOMES_MESES[Number(mes.slice(5, 7)) - 1];
export const nomeMesCurto = (mes: string) => nomeMes(mes).slice(0, 3);

/** 2026-09-30 → 30/09 */
export const dataCurta = (data: string) => `${data.slice(8, 10)}/${data.slice(5, 7)}`;

// Cores de status fixas (vermelho < 70%, amarelo 70–99%, verde ≥ 100%), sempre acompanhadas de rótulo.
export const COR_FAIXA: Record<Faixa, string> = {
  baixo: "#d03b3b",
  atencao: "#fab219",
  batida: "#0ca30c",
  neutro: "#71717a",
};

export const ROTULO_FAIXA: Record<Faixa, string> = {
  baixo: "Abaixo de 70%",
  atencao: "Entre 70% e 99%",
  batida: "Meta batida",
  neutro: "Sem meta",
};
