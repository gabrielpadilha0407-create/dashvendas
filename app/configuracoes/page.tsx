import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPessoas } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PeopleTable } from "@/components/people-table";
import { PersonFormDialog } from "@/components/person-form-dialog";

export default async function ConfiguracoesPage() {
  const pessoas = await getPessoas();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl space-y-8 py-8">
        <header className="space-y-4">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao dashboard
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
            <p className="text-sm text-muted-foreground">Gerencie as pessoas do time (SDRs, Closers e Operacional).</p>
          </div>
        </header>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Pessoas</CardTitle>
            <PersonFormDialog />
          </CardHeader>
          <CardContent>
            <PeopleTable pessoas={pessoas} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
