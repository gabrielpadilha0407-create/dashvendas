import Link from "next/link";
import { faixaDe, visaoAno, type LinhaAno, type PainelDados, type StatusMes } from "@/lib/painel/calc";
import { brl, brlCurto, nomeMes, nomeMesCurto, pct } from "@/lib/painel/formato";
import { cn } from "@/lib/utils";
import { Bloco, SeloFaixa } from "./ui";

const COR_META = "#5b5b66";
const COR_REALIZADO = "#3987e5";
const COR_GRADE = "#2a2833";

const ROTULO_STATUS: Record<StatusMes, string> = {
  futuro: "A realizar",
  andamento: "Em andamento",
  batida: "Batida",
  nao_batida: "Não batida",
  sem_meta: "Sem meta",
};

// Geometria comum aos dois gráficos (unidades do viewBox)
const L = 72;
const R = 12;
const T = 12;
const B = 28;
const W = 640;
const H = 260;
const PW = W - L - R;
const PH = H - T - B;

/** Teto "redondo" para o eixo: 1, 2, 2,5 ou 5 × 10^n, dividido em 4 faixas. */
function tetoEixo(max: number): number {
  if (max <= 0) return 1000;
  const bruto = max / 4;
  const base = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * base).find((p) => p * 4 >= max) ?? base * 10;
  return passo * 4;
}

function Eixos({ teto }: { teto: number }) {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => {
        const v = (teto / 4) * i;
        const y = T + PH - (PH * i) / 4;
        return (
          <g key={i}>
            <line x1={L} x2={W - R} y1={y} y2={y} stroke={COR_GRADE} strokeWidth={1} />
            <text x={L - 8} y={y + 4} textAnchor="end" fontSize={11} className="fill-muted-foreground">
              {brlCurto(v)}
            </text>
          </g>
        );
      })}
    </>
  );
}

function RotulosMeses({ linhas }: { linhas: LinhaAno[] }) {
  const g = PW / 12;
  return (
    <>
      {linhas.map((l, i) => (
        <text key={l.mes} x={L + g * i + g / 2} y={H - 8} textAnchor="middle" fontSize={11} className="fill-muted-foreground">
          {nomeMesCurto(l.mes)}
        </text>
      ))}
    </>
  );
}

/** Barra com topo arredondado (4 unidades) e base reta no eixo. */
function caminhoBarra(x: number, y: number, w: number, h: number): string {
  if (h <= 0) return "";
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

function Legenda({ itens }: { itens: { cor: string; rotulo: string }[] }) {
  return (
    <div className="mb-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
      {itens.map((i) => (
        <span key={i.rotulo} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: i.cor }} />
          {i.rotulo}
        </span>
      ))}
    </div>
  );
}

function GraficoMetaRealizado({ linhas }: { linhas: LinhaAno[] }) {
  const teto = tetoEixo(Math.max(...linhas.map((l) => Math.max(l.meta ?? 0, l.status === "futuro" ? 0 : l.realizado))));
  const g = PW / 12;
  const bw = Math.min(16, (g - 10) / 2);
  const y = (v: number) => T + PH - (v / teto) * PH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Meta e realizado de aquisição por mês">
      <Eixos teto={teto} />
      {linhas.map((l, i) => {
        const cx = L + g * i + g / 2;
        const meta = l.meta ?? 0;
        return (
          <g key={l.mes}>
            <path d={caminhoBarra(cx - bw - 1, y(meta), bw, T + PH - y(meta))} fill={COR_META}>
              <title>{`${nomeMes(l.mes)} · meta ${l.meta === null ? "não cadastrada" : brl(meta)}`}</title>
            </path>
            {l.status !== "futuro" && (
              <path d={caminhoBarra(cx + 1, y(l.realizado), bw, T + PH - y(l.realizado))} fill={COR_REALIZADO}>
                <title>{`${nomeMes(l.mes)} · realizado ${brl(l.realizado)} (${pct(l.pct)})`}</title>
              </path>
            )}
            {/* área de hover maior que a barra */}
            <rect x={cx - g / 2} y={T} width={g} height={PH} fill="transparent">
              <title>{`${nomeMes(l.mes)} · meta ${l.meta === null ? "—" : brl(meta)} · realizado ${l.status === "futuro" ? "—" : brl(l.realizado)}`}</title>
            </rect>
          </g>
        );
      })}
      <RotulosMeses linhas={linhas} />
    </svg>
  );
}

