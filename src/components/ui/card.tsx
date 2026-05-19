import { cn } from "@/lib/utils/cn";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
}

export function Card({ className, padding = "md", children, ...props }: CardProps) {
  const paddings = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <div
      className={cn(
        "rounded-2xl bg-surface border border-border shadow-sm",
        paddings[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
