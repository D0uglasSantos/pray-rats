import { cn } from "@/lib/utils/cn";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full h-12 px-4 rounded-xl border border-border bg-surface",
            "text-base placeholder:text-muted/60",
            "outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary",
            "transition-colors",
            error && "border-error focus:ring-error/30",
            className,
          )}
          {...props}
        />
        {error && <p className="text-sm text-error">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