function GraficoMrr({ linhas }: { linhas: LinhaAno[] }) {
  const pontos = linhas
    .map((l, i) => ({ l, i }))
    .filter((p): p is { l: LinhaAno & { mrrAcumulado: number }; i: number } => p.l.mrrAcumulado !== null);
  const teto = tetoEixo(Math.max(0, ...pontos.map((p) => p.l.mrrAcumulado)));
  const g = PW / 12;
  const x = (i: number) => L + g * i + g / 2;
  const y = (v: number) => T + PH - (v / teto) * PH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="MRR acumulado em 2026">
      <Eixos teto={teto} />
      {pontos.length > 1 && (
        <polyline
          points={pontos.map((p) => `${x(p.i)},${y(p.l.mrrAcumulado)}`).join(" ")}
          fill="none"
          stroke={COR_REALIZADO}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      )}
      {pontos.map((p) => (
        <g key={p.l.mes}>
          <circle cx={x(p.i)} cy={y(p.l.mrrAcumulado)} r={4} fill={COR_REALIZADO} stroke="hsl(var(--card))" strokeWidth={2} />
          <circle cx={x(p.i)} cy={y(p.l.mrrAcumulado)} r={14} fill="transparent">
            <title>{`${nomeMes(p.l.mes)} · MRR acumulado ${brl(p.l.mrrAcumulado)}`}</title>
          </circle>
        </g>
      ))}
      {pontos.length > 0 && (
        <text
          x={x(pontos[pontos.length - 1].i)}
          y={y(pontos[pontos.length - 1].l.mrrAcumulado) - 12}
          textAnchor="middle"
          fontSize={12}
          fontWeight={600}
          className="fill-foreground"
        >
          {brlCurto(pontos[pontos.length - 1].l.mrrAcumulado)}
        </text>
      )}
      <RotulosMeses linhas={linhas} />
    </svg>
  );
}

export function VisaoAno({ dados, mesAtual, mesSelecionado }: { dados: PainelDados; mesAtual: string; mesSelecionado: string }) {
  const linhas = visaoAno(dados, mesAtual);

  return (
    <Bloco titulo="Visão do ano">
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-1 text-sm font-semibold text-muted-foreground">Aquisição total — meta × realizado</h3>
          <Legenda
            itens={[
              { cor: COR_META, rotulo: "Meta" },
              { cor: COR_REALIZADO, rotulo: "Realizado" },
            ]}
          />
          <GraficoMetaRealizado linhas={linhas} />
        </div>
        <div>
          <h3 className="mb-1 text-sm font-semibold text-muted-foreground">MRR acumulado em 2026</h3>
          <div className="mb-2 h-5" />
          <GraficoMrr linhas={linhas} />
        </div>
      </div>

      <div className="-mx-3 mt-6 overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-sm tabular-nums">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mês</th>
              {linhas.map((l) => (
                <th key={l.mes} className="px-2 py-2 text-right">
                  <Link
                    href={`/painel?mes=${l.mes}`}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
                      l.mes === mesSelecionado ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {nomeMesCurto(l.mes)}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/50">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Meta</th>
              {linhas.map((l) => (
                <td key={l.mes} className="px-2 py-2 text-right text-muted-foreground">
                  {l.meta === null ? "—" : brlCurto(l.meta)}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border/50">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Realizado</th>
              {linhas.map((l) => (
                <td key={l.mes} className="px-2 py-2 text-right font-semibold">
                  {l.status === "futuro" ? "—" : brlCurto(l.realizado)}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border/50">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">%</th>
              {linhas.map((l) => (
                <td key={l.mes} className="px-2 py-2 text-right">
                  {l.status === "futuro" ? "—" : pct(l.pct)}
                </td>
              ))}
            </tr>
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
              {linhas.map((l) => (
                <td key={l.mes} className="px-2 py-2 text-right">
                  <SeloFaixa
                    faixa={l.status === "futuro" ? "neutro" : faixaDe(l.pct)}
                    texto={ROTULO_STATUS[l.status]}
                    className="text-xs"
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Bloco>
  );
}
