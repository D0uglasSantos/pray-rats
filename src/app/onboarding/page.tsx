import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/actions/auth";
import { getUserGroups } from "@/actions/groups";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Plus } from "lucide-react";

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const groups = await getUserGroups(user.id);
  if (groups.length > 0) redirect("/home");

  return (
    <div className="min-h-screen gradient-subtle flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-pray-rats-256.png"
          alt="PrayRats"
          className="h-20 w-20 mx-auto rounded-3xl shadow-lg mb-6 object-contain"
        />
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Bem-vindo à jornada!
        </h1>
        <p className="text-muted mb-8">
          Convide seus amigos para essa jornada. Crie um grupo ou entre com um
          código de convite.
        </p>

        <div className="space-y-3">
          <Link href="/groups/create">
            <Card className="flex items-center gap-4 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold">Criar grupo</p>
                <p className="text-sm text-muted">
                  Inicie um desafio espiritual
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/groups/join">
            <Card className="flex items-center gap-4 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer">
              <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary-dark" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold">Entrar em grupo</p>
                <p className="text-sm text-muted">Use um código de convite</p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
