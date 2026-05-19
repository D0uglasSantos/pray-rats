import { cn } from "@/lib/utils/cn";

export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-6", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted mt-1">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}
