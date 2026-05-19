import { cn } from "@/lib/utils/cn";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth,
      loading,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const variants = {
      primary: "bg-primary text-white hover:bg-primary-dark active:scale-[0.98]",
      secondary:
        "bg-surface-secondary text-foreground border border-border hover:bg-border/50",
      ghost: "bg-transparent text-primary hover:bg-surface-secondary",
      danger: "bg-error text-white hover:bg-error/90",
    };

    const sizes = {
      sm: "h-9 px-3 text-sm rounded-lg",
      md: "h-12 px-5 text-base rounded-xl",
      lg: "h-14 px-6 text-lg rounded-2xl",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all",
          "disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
