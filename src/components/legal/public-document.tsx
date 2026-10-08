import Link from "next/link";
import type { ReactNode } from "react";
import { getSessionUser } from "@/actions/auth";
import { PublicSiteFooter } from "@/components/legal/public-site-footer";
import { PublicSiteHeader } from "@/components/legal/public-site-header";

type PublicDocumentProps = {
  title: string;
  description: string;
  updatedAt: string;
  children: ReactNode;
};

export async function PublicDocument({
  title,
  description,
  updatedAt,
  children,
}: PublicDocumentProps) {
  const user = await getSessionUser();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicSiteHeader isAuthenticated={Boolean(user)} />
      <main className="mx-auto w-full max-w-2xl px-5 py-10">
        <header className="mb-8 space-y-3">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">
            PrayRats
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm leading-6 text-muted">{description}</p>
          <p className="text-xs text-muted">Última atualização: {updatedAt}</p>
        </header>

        <article className="space-y-8">{children}</article>

        <nav
          aria-label="Documentos e suporte"
          className="mt-10 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-6 text-sm"
        >
          <Link href="/privacy" className="font-medium text-primary hover:underline">
            Privacidade
          </Link>
          <Link href="/terms" className="font-medium text-primary hover:underline">
            Termos de Uso
          </Link>
          <Link href="/support" className="font-medium text-primary hover:underline">
            Suporte
          </Link>
          <Link href="/account-deletion" className="font-medium text-primary hover:underline">
            Excluir conta
          </Link>
        </nav>
      </main>
      <PublicSiteFooter />
    </div>
  );
}

export function DocumentSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="space-y-3 text-sm leading-6 text-muted">{children}</div>
    </section>
  );
}

export function DocumentList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5">{children}</ul>;
}
