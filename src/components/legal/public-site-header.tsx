import Link from "next/link";
import { ArrowRight } from "lucide-react";

type PublicSiteHeaderProps = {
  isAuthenticated: boolean;
};

export function PublicSiteHeader({ isAuthenticated }: PublicSiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-pray-rats-256.png"
            alt="PrayRats"
            width={32}
            height={32}
            className="rounded-lg object-contain"
          />
          <span className="tracking-tight font-bold text-foreground">PrayRats</span>
        </Link>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
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
                className="px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
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
  );
}
