import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="min-h-screen gradient-subtle flex flex-col items-center justify-center px-4 text-center">
      <p className="text-4xl mb-4">📡</p>
      <h1 className="text-xl font-bold mb-2">Você está offline</h1>
      <p className="text-muted text-sm mb-6 max-w-xs">
        Verifique sua conexão e tente novamente.
      </p>
      <Link href="/">
        <Button>Tentar novamente</Button>
      </Link>
    </div>
  );
}
