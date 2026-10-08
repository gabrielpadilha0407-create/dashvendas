import Link from "next/link";
import { faixaDe, percentual, repasseSimples, visaoSemanas, visaoSemanasSdr, type PainelDados } from "@/lib/painel/calc";
import { brl, dataCurta, inteiro, pct, reunioesPorDia } from "@/lib/painel/formato";
import { Barra, Bloco, SeloFaixa } from "./ui";

/** Reuniões realizadas na semana atual por SDR, contra a meta semanal de cada um (já com repasse). */
function ReunioesDaSemana({ dados, mes, hoje }: { dados: PainelDados; mes: string; hoje: string }) {
  const { semanas, linhas } = visaoSemanasSdr(dados, mes, hoje);
  const i = semanas.findIndex((s) => s.status === "atual");
  if (i < 0) return null;
  const dias = semanas[i].diasRestantes;
  const itens = linhas
    .map((p) => {
      const ajuste = repasseSimples(
        semanas.map((s, j) => ({ meta: p.porSemana[j].metaPlanejada, realizado: p.porSemana[j].realizadas, status: s.status })),
      )[i];
      return { nome: p.nome, meta: ajuste.meta, repasse: ajuste.repasse, feitas: p.porSemana[i].realizadas };
    })
    .filter((x) => x.meta > 0);
  if (itens.length === 0) return null;

  return (
    <div className="mt-6 border-t border-border pt-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Reuniões realizadas na semana</h3>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {itens.map((x) => {
          const p = percentual(x.feitas, x.meta);
          const falta = Math.max(0, x.meta - x.feitas);
          return (
            <div key={x.nome}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{x.nome}</span>
                <span className="tabular-nums">
                  <span className="text-xl font-bold">{inteiro(x.feitas)}</span>
                  <span className="text-muted-foreground"> / {inteiro(x.meta)}</span>
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Barra pct={p} faixa={faixaDe(p)} />
                <span className="w-10 shrink-0 text-right text-xs tabular-nums">{pct(p)}</span>
              </div>
              <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                {falta === 0 ? (
                  <span className="text-[#3fd13f]">Meta batida</span>
                ) : (
                  <>
                    faltam {inteiro(falta)}
                    {dias > 0 ? ` · ${reunioesPorDia(falta / dias)}` : ""}
                  </>
                )}
                {x.repasse > 0 && <span className="text-[#fab219]"> · inclui {inteiro(x.repasse)} da semana anterior</span>}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Andamento da semana corrente contra a meta semanal do time. Só aparece no mês atual. */
export function SemanaAtual({ dados, mes, hoje }: { dados: PainelDados; mes: string; hoje: string }) {
  const semana = visaoSemanas(dados, mes, hoje).find((s) => s.status === "atual");
  if (!semana) return null;

  const titulo = `Semana ${semana.numero} · ${dataCurta(semana.primeiroUtil)} a ${dataCurta(semana.ultimoUtil)}`;
  if (semana.meta <= 0) {
    return (
      <Bloco titulo="Meta da semana" extra={titulo}>
        <p className="text-sm text-muted-foreground">
          Sem meta semanal cadastrada.{" "}
          <Link href={`/painel/semanas?mes=${mes}`} className="underline underline-offset-4 hover:text-foreground">
            Cadastrar metas semanais
          </Link>
        </p>
        <ReunioesDaSemana dados={dados} mes={mes} hoje={hoje} />
      </Bloco>
    );
  }

  const r = semana.realizado;
  const faixa = faixaDe(semana.pct);
  const falta = Math.max(0, semana.meta - r.aquisicao);
  const d = semana.diaria;
  const diaria = d.tipo === "valor" ? brl(d.valor) : d.tipo === "batida" ? "Meta batida" : "—";
  const detalheDiaria =
    d.tipo === "valor"
      ? `por dia útil · ${d.dias} ${d.dias === 1 ? "dia útil restante" : "dias úteis restantes"} na semana`
      : d.tipo === "encerrado"
        ? "sem dias úteis restantes na semana"
        : "";
  // Meta diária separada de MRR e não recorrente (o que falta de cada um ÷ dias úteis restantes na semana)
  const porDia = (meta: number, feito: number) =>
    meta <= 0 ? "—" : feito >= meta ? "batida" : d.tipo === "valor" ? brl((meta - feito) / d.dias) : "—";
  const diariaMrr = porDia(semana.metaMrr, r.mrr);
  const diariaNr = porDia(semana.metaNaoRecorrente, r.naoRecorrente);

  const parcial = (rotulo: string, feito: number, meta: number) => {
    const p = percentual(feito, meta);
    return (
      <div>
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="text-muted-foreground">{rotulo}</span>
          <span className="tabular-nums">
            <span className="font-semibold">{brl(feito)}</span>
            <span className="text-muted-foreground"> / {meta > 0 ? brl(meta) : "—"}</span>
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <Barra pct={p} faixa={faixaDe(p)} />
          <span className="w-10 shrink-0 text-right text-xs tabular-nums">{pct(p)}</span>
        </div>
      </div>
    );
  };

  return (
    <Bloco titulo="Meta da semana" extra={titulo}>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <div className="flex flex-wrap items-baseline gap-x-3">
            <span className="text-4xl font-bold tabular-nums tracking-tight xl:text-5xl">{brl(r.aquisicao)}</span>
            <span className="text-2xl font-semibold tabular-nums text-muted-foreground xl:text-3xl">{pct(semana.pct)}</span>
          </div>
          <p className="mt-1 text-base tabular-nums text-muted-foreground">de {brl(semana.meta)} (aquisição total)</p>
          {semana.repasseMrr + semana.repasseNaoRecorrente > 0 && (
            <p className="mt-1 text-sm tabular-nums text-[#fab219]">
              inclui {brl(semana.repasseMrr + semana.repasseNaoRecorrente)} não batidos nas semanas anteriores
              {semana.repasseMrr > 0 && semana.repasseNaoRecorrente > 0
                ? ` (MRR ${brl(semana.repasseMrr)} · não rec. ${brl(semana.repasseNaoRecorrente)})`
                : semana.repasseMrr > 0
                  ? " (MRR)"
                  : " (não recorrente)"}
            </p>
          )}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1">
              <Barra pct={semana.pct} faixa={faixa} alta />
            </div>
            <SeloFaixa faixa={faixa} />
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <div>
            <dt className="text-sm text-muted-foreground">Meta diária da semana</dt>
            <dd className="text-2xl font-semibold tabular-nums xl:text-3xl">{diaria}</dd>
            {d.tipo === "valor" && (
              <dd className="mt-1 text-sm tabular-nums text-muted-foreground">
                MRR <span className="font-semibold text-foreground">{diariaMrr}</span> · Não rec.{" "}
                <span className="font-semibold text-foreground">{diariaNr}</span>
              </dd>
            )}
            {detalheDiaria && <dd className="text-xs text-muted-foreground">{detalheDiaria}</dd>}
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Falta na semana</dt>
            <dd className="text-2xl font-semibold tabular-nums xl:text-3xl">{falta > 0 ? brl(falta) : "Meta batida"}</dd>
          </div>
        </dl>
        <div className="space-y-4 self-center">
          {parcial("MRR", r.mrr, semana.metaMrr)}
          {parcial("Não recorrente", r.naoRecorrente, semana.metaNaoRecorrente)}
        </div>
      </div>
      <ReunioesDaSemana dados={dados} mes={mes} hoje={hoje} />
    </Bloco>
  );
}
