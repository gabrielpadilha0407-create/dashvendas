import Link from "next/link";
import { getMeta, getPessoas, getVendasDoMes, getRankingData } from "@/lib/data";
import { currentMonth } from "@/lib/utils";
import { MonthSelector } from "@/components/month-selector";
import { SummaryCards } from "@/components/summary-cards";
import { SalesSection } from "@/components/sales-section";
import { RankingsSection } from "@/components/rankings-section";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;
  const mes = params.mes || currentMonth();

  const [meta, pessoas, vendas, rankings] = await Promise.all([
    getMeta(mes),
    getPessoas(),
    getVendasDoMes(mes),
    getRankingData(mes),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl space-y-8 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard de Vendas</h1>
            <p className="text-sm text-muted-foreground">Acompanhamento de metas e vendas da agência</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/configuracoes"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Configurações
            </Link>
            <LogoutButton />
          </div>
        </header>

        <MonthSelector mes={mes} />

        <SummaryCards mes={mes} meta={meta} vendas={vendas} />

        <SalesSection vendas={vendas} pessoas={pessoas} />

        <RankingsSection rankings={rankings} />
      </div>
    </div>
  );
}
