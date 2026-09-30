"use client";

import { useEffect, useRef, useState } from "react";

export type MetaComemoravel = { chave: string; rotulo: string; batida: boolean };

const DURACAO_MS = 7000;
const LANCAMENTOS_ATE_MS = 4800;
const CORES = ["#fab219", "#3fd13f", "#3987e5", "#a78bfa", "#eb6834", "#e87ba4", "#ffffff"];

/** Lê/grava quais metas já foram comemoradas neste aparelho (a TV não repete a cada atualização). */
function jaComemorado(k: string): boolean {
  try {
    return window.localStorage.getItem(k) === "1";
  } catch {
    return false;
  }
}
function marcarComemorado(k: string) {
  try {
    window.localStorage.setItem(k, "1");
  } catch {
    // sem armazenamento: comemora de novo na próxima vez, sem problema
  }
}

/**
 * Fogos de artifício quando uma meta do mês atual é batida.
 * Cada meta comemora uma vez por aparelho; `?comemorar=1` na URL força a animação para teste.
 */
export function Comemoracao({ mes, metas, forcar }: { mes: string; metas: MetaComemoravel[]; forcar: boolean }) {
  const [rotulos, setRotulos] = useState<string[]>([]);

  useEffect(() => {
    const novas = metas.filter((m) => m.batida && !jaComemorado(`comemorado:${mes}:${m.chave}`));
    if (novas.length > 0) {
      novas.forEach((m) => marcarComemorado(`comemorado:${mes}:${m.chave}`));
      setRotulos(novas.map((m) => m.rotulo));
    } else if (forcar) {
      setRotulos(["Teste de comemoração"]);
    }
  }, [mes, metas, forcar]);

  useEffect(() => {
    if (rotulos.length === 0) return;
    const t = window.setTimeout(() => setRotulos([]), DURACAO_MS);
    return () => window.clearTimeout(t);
  }, [rotulos]);

  if (rotulos.length === 0) return null;

  const titulo =
    rotulos.length === 1
      ? rotulos[0] === "Teste de comemoração"
        ? "Teste de comemoração"
        : `Meta de ${rotulos[0]} batida!`
      : `Metas batidas: ${rotulos.join(", ")}!`;

  return (
    <div className="pointer-events-none fixed inset-0 z-50" aria-live="polite">
      <Fogos />
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="pointer-events-auto animate-in fade-in zoom-in-90 rounded-2xl border border-[#fab219]/60 bg-card/90 px-8 py-6 text-center shadow-2xl backdrop-blur duration-500 sm:px-12 sm:py-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#fab219]">Parabéns, time!</p>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl 2xl:text-6xl">{titulo}</p>
          <button
            type="button"
            onClick={() => setRotulos([])}
            className="mt-5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

type Foguete = { x: number; y: number; vy: number; alvoY: number; cor: string };
type Particula = { x: number; y: number; vx: number; vy: number; vida: number; max: number; cor: string; tam: number };

function Fogos() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    // Quem prefere menos movimento vê só a faixa, sem fogos
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ajustar = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    ajustar();
    window.addEventListener("resize", ajustar);

    const w = () => window.innerWidth;
    const h = () => window.innerHeight;
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const cor = () => CORES[Math.floor(Math.random() * CORES.length)];

    const foguetes: Foguete[] = [];
    const particulas: Particula[] = [];
    const inicio = performance.now();
    let proximo = 0;
    let quadro = 0;

    const explodir = (f: Foguete) => {
      const n = Math.floor(rnd(70, 110));
      const segunda = Math.random() < 0.5 ? cor() : f.cor;
      for (let i = 0; i < n; i++) {
        const ang = (Math.PI * 2 * i) / n + rnd(-0.05, 0.05);
        const vel = rnd(1.5, 6);
        const max = rnd(55, 95);
        particulas.push({
          x: f.x,
          y: f.y,
          vx: Math.cos(ang) * vel,
          vy: Math.sin(ang) * vel,
          vida: max,
          max,
          cor: i % 3 === 0 ? segunda : f.cor,
          tam: rnd(1.5, 3),
        });
      }
    };

    const passo = (agora: number) => {
      const t = agora - inicio;

      // Lança foguetes em rajadas durante os primeiros segundos
      if (t < LANCAMENTOS_ATE_MS && t >= proximo) {
        const qtd = Math.random() < 0.35 ? 2 : 1;
        for (let i = 0; i < qtd; i++) {
          foguetes.push({ x: rnd(w() * 0.1, w() * 0.9), y: h() + 10, vy: -rnd(h() * 0.013, h() * 0.018), alvoY: rnd(h() * 0.12, h() * 0.45), cor: cor() });
        }
        proximo = t + rnd(220, 420);
      }

      // Rastro: apaga parcialmente o quadro anterior (mantém o fundo transparente)
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(0, 0, w(), h());
      ctx.globalCompositeOperation = "lighter";

      for (let i = foguetes.length - 1; i >= 0; i--) {
        const f = foguetes[i];
        f.y += f.vy;
        f.vy *= 0.985;
        ctx.fillStyle = f.cor;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,220,150,0.6)";
        ctx.fillRect(f.x - 1, f.y + 3, 2, 10);
        if (f.y <= f.alvoY || f.vy > -2) {
          explodir(f);
          foguetes.splice(i, 1);
        }
      }

      for (let i = particulas.length - 1; i >= 0; i--) {
        const p = particulas[i];
        p.vx *= 0.975;
        p.vy = p.vy * 0.975 + 0.06;
        p.x += p.vx;
        p.y += p.vy;
        p.vida -= 1;
        if (p.vida <= 0) {
          particulas.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(0, p.vida / p.max);
        ctx.fillStyle = p.cor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.tam, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (t < DURACAO_MS) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);

    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("resize", ajustar);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
