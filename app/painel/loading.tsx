import { Bloco, Esqueleto } from "@/components/painel/ui";

export default function Carregando() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando dados">
      <div className="flex justify-between">
        <Esqueleto className="h-10 w-48" />
        <Esqueleto className="h-10 w-56" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        {[0, 1, 2].map((i) => (
          <Bloco key={i}>
            <Esqueleto className="h-6 w-40" />
            <Esqueleto className="mt-4 h-14 w-3/4" />
            <Esqueleto className="mt-3 h-5 w-1/3" />
            <Esqueleto className="mt-4 h-3 w-full" />
            <div className="mt-5 grid grid-cols-2 gap-4">
              <Esqueleto className="h-10" />
              <Esqueleto className="h-10" />
            </div>
          </Bloco>
        ))}
      </div>
      <div className="grid gap-6 min-[1800px]:grid-cols-[11fr_9fr]">
        {[0, 1].map((i) => (
          <Bloco key={i}>
            <Esqueleto className="h-6 w-48" />
            <div className="mt-5 space-y-3">
              {[0, 1, 2, 3].map((j) => (
                <Esqueleto key={j} className="h-9 w-full" />
              ))}
            </div>
          </Bloco>
        ))}
      </div>
    </div>
  );
}
