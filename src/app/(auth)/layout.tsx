const features = [
  { icon: "🔥", label: "Streak diário", desc: "Mantenha sua sequência de dias e veja sua constância crescer" },
  { icon: "👥", label: "Grupos de fé", desc: "Incentive e seja incentivado por amigos na jornada cristã" },
  { icon: "📖", label: "Registre momentos", desc: "Oração, leitura, jejum — cada ato conta e acumula pontos" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen gradient-subtle flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-7">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-pray-rats-256.png"
              alt="PrayRats"
              className="h-18 w-18 mx-auto rounded-2xl mb-4 object-contain"
              style={{ height: 72, width: 72 }}
            />
            <h1 className="text-2xl font-bold text-foreground">PrayRats</h1>
            <p className="text-sm text-muted mt-1">
              Constância espiritual em grupo
            </p>
          </div>

          {children}

          <div className="mt-8 space-y-3">
            {features.map((f) => (
              <div key={f.label} className="flex items-start gap-3">
                <span className="text-lg leading-none mt-0.5">{f.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{f.label}</p>
                  <p className="text-xs text-muted mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
