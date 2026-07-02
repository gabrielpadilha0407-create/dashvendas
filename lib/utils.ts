import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/** Mês atual no formato 'YYYY-MM'. */
export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Retorna o mês anterior/seguinte a partir de um 'YYYY-MM'. */
export function shiftMonth(mes: string, delta: number): string {
  const [year, month] = mes.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

const MESES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** Formata 'YYYY-MM' como 'Março 2026'. */
export function formatMonthLabel(mes: string): string {
  const [year, month] = mes.split("-").map(Number);
  return `${MESES_PT[month - 1]} ${year}`;
}

/** Início e fim (inclusive) do mês 'YYYY-MM' como strings 'YYYY-MM-DD'. */
export function monthRange(mes: string): { start: string; end: string } {
  const [year, month] = mes.split("-").map(Number);
  const start = `${mes}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${mes}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

/** Data de hoje no fuso local, formato 'YYYY-MM-DD'. */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
