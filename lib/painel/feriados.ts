// Feriados nacionais usados no cálculo de dias úteis do Painel.
// Valem para qualquer ano: os fixos estão na lista abaixo e os móveis são calculados a partir da Páscoa.
// Carnaval e Corpus Christi são pontos facultativos; estão incluídos porque o time comercial
// não trabalha nesses dias. Para tirar, remova-os de MOVEIS.

/** Feriados de data fixa, no formato MM-DD. */
const FIXOS: { dia: string; nome: string }[] = [
  { dia: "01-01", nome: "Confraternização Universal" },
  { dia: "04-21", nome: "Tiradentes" },
  { dia: "05-01", nome: "Dia do Trabalho" },
  { dia: "09-07", nome: "Independência do Brasil" },
  { dia: "10-12", nome: "Nossa Senhora Aparecida" },
  { dia: "11-02", nome: "Finados" },
  { dia: "11-15", nome: "Proclamação da República" },
  { dia: "11-20", nome: "Dia Nacional de Zumbi e da Consciência Negra" },
  { dia: "12-25", nome: "Natal" },
];

/** Feriados móveis: dias de distância em relação ao domingo de Páscoa. */
const MOVEIS: { deslocamento: number; nome: string }[] = [
  { deslocamento: -48, nome: "Carnaval" },
  { deslocamento: -47, nome: "Carnaval" },
  { deslocamento: -2, nome: "Sexta-feira Santa" },
  { deslocamento: 60, nome: "Corpus Christi" },
];

/** Dias extras de folga ou feriados locais (AAAA-MM-DD). Ex.: { data: "2026-12-24", nome: "Véspera de Natal" } */
const EXTRAS: { data: string; nome: string }[] = [];

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher). */
function pascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(ano, mes - 1, dia));
}

export function feriadosDoAno(ano: number): { data: string; nome: string }[] {
  const p = pascoa(ano);
  const moveis = MOVEIS.map((f) => {
    const d = new Date(p);
    d.setUTCDate(d.getUTCDate() + f.deslocamento);
    return { data: d.toISOString().slice(0, 10), nome: f.nome };
  });
  return [
    ...FIXOS.map((f) => ({ data: `${ano}-${f.dia}`, nome: f.nome })),
    ...moveis,
    ...EXTRAS.filter((f) => f.data.startsWith(String(ano))),
  ].sort((a, b) => a.data.localeCompare(b.data));
}
