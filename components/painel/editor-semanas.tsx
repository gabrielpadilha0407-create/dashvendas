"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { salvarMetasSemanais, type MetasSemanaisDoMes } from "@/app/painel/actions";
import { faixaDe, parseValor, percentual } from "@/lib/painel/calc";
import { brl, dataCurta, nomeMes, pct } from "@/lib/painel/formato";
import { cn } from "@/lib/utils";
import { Barra } from "./ui";

export type SemanaEditavel = {
  numero: number;
  inicio: string;
  fim: string;
  diasUteis: number;
  /** dias úteis que ainda restam na semana, contando hoje */
  diasRestantes: number;
  status: "futura" | "atual" | "passada";
  metaMrr: number;
  metaNaoRecorrente: number;
  realizadoMrr: number;
  realizadoNaoRecorrente: number;
};

type Props = {
  mes: string;
  semanas: SemanaEditavel[];
  metaMesMrr: number;
  metaMesNaoRecorrente: number;
};

const texto = (n: number) => (n ? String(n) : "");
const th = "px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const td = "px-3 py-3 text-right tabular-nums";

export function EditorSemanas({ mes, semanas, metaMesMrr, metaMesNaoRecorrente }: Props) {
  const [campos, setCampos] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      semanas.flatMap((s) => [
        [`${s.numero}:mrr`, texto(s.metaMrr)],
        [`${s.numero}:nr`, texto(s.metaNaoRecorrente)],
      ]),
    ),
  );
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [salvando, iniciar] = useTransition();

  const valor = (k: string) => parseValor(campos[k] ?? "") ?? 0;
  const alterar = (k: string, v: string) => {
    setCampos((atual) => ({ ...atual, [k]: v }));
    setMensagem(null);
  };

  const somaMrr = semanas.reduce((s, w) => s + valor(`${w.numero}:mrr`), 0);
  const somaNr = semanas.reduce((s, w) => s + valor(`${w.numero}:nr`), 0);
  const realizadoMes = semanas.reduce((s, w) => s + w.realizadoMrr + w.realizadoNaoRecorrente, 0);
  const totalDias = semanas.reduce((s, w) => s + w.diasUteis, 0);

  /** Sugestão inicial: divide a meta do mês proporcionalmente aos dias úteis de cada semana. */
  function distribuir() {
    const reparte = (total: number) => {
      const partes = semanas.map((w) => (totalDias > 0 ? Math.round((total * w.diasUteis) / totalDias) : 0));
      const ajuste = Math.round(total) - partes.reduce((s, p) => s + p, 0);
      if (partes.length > 0) partes[partes.length - 1] += ajuste;
      return partes;
    };
    const mrr = reparte(metaMesMrr);
    const nr = reparte(metaMesNaoRecorrente);
    setCampos(
      Object.fromEntries(
        semanas.flatMap((w, i) => [
          [`${w.numero}:mrr`, texto(mrr[i])],
          [`${w.numero}:nr`, texto(nr[i])],
        ]),
      ),
    );
    setMensagem({ tipo: "ok", texto: "Meta do mês distribuída pelos dias úteis. Ajuste o que quiser e clique em Salvar." });
  }

  function salvar() {
    const lista: MetasSemanaisDoMes["semanas"] = [];
    for (const w of semanas) {
      const mrr = parseValor(campos[`${w.numero}:mrr`] ?? "");
      const nr = parseValor(campos[`${w.numero}:nr`] ?? "");
      if (mrr === null || nr === null) {
        setMensagem({ tipo: "erro", texto: `Valor inválido na semana ${w.numero}. Use só números, ex.: 15000.` });
        return;
      }
      lista.push({ semana: w.numero, metaMrr: mrr, metaNaoRecorrente: nr });
    }
    iniciar(async () => {
      const r = await salvarMetasSemanais({ mes, semanas: lista });
      setMensagem(r.error ? { tipo: "erro", texto: r.error } : { tipo: "ok", texto: `Metas semanais de ${nomeMes(mes)} salvas.` });
    });
  }

  const diferenca = (soma: number, meta: number) =>
    meta > 0 && Math.round(soma - meta) !== 0
      ? ` · ${soma > meta ? "passa" : "fica abaixo"} da meta do mês em ${brl(Math.abs(soma - meta))}`
      : meta > 0
        ? " · bate com a meta do mês"
        : "";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          Metas semanais do time — {nomeMes(mes)} {mes.slice(0, 4)}
        </h2>
        {(metaMesMrr > 0 || metaMesNaoRecorrente > 0) && (
          <Button variant="outline" onClick={distribuir} disabled={salvando}>
            Distribuir meta do mês pelos dias úteis
          </Button>
        )}
        <p className="order-last w-full text-sm text-muted-foreground">
          Semanas de segunda a domingo, cortadas no início e no fim do mês. A meta diária da semana é o que falta ÷ dias úteis
          que restam nela (segunda a sexta, contando hoje).
        </p>
      </div>

      <div className="-mx-3 overflow-x-auto">
        <table className="w-full min-w-[1180px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className={cn(th, "text-left")}>Semana</th>
              <th className={th}>Dias úteis</th>
              <th className={th}>Meta MRR</th>
              <th className={th}>Meta não rec.</th>
              <th className={th}>Meta total</th>
              <th className={th}>Realizado</th>
              <th className={cn(th, "w-40 text-left")}>% da meta</th>
              <th className={th}>Falta</th>
              <th className={th}>Meta diária</th>
            </tr>
          </thead>
          <tbody>
            {semanas.map((w) => {
              const metaMrr = valor(`${w.numero}:mrr`);
              const metaNr = valor(`${w.numero}:nr`);
              const meta = metaMrr + metaNr;
              const feito = w.realizadoMrr + w.realizadoNaoRecorrente;
              const p = percentual(feito, meta);
              const falta = Math.max(0, meta - feito);
              const futura = w.status === "futura";
              let diaria: ReactNode = <span className="text-muted-foreground">—</span>;
              if (meta > 0 && falta === 0) diaria = <span className="text-[#3fd13f]">Meta batida</span>;
              else if (meta > 0 && w.diasRestantes > 0) diaria = brl(falta / w.diasRestantes);
              return (
                <tr
                  key={w.numero}
                  className={cn("border-b border-border/50 last:border-0", w.status === "atual" && "bg-primary/10")}
                >
                  <td className="px-3 py-3 text-left">
                    <div className="whitespace-nowrap font-semibold">
                      Semana {w.numero}
                      {w.status === "atual" && (
                        <span className="ml-2 rounded border border-primary/60 px-1.5 py-0.5 text-xs font-medium">atual</span>
                      )}
                    </div>
                    <div className="text-xs tabular-nums text-muted-foreground">
                      {dataCurta(w.inicio)} a {dataCurta(w.fim)}
                    </div>
                  </td>
                  <td className={td}>{w.diasUteis}</td>
                  <td className={td}>
                    <div className="flex justify-end">
                      <Input
                        aria-label={`Meta de MRR da semana ${w.numero}`}
                        value={campos[`${w.numero}:mrr`] ?? ""}
                        onChange={(e) => alterar(`${w.numero}:mrr`, e.target.value)}
                        inputMode="decimal"
                        placeholder="0"
                        className="h-10 w-32 text-right text-base tabular-nums"
                      />
                    </div>
                  </td>
                  <td className={td}>
                    <div className="flex justify-end">
                      <Input
                        aria-label={`Meta de não recorrente da semana ${w.numero}`}
                        value={campos[`${w.numero}:nr`] ?? ""}
                        onChange={(e) => alterar(`${w.numero}:nr`, e.target.value)}
                        inputMode="decimal"
                        placeholder="0"
                        className="h-10 w-32 text-right text-base tabular-nums"
                      />
                    </div>
                  </td>
                  <td className={cn(td, "font-semibold")}>{meta > 0 ? brl(meta) : "—"}</td>
                  <td className={td}>
                    {futura ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className="font-semibold">{brl(feito)}</span>
                        <span className="whitespace-nowrap text-xs text-muted-foreground">
                          MRR {brl(w.realizadoMrr)}
                          {metaMrr > 0 ? ` / ${brl(metaMrr)}` : ""}
                        </span>
                        <span className="whitespace-nowrap text-xs text-muted-foreground">
                          Não rec. {brl(w.realizadoNaoRecorrente)}
                          {metaNr > 0 ? ` / ${brl(metaNr)}` : ""}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {futura ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="w-12 shrink-0 text-right text-sm font-medium tabular-nums">{pct(p)}</span>
                        <Barra pct={p} faixa={faixaDe(p)} />
                      </div>
                    )}
                  </td>
                  <td className={cn(td, "font-semibold")}>
                    {meta <= 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : falta === 0 ? (
                      <span className="text-[#3fd13f]">Meta batida</span>
                    ) : (
                      brl(falta)
                    )}
                  </td>
                  <td className={cn(td, "font-semibold")}>{diaria}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border font-semibold">
              <td className="px-3 py-3 text-left">Mês</td>
              <td className={td}>{totalDias}</td>
              <td className={td}>{brl(somaMrr)}</td>
              <td className={td}>{brl(somaNr)}</td>
              <td className={td}>{brl(somaMrr + somaNr)}</td>
              <td className={td}>{brl(realizadoMes)}</td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="space-y-0.5 text-sm tabular-nums text-muted-foreground">
        <p>
          Soma das semanas — MRR {brl(somaMrr)}
          {diferenca(somaMrr, metaMesMrr)}
        </p>
        <p>
          Soma das semanas — não recorrente {brl(somaNr)}
          {diferenca(somaNr, metaMesNaoRecorrente)}
        </p>
        {metaMesMrr === 0 && metaMesNaoRecorrente === 0 && (
          <p>A meta do mês ainda não foi cadastrada (aba Metas).</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-5">
        <Button onClick={salvar} disabled={salvando} className="h-11 px-6 text-base">
          {salvando ? "Salvando…" : "Salvar metas semanais"}
        </Button>
        {mensagem && (
          <p className={mensagem.tipo === "erro" ? "text-sm text-destructive" : "text-sm text-[#3fd13f]"} role="status">
            {mensagem.texto}
          </p>
        )}
      </div>
    </div>
  );
}
