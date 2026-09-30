import { diasUteisRestantes, faixaDe, metaGlobal, percentual, resumir, type PainelDados } from "@/lib/painel/calc";
import { brl, pct } from "@/lib/painel/formato";
import { Barra, Bloco, SeloFaixa } from "./ui";

export function CartoesMetas({ dados, mes, hoje }: { dados: PainelDados; mes: string; hoje: string }) {
  const meta = metaGlobal(dados, mes);
  const r = resumir(dados.vendas.filter((v) => v.data.startsWith(mes)));
  const dias = diasUteisRestantes(mes, hoje);
  const mesAtual = hoje.slice(0, 7);

  const cartoes = [
    { titulo: "Aquisição total", realizado: r.aquisicao, meta: meta?.aquisicao ?? 0 },
    { titulo: "MRR", realizado: r.mrr, meta: meta?.mrr ?? 0 },
    { titulo: "Não recorrente", realizado: r.naoRecorrente, meta: meta?.naoRecorrente ?? 0 },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
      {cartoes.map((c) => (
        <CartaoMeta key={c.titulo} {...c} dias={dias} encerrado={mes < mesAtual} futuro={mes > mesAtual} />
      ))}
    </div>
  );
}

function CartaoMeta({
  titulo,
  realizado,
  meta,
  dias,
  encerrado,
  futuro,
}: {
  titulo: string;
  realizado: number;
  meta: number;
  dias: number;
  encerrado: boolean;
  futuro: boolean;
}) {
  const temMeta = meta > 0;
  const p = temMeta ? percentual(realizado, meta) : null;
  const faixa = faixaDe(p);
  const falta = temMeta ? Math.max(0, meta - realizado) : 0;

  let ritmo = "—";
  let detalhe: string;
  if (!temMeta) {
    detalhe = "sem meta cadastrada";
  } else if (falta === 0) {
    ritmo = "Meta batida";
    detalhe = `${brl(realizado - meta)} acima da meta`;
  } else if (dias === 0) {
    detalhe = encerrado ? "mês encerrado" : "sem dias úteis restantes";
  } else {
    ritmo = brl(falta / dias);
    const plural = dias === 1 ? "dia útil" : "dias úteis";
    detalhe = futuro
      ? `por dia útil · ${dias} ${plural} no mês`
      : `por dia útil · ${dias} ${plural} ${dias === 1 ? "restante" : "restantes"}, incluindo hoje`;
  }

  return (
    <Bloco>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-muted-foreground lg:text-xl">{titulo}</h2>
        <SeloFaixa faixa={faixa} />
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-4xl font-bold tabular-nums tracking-tight sm:text-5xl lg:text-4xl xl:text-5xl 2xl:text-6xl">
          {brl(realizado)}
        </span>
        <span className="text-3xl font-semibold tabular-nums text-muted-foreground lg:text-2xl xl:text-3xl 2xl:text-4xl">
          {pct(p)}
        </span>
      </div>
      <p className="mt-1 text-base tabular-nums text-muted-foreground lg:text-lg">
        {temMeta ? `de ${brl(meta)}` : "Sem meta cadastrada para o mês"}
      </p>

      <div className="mt-4">
        <Barra pct={p} faixa={faixa} alta />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
        <div>
          <dt className="text-sm text-muted-foreground">Falta</dt>
          <dd className="text-2xl font-semibold tabular-nums lg:text-xl xl:text-2xl 2xl:text-3xl">
            {temMeta ? brl(falta) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Ritmo necessário</dt>
          <dd className="text-2xl font-semibold tabular-nums lg:text-xl xl:text-2xl 2xl:text-3xl">{ritmo}</dd>
          <dd className="text-xs text-muted-foreground">{detalhe}</dd>
        </div>
      </dl>
    </Bloco>
  );
}
