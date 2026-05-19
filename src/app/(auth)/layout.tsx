export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen gradient-subtle flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-spiritual text-white text-2xl font-bold mb-4">
              ✝
            </div>
            <h1 className="text-2xl font-bold text-foreground">Pray Rats</h1>
            <p className="text-sm text-muted mt-1">
              Constância espiritual em grupo
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
