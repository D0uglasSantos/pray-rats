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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Pray Rats"
              className="h-20 w-20 mx-auto rounded-2xl shadow-lg mb-4 object-cover"
            />
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
