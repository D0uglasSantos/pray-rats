import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Church,
  Cross,
  Flame,
  Heart,
  Smartphone,
  Star,
  Trophy,
  Users,
  Hand,
  Sparkles,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { getSessionUser } from "@/actions/auth";

const steps = [
  {
    step: "01",
    title: "Crie ou entre em um grupo",
    description:
      "Reúna amigos, família ou comunidade. Juntos a constância é mais fácil e mais alegre.",
    icon: Users,
  },
  {
    step: "02",
    title: "Registre seus momentos de fé",
    description:
      "Faça check-in das suas práticas diárias: oração, leitura, missa, terço e muito mais.",
    icon: CheckCircle2,
  },
  {
    step: "03",
    title: "Acompanhe sua evolução",
    description:
      "Veja sua sequência de dias, acumule pontos e celebre a caminhada espiritual do grupo.",
    icon: TrendingUp,
  },
];

const activities = [
  { icon: Hand, label: "Oração" },
  { icon: BookOpen, label: "Leitura Bíblica" },
  { icon: Church, label: "Missa" },
  { icon: Cross, label: "Terço" },
  { icon: Sparkles, label: "Adoração" },
  { icon: Heart, label: "Caridade" },
];

export default async function LandingPage() {
  const user = await getSessionUser();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border">
        <div className="mx-auto max-w-lg px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-pray-rats-256.png"
              alt="PrayRats"
              width={32}
              height={32}
              className="rounded-lg object-contain"
            />
            <span className="font-bold text-foreground tracking-tight">PrayRats</span>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <Link
                href="/home"
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Entrar no app
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted hover:text-foreground transition-colors px-3 py-1.5"
                >
                  Entrar
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-accent-light via-background to-background pointer-events-none" />
        <div className="relative mx-auto max-w-lg px-5 pt-16 pb-14 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-surface px-3.5 py-1.5 text-xs font-semibold text-primary">
            <Flame className="h-3.5 w-3.5" />
            Constância que transforma
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground mb-4">
            Constância{" "}
            <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
              espiritual
            </span>{" "}
            em grupo
          </h1>

          <p className="text-base text-muted leading-relaxed mb-8 max-w-sm mx-auto">
            Registre suas práticas de fé, mantenha sua sequência e incentive
            sua comunidade a crescer junto a cada dia.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              <Link
                href="/home"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-primary/30 transition-transform active:scale-95 hover:opacity-90"
              >
                Entrar no app
                <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-primary/30 transition-transform active:scale-95 hover:opacity-90"
                >
                  Criar conta grátis
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl border border-border bg-surface px-6 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-surface-secondary"
                >
                  Já tenho conta
                </Link>
              </>
            )}
          </div>

          <p className="mt-4 text-xs text-muted">Gratuito • Sem anúncios • Feito com fé</p>
        </div>
      </section>

      {/* ── Problema ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-lg px-5 py-12">
        <div className="rounded-3xl bg-surface-secondary border border-border p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            O desafio
          </p>
          <h2 className="text-2xl font-bold text-foreground mb-4 leading-snug">
            Manter uma rotina espiritual é difícil sozinho
          </h2>
          <div className="space-y-3">
            {[
              "A correria do dia a dia afasta da oração e da leitura",
              "Sem acompanhamento, a motivação esfria rapidamente",
              "Falta de comunidade faz a constância parecer impossível",
            ].map((text) => (
              <div key={text} className="flex items-start gap-3">
                <div className="mt-0.5 h-5 w-5 rounded-full bg-error/15 flex items-center justify-center shrink-0">
                  <span className="text-error text-xs font-bold">×</span>
                </div>
                <p className="text-sm text-muted leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t border-border">
            <p className="text-sm font-semibold text-foreground">
              ✝ O PrayRats resolve isso com comunidade, registro e leveza.
            </p>
          </div>
        </div>
      </section>

      {/* ── Como funciona ────────────────────────────────────── */}
      <section className="mx-auto max-w-lg px-5 py-6">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
            Como funciona
          </p>
          <h2 className="text-2xl font-bold text-foreground">Em 3 passos simples</h2>
        </div>

        <div className="space-y-4">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="flex gap-4 items-start rounded-2xl border border-border bg-surface p-5"
              >
                <div className="shrink-0 h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="text-xs font-bold text-primary/50 tracking-widest">
                    PASSO {item.step}
                  </span>
                  <h3 className="font-bold text-foreground mt-0.5 mb-1">{item.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Atividades ───────────────────────────────────────── */}
      <section className="mx-auto max-w-lg px-5 py-10">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
            Práticas de fé
          </p>
          <h2 className="text-2xl font-bold text-foreground">
            Cada ato espiritual conta
          </h2>
          <p className="text-sm text-muted mt-2">
            Registre qualquer prática e acumule pontos pela sua constância.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {activities.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4 text-center"
            >
              <div className="h-10 w-10 rounded-xl gradient-spiritual flex items-center justify-center">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-foreground">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Ranking & Jornada ────────────────────────────────── */}
      <section className="mx-auto max-w-lg px-5 py-6">
        <div className="rounded-3xl border border-border bg-surface overflow-hidden">
          <div className="gradient-spiritual p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">Ranking saudável</h3>
                <p className="text-white/70 text-xs">Sem comparação tóxica</p>
              </div>
            </div>
            <p className="text-sm text-white/90 leading-relaxed">
              O ranking celebra quem se mantém constante, não quem "vence".
              É uma caminhada em comunidade, não uma competição.
            </p>
          </div>

          <div className="p-5 space-y-3">
            {[
              { icon: Star, label: "Pontos por constância diária" },
              { icon: Flame, label: "Sequência de dias seguidos" },
              { icon: Users, label: "Ranking do seu grupo" },
              { icon: TrendingUp, label: "Jornada espiritual visualizada" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-surface-secondary flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-foreground font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PWA ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-lg px-5 py-10">
        <div className="rounded-3xl border border-primary/20 bg-surface-secondary p-6 text-center">
          <div className="h-14 w-14 rounded-2xl gradient-spiritual flex items-center justify-center mx-auto mb-4">
            <Smartphone className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Pensado para o celular
          </h2>
          <p className="text-sm text-muted leading-relaxed mb-5">
            Instale como app diretamente no seu iPhone ou Android. Sem loja,
            sem download. Leve e rápido, para registrar sua fé em segundos.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {["Instala como app", "Funciona offline", "Notificações", "Leve e rápido"].map(
              (tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-primary/20 bg-surface px-3 py-1 text-xs font-medium text-primary"
                >
                  {tag}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ── CTA Final ────────────────────────────────────────── */}
      <section className="mx-auto max-w-lg px-5 py-10">
        <div className="rounded-3xl gradient-spiritual p-8 text-center text-white">
          <div className="mb-2 text-3xl">✝</div>
          <h2 className="text-2xl font-extrabold text-white mb-3 leading-snug">
            Comece sua caminhada espiritual hoje
          </h2>
          <p className="text-white/80 text-sm mb-7 max-w-xs mx-auto leading-relaxed">
            Junte-se a grupos que se apoiam mutuamente na fé. Gratuito, sem
            anúncios e feito com propósito.
          </p>

          {user ? (
            <Link
              href="/home"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-base font-bold text-primary shadow-lg transition-transform active:scale-95 hover:opacity-90"
            >
              Entrar no app
              <ArrowRight className="h-5 w-5" />
            </Link>
          ) : (
            <div className="space-y-3">
              <Link
                href="/signup"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-base font-bold text-primary shadow-lg transition-transform active:scale-95 hover:opacity-90"
              >
                Criar conta grátis
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Já tenho uma conta
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-lg px-5 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-pray-rats-256.png"
              alt="PrayRats"
              width={24}
              height={24}
              className="rounded-md object-contain"
            />
            <span className="font-bold text-sm text-foreground">PrayRats</span>
          </div>
          <p className="text-xs text-muted">Constância espiritual em grupo · Feito com fé ✝</p>
        </div>
      </footer>
    </div>
  );
}
