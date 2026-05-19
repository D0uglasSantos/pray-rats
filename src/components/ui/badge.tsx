import { cn } from "@/lib/utils/cn";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "primary" | "accent" | "success";
  className?: string;
}) {
  const variants = {
    default: "bg-surface-secondary text-muted",
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/20 text-primary-dark",
    success: "bg-success/10 text-success",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
