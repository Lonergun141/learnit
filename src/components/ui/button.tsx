import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";

const baseClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 font-display text-[0.75rem] font-semibold uppercase tracking-[0.09em] transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45 active:translate-y-px";

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    "bg-signal text-[#14170f] hover:shadow-[0_0_0_1px_var(--signal),0_10px_30px_-12px_var(--signal)] hover:brightness-105",
  secondary:
    "border border-line-strong text-ink-soft hover:border-signal hover:text-signal",
  quiet: "text-ink-faint hover:text-ink",
  danger: "bg-danger text-[#1a0f0c] hover:bg-danger-strong",
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
