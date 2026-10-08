import Link from "next/link";

const footerGroups = [
  {
    title: "Jurídico",
    links: [
      { href: "/privacy", label: "Política de Privacidade" },
      { href: "/terms", label: "Termos de Uso" },
    ],
  },
  {
    title: "Ajuda",
    links: [
      { href: "/support", label: "Suporte" },
      { href: "/account-deletion", label: "Excluir conta" },
    ],
  },
  {
    title: "PrayRats",
    links: [
      { href: "/signup", label: "Criar conta" },
      { href: "/login", label: "Entrar" },
    ],
  },
];

export function PublicSiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-lg px-5 py-8">
        <div className="mb-6 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-pray-rats-256.png"
            alt="PrayRats"
            width={24}
            height={24}
            className="rounded-md object-contain"
          />
          <span className="text-sm font-bold text-foreground">PrayRats</span>
        </div>
        <p className="mb-6 text-xs text-muted">
          Grupos de fé para constância espiritual. Registre oração, leitura e
          prática com seus amigos. Feito com fé ✝
        </p>

        <div className="grid grid-cols-3 gap-4 text-xs">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 font-semibold text-foreground">{group.title}</p>
              <ul className="space-y-1.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-muted hover:text-primary hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-[11px] text-muted">
          © {new Date().getFullYear()} PrayRats. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
