import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";

const baseClassName =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px";

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    "bg-ink text-white shadow-[0_8px_20px_rgba(16,31,29,0.16)] hover:bg-ink-soft",
  secondary:
    "border border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-muted",
  quiet: "text-ink-muted hover:bg-surface-muted hover:text-ink",
  danger: "bg-danger text-white hover:bg-danger-strong",
};

export function buttonClassName(
  variant: ButtonVariant = "primary",
  className?: string,
): string {
  return cn(baseClassName, variantClassNames[variant], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return <button className={buttonClassName(variant, className)} {...props} />;
}
