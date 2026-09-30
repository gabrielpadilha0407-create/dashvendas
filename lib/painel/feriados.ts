// Feriados nacionais de 2026 usados no cálculo de dias úteis do Painel.
// Para adicionar ou remover um dia, edite esta lista (formato AAAA-MM-DD).
// Carnaval e Corpus Christi são pontos facultativos; estão incluídos porque o
// time comercial não trabalha nesses dias. Remova-os se isso mudar.
export const FERIADOS_2026: { data: string; nome: string }[] = [
  { data: "2026-01-01", nome: "Confraternização Universal" },
  { data: "2026-02-16", nome: "Carnaval" },
  { data: "2026-02-17", nome: "Carnaval" },
  { data: "2026-04-03", nome: "Sexta-feira Santa" },
  { data: "2026-04-21", nome: "Tiradentes" },
  { data: "2026-05-01", nome: "Dia do Trabalho" },
  { data: "2026-06-04", nome: "Corpus Christi" },
  { data: "2026-09-07", nome: "Independência do Brasil" },
  { data: "2026-10-12", nome: "Nossa Senhora Aparecida" },
  { data: "2026-11-02", nome: "Finados" },
  { data: "2026-11-15", nome: "Proclamação da República" },
  { data: "2026-11-20", nome: "Dia Nacional de Zumbi e da Consciência Negra" },
  { data: "2026-12-25", nome: "Natal" },
];
