// Regras de cálculo do Painel Comercial. Funções puras, sem acesso ao banco.
import { feriadosDoAno } from "./feriados";

/** Primeiro ano com dados no painel. */
export const ANO_INICIAL = 2026;

export const mesesDoAno = (ano: number) => Array.from({ length: 12 }, (_, i) => `${ano}-${String(i + 1).padStart(2, "0")}`);

export const anoDe = (mes: string) => Number(mes.slice(0, 4));

/** Anos que aparecem no seletor: de 2026 até o ano seguinte ao atual. */
export function anosDisponiveis(hoje: string): number[] {
  const ultimo = Math.max(anoDe(hoje) + 1, ANO_INICIAL);
  return Array.from({ length: ultimo - ANO_INICIAL + 1 }, (_, i) => ANO_INICIAL + i);
}

/** Mês anterior no formato AAAA-MM (atravessa a virada do ano). */
export function mesAnterior(mes: string): string {
  const [a, m] = mes.split("-").map(Number);
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, "0")}`;
}

export type StatusReuniao = "realizada" | "no_show" | "remarcada";
export const STATUS_REUNIAO: { valor: StatusReuniao; rotulo: string }[] = [
  { valor: "realizada", rotulo: "Realizada" },
  { valor: "no_show", rotulo: "No-show" },
  { valor: "remarcada", rotulo: "Remarcada" },
];

export type PessoaP = { id: string; nome: string; papel: "SDR" | "Closer" | "Operacional"; ativo: boolean };
export type VendaP = {
  data: string;
  tipo: "MRR" | "Não recorrente" | "Monetização";
  valor: number;
  valor_setup: number | null;
  sdr_id: string | null;
  closer_id: string | null;
};
export type MetaGlobalP = { mes: string; meta_mrr: number; meta_nao_recorrente: number };
export type MetaIndividualP = {
  mes: string;
  pessoa_id: string;
  meta_mrr: number;
  meta_nao_recorrente: number;
  meta_reunioes: number;
};

/** Super meta de MRR do closer: 10% acima da meta. Mude aqui se o percentual mudar. */
export const SUPER_META_FATOR = 1.1;
export const superMeta = (meta: number) => Math.round(meta * SUPER_META_FATOR * 100) / 100; // em centavos, sem erro de ponto flutuante

/** Meta total do closer = MRR + não recorrente. */
export const metaTotalCloser = (m: MetaIndividualP | undefined) => (m ? m.meta_mrr + m.meta_nao_recorrente : 0);
export type ReuniaoP = {
  id: string;
  data: string;
  empresa: string;
  sdr_id: string;
  closer_id: string | null;
  status: StatusReuniao;
};

export type PainelDados = {
  pessoas: PessoaP[];
  vendas: VendaP[];
  metas: MetaGlobalP[];
  metasIndividuais: MetaIndividualP[];
  reunioes: ReuniaoP[];
  metasSemanais: MetaSemanalP[];
};

// ---------- Datas

/** Hoje no fuso de São Paulo (o servidor da Vercel roda em UTC). */
export function hojeSP(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

/** Mês da URL, se válido e dentro dos anos disponíveis; senão o mês atual. */
export function resolverMes(param: string | undefined, hoje: string): string {
  const anos = anosDisponiveis(hoje);
  if (param && /^\d{4}-(0[1-9]|1[0-2])$/.test(param) && anos.includes(anoDe(param))) return param;
  const atual = hoje.slice(0, 7);
  return anoDe(atual) < ANO_INICIAL ? `${ANO_INICIAL}-01` : atual;
}

const cacheFeriados = new Map<number, Set<string>>();
function feriados(ano: number): Set<string> {
  let s = cacheFeriados.get(ano);
  if (!s) {
    s = new Set(feriadosDoAno(ano).map((f) => f.data));
    cacheFeriados.set(ano, s);
  }
  return s;
}

function fimDoMes(mes: string): string {
  const [a, m] = mes.split("-").map(Number);
  return `${mes}-${String(new Date(Date.UTC(a, m, 0)).getUTCDate()).padStart(2, "0")}`;
}

/** Dias úteis do mês inteiro (segunda a sexta, menos feriados). */
export const diasUteisDoMes = (mes: string) => diasUteisRestantes(mes, `${mes}-01`);

/** Meta do mês ÷ dias úteis do mês inteiro. Usada só na aba Metas, para planejar. */
export const metaPorDiaDoMes = (meta: number, mes: string) => {
  const dias = diasUteisDoMes(mes);
  return meta > 0 && dias > 0 ? meta / dias : null;
};

export type MetaDiaria =
  | { tipo: "valor"; valor: number; dias: number }
  | { tipo: "sem_meta" }
  | { tipo: "batida" }
  | { tipo: "encerrado" };

/**
 * Meta diária no ritmo atual: quanto falta ÷ dias úteis restantes no mês (segunda a sexta,
 * sem feriados, contando hoje). Muda a cada venda; num mês futuro equivale à meta ÷ dias do mês.
 */
export function metaDiaria(meta: number, realizado: number, mes: string, hoje: string): MetaDiaria {
  if (meta <= 0) return { tipo: "sem_meta" };
  if (realizado >= meta) return { tipo: "batida" };
  const dias = diasUteisRestantes(mes, hoje);
  if (dias === 0) return { tipo: "encerrado" };
  return { tipo: "valor", valor: (meta - realizado) / dias, dias };
}

/** Dias úteis do mês a partir de hoje (inclusive). Mês passado = 0; mês futuro = todos. */
export function diasUteisRestantes(mes: string, hoje: string): number {
  return diasUteisEntre(`${mes}-01`, fimDoMes(mes), hoje);
}

/** Dias úteis (segunda a sexta, sem feriados) entre `inicio` e `fim`, contando só a partir de hoje (inclusive). */
export function diasUteisEntre(inicio: string, fim: string, hoje: string): number {
  const de = hoje > inicio ? hoje : inicio;
  if (de > fim) return 0;
  const [a, m, d] = de.split("-").map(Number);
  const cursor = new Date(Date.UTC(a, m - 1, d));
  const folgas = feriados(a);
  let n = 0;
  for (let s = cursor.toISOString().slice(0, 10); s <= fim; s = cursor.toISOString().slice(0, 10)) {
    const dia = cursor.getUTCDay();
    if (dia !== 0 && dia !== 6 && !folgas.has(s)) n++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return n;
}

// ---------- Semanas

export type MetaSemanalP = { mes: string; semana: number; meta_mrr: number; meta_nao_recorrente: number };

export type Semana = {
  numero: number;
  /** limites de calendário da semana (vendas de sábado/domingo caem na semana em que aconteceram) */
  inicio: string;
  fim: string;
  /** primeiro e último dia útil da semana — é o período mostrado na tela */
  primeiroUtil: string;
  ultimoUtil: string;
  diasUteis: number;
};

/** Segunda a sexta e não feriado. */
export function ehDiaUtil(data: string): boolean {
  const [a, m, d] = data.split("-").map(Number);
  const dia = new Date(Date.UTC(a, m - 1, d)).getUTCDay();
  return dia !== 0 && dia !== 6 && !feriados(a).has(data);
}

/**
 * Semanas do mês contadas em dias úteis (segunda a sexta, sem feriados), cortadas no mês.
 * Um pedaço de semana sem nenhum dia útil (ex.: mês que começa no sábado) entra na semana vizinha.
 */
export function semanasDoMes(mes: string): Semana[] {
  const fim = fimDoMes(mes);
  const [a, m] = mes.split("-").map(Number);
  const cursor = new Date(Date.UTC(a, m - 1, 1));
  const semanas: { inicio: string; fim: string; uteis: string[] }[] = [];
  for (let s = cursor.toISOString().slice(0, 10); s <= fim; s = cursor.toISOString().slice(0, 10)) {
    if (semanas.length === 0 || cursor.getUTCDay() === 1) semanas.push({ inicio: s, fim: s, uteis: [] });
    const atual = semanas[semanas.length - 1];
    atual.fim = s;
    if (ehDiaUtil(s)) atual.uteis.push(s);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  if (semanas.length > 1 && semanas[0].uteis.length === 0) {
    semanas[1].inicio = semanas[0].inicio;
    semanas.shift();
  }
  if (semanas.length > 1 && semanas[semanas.length - 1].uteis.length === 0) {
    semanas[semanas.length - 2].fim = semanas[semanas.length - 1].fim;
    semanas.pop();
  }
  return semanas.map((w, i) => ({
    numero: i + 1,
    inicio: w.inicio,
    fim: w.fim,
    primeiroUtil: w.uteis[0] ?? w.inicio,
    ultimoUtil: w.uteis[w.uteis.length - 1] ?? w.fim,
    diasUteis: w.uteis.length,
  }));
}

export type LinhaSemana = Semana & {
  metaMrr: number;
  metaNaoRecorrente: number;
  meta: number;
  realizado: Resumo;
  pct: number | null;
  status: "futura" | "atual" | "passada";
  diaria: MetaDiaria;
};

/** Metas e realizado de cada semana do mês. A meta diária da semana = falta ÷ dias úteis que restam na semana. */
export function visaoSemanas(d: PainelDados, mes: string, hoje: string): LinhaSemana[] {
  return semanasDoMes(mes).map((s) => {
    const m = d.metasSemanais.find((x) => x.mes === mes && x.semana === s.numero);
    const metaMrr = m?.meta_mrr ?? 0;
    const metaNaoRecorrente = m?.meta_nao_recorrente ?? 0;
    const meta = metaMrr + metaNaoRecorrente;
    const realizado = resumir(d.vendas.filter((v) => v.data >= s.inicio && v.data <= s.fim));
    const status = hoje > s.fim ? "passada" : hoje < s.inicio ? "futura" : "atual";
    let diaria: MetaDiaria;
    if (meta <= 0) diaria = { tipo: "sem_meta" };
    else if (realizado.aquisicao >= meta) diaria = { tipo: "batida" };
    else {
      const dias = diasUteisEntre(s.inicio, s.fim, hoje);
      diaria = dias === 0 ? { tipo: "encerrado" } : { tipo: "valor", valor: (meta - realizado.aquisicao) / dias, dias };
    }
    return { ...s, metaMrr, metaNaoRecorrente, meta, realizado, pct: percentual(realizado.aquisicao, meta), status, diaria };
  });
}

// ---------- Números

/** Aceita 25000, 25.000, 25000,50 e R$ 25.000,50. Retorna null se não for número. */
export function parseValor(bruto: string): number | null {
  let s = bruto.trim().replace(/^R\$/i, "").replace(/\s/g, "");
  if (s === "") return 0;
  if (s.includes(",") && s.includes(".")) {
    s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

export function percentual(realizado: number, meta: number): number | null {
  return meta > 0 ? (realizado / meta) * 100 : null;
}

export type Faixa = "baixo" | "atencao" | "batida" | "neutro";

export function faixaDe(p: number | null): Faixa {
  if (p === null) return "neutro";
  if (p >= 100) return "batida";
  if (p >= 70) return "atencao";
  return "baixo";
}

// ---------- Agregações

/** Aquisição = MRR + não recorrente. O setup de uma venda MRR conta como não recorrente. Monetização fica de fora. */
export function valoresVenda(v: VendaP): { mrr: number; naoRecorrente: number } {
  if (v.tipo === "MRR") return { mrr: v.valor, naoRecorrente: v.valor_setup ?? 0 };
  if (v.tipo === "Não recorrente") return { mrr: 0, naoRecorrente: v.valor };
  return { mrr: 0, naoRecorrente: 0 };
}

export type Resumo = { aquisicao: number; mrr: number; naoRecorrente: number; qtd: number };

export function resumir(vendas: VendaP[]): Resumo {
  const r: Resumo = { aquisicao: 0, mrr: 0, naoRecorrente: 0, qtd: 0 };
  for (const v of vendas) {
    if (v.tipo === "Monetização") continue;
    const { mrr, naoRecorrente } = valoresVenda(v);
    r.mrr += mrr;
    r.naoRecorrente += naoRecorrente;
    r.aquisicao += mrr + naoRecorrente;
    r.qtd++;
  }
  return r;
}

const doMes = (data: string, mes: string) => data.startsWith(mes);

export function metaGlobal(d: PainelDados, mes: string) {
  const m = d.metas.find((x) => x.mes === mes);
  if (!m) return null;
  return { mrr: m.meta_mrr, naoRecorrente: m.meta_nao_recorrente, aquisicao: m.meta_mrr + m.meta_nao_recorrente };
}

function nome(d: PainelDados, id: string) {
  return d.pessoas.find((p) => p.id === id)?.nome ?? "Pessoa removida";
}

// ---------- Ranking de closers

export type LinhaCloser = {
  id: string;
  nome: string;
  meta: number | null; // total = MRR + não recorrente
  metaMrr: number;
  metaNaoRecorrente: number;
  realizado: number;
  pct: number | null;
  mrr: number;
  pctMrr: number | null;
  naoRecorrente: number;
  pctNaoRecorrente: number | null;
  qtd: number;
  ticket: number | null;
};

export function rankingClosers(d: PainelDados, mes: string) {
  const vendasMes = d.vendas.filter((v) => doMes(v.data, mes) && v.tipo !== "Monetização");
  const metasMes = d.metasIndividuais.filter((m) => m.mes === mes);
  const closers = new Set(d.pessoas.filter((p) => p.papel === "Closer").map((p) => p.id));

  const ids = new Set<string>();
  for (const p of d.pessoas) if (p.papel === "Closer" && p.ativo) ids.add(p.id);
  for (const v of vendasMes) if (v.closer_id) ids.add(v.closer_id);
  for (const m of metasMes) if (closers.has(m.pessoa_id) && metaTotalCloser(m) > 0) ids.add(m.pessoa_id);

  const linhas: LinhaCloser[] = [...ids].map((id) => {
    const r = resumir(vendasMes.filter((v) => v.closer_id === id));
    const m = metasMes.find((x) => x.pessoa_id === id);
    const metaMrr = m?.meta_mrr ?? 0;
    const metaNaoRecorrente = m?.meta_nao_recorrente ?? 0;
    const total = metaMrr + metaNaoRecorrente;
    return {
      id,
      nome: nome(d, id),
      meta: total > 0 ? total : null,
      metaMrr,
      metaNaoRecorrente,
      realizado: r.aquisicao,
      pct: percentual(r.aquisicao, total),
      mrr: r.mrr,
      pctMrr: percentual(r.mrr, metaMrr),
      naoRecorrente: r.naoRecorrente,
      pctNaoRecorrente: percentual(r.naoRecorrente, metaNaoRecorrente),
      qtd: r.qtd,
      ticket: r.qtd > 0 ? r.aquisicao / r.qtd : null,
    };
  });
  linhas.sort((a, b) => b.realizado - a.realizado || a.nome.localeCompare(b.nome, "pt-BR"));

  const somaMetas = {
    mrr: linhas.reduce((s, l) => s + l.metaMrr, 0),
    naoRecorrente: linhas.reduce((s, l) => s + l.metaNaoRecorrente, 0),
    total: linhas.reduce((s, l) => s + (l.meta ?? 0), 0),
  };
  return { linhas, somaMetas };
}

// ---------- Ranking de SDRs

export type LinhaSdr = {
  id: string;
  nome: string;
  metaReunioes: number | null;
  realizadas: number;
  noShow: number;
  pct: number | null;
  vendas: number;
  mrr: number; // MRR das vendas originadas pelo SDR
  conversao: number | null;
};

export function rankingSdrs(d: PainelDados, mes: string) {
  const vendasMes = d.vendas.filter((v) => doMes(v.data, mes) && v.tipo !== "Monetização");
  const reunioesMes = d.reunioes.filter((r) => doMes(r.data, mes));
  const metasMes = d.metasIndividuais.filter((m) => m.mes === mes);
  const sdrs = new Set(d.pessoas.filter((p) => p.papel === "SDR").map((p) => p.id));

  const ids = new Set<string>();
  for (const p of d.pessoas) if (p.papel === "SDR" && p.ativo) ids.add(p.id);
  for (const v of vendasMes) if (v.sdr_id) ids.add(v.sdr_id);
  for (const r of reunioesMes) ids.add(r.sdr_id);
  for (const m of metasMes) if (sdrs.has(m.pessoa_id) && m.meta_reunioes > 0) ids.add(m.pessoa_id);

  const linhas: LinhaSdr[] = [...ids].map((id) => {
    const originadas = vendasMes.filter((v) => v.sdr_id === id);
    const minhas = reunioesMes.filter((r) => r.sdr_id === id);
    const realizadas = minhas.filter((r) => r.status === "realizada").length;
    const metaR = metasMes.find((m) => m.pessoa_id === id)?.meta_reunioes ?? 0;
    const metaReunioes = metaR > 0 ? metaR : null;
    return {
      id,
      nome: nome(d, id),
      metaReunioes,
      realizadas,
      noShow: minhas.filter((r) => r.status === "no_show").length,
      pct: metaReunioes === null ? null : percentual(realizadas, metaReunioes),
      vendas: originadas.length,
      mrr: resumir(originadas).mrr,
      conversao: realizadas > 0 ? (originadas.length / realizadas) * 100 : null,
    };
  });
  linhas.sort((a, b) => b.mrr - a.mrr || b.realizadas - a.realizadas || a.nome.localeCompare(b.nome, "pt-BR"));

  const semSdr = resumir(vendasMes.filter((v) => !v.sdr_id));
  const somaMetas = linhas.reduce((s, l) => s + (l.metaReunioes ?? 0), 0);
  const totalRealizadas = linhas.reduce((s, l) => s + l.realizadas, 0);
  return { linhas, semSdr, somaMetas, totalRealizadas };
}

// ---------- Visão anual

export type StatusMes = "futuro" | "andamento" | "batida" | "nao_batida" | "sem_meta";

export type LinhaAno = {
  mes: string;
  meta: number | null;
  realizado: number;
  pct: number | null;
  mrrAcumulado: number | null;
  status: StatusMes;
};

/** Os 12 meses do ano escolhido; `mesAtual` (mês de hoje) define o que é passado, em andamento ou futuro. */
export function visaoAno(d: PainelDados, ano: number, mesAtual: string): LinhaAno[] {
  let acumulado = 0;
  return mesesDoAno(ano).map((mes) => {
    const r = resumir(d.vendas.filter((v) => doMes(v.data, mes)));
    acumulado += r.mrr;
    const m = metaGlobal(d, mes);
    const meta = m && m.aquisicao > 0 ? m.aquisicao : null;
    const pct = meta === null ? null : percentual(r.aquisicao, meta);
    let status: StatusMes;
    if (mes > mesAtual) status = "futuro";
    else if (pct === null) status = "sem_meta";
    else if (pct >= 100) status = "batida";
    else if (mes === mesAtual) status = "andamento";
    else status = "nao_batida";
    return { mes, meta, realizado: r.aquisicao, pct, mrrAcumulado: mes > mesAtual ? null : acumulado, status };
  });
}

// ---------- Pendências

/** Pessoas ativas sem meta cadastrada no mês, e mês sem meta global. */
export function pendencias(d: PainelDados, mes: string): string[] {
  const itens: string[] = [];
  const g = metaGlobal(d, mes);
  if (!g || g.aquisicao === 0) itens.push("Meta global do mês (MRR e não recorrente) não cadastrada.");
  const metasMes = d.metasIndividuais.filter((m) => m.mes === mes);
  for (const p of d.pessoas) {
    if (!p.ativo) continue;
    const m = metasMes.find((x) => x.pessoa_id === p.id);
    if (p.papel === "Closer" && metaTotalCloser(m) === 0) itens.push(`${p.nome} (closer) está sem meta no mês.`);
    if (p.papel === "SDR" && !(m && m.meta_reunioes > 0)) itens.push(`${p.nome} (SDR) está sem meta de reuniões no mês.`);
  }
  return itens;
}
