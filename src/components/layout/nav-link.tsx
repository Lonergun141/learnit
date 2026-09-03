"use client";

import { BookOpen, LayoutDashboard, Library, Settings, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";

/**
 * A Server Component cannot hand a component across the boundary — only plain
 * data serializes — so navigation names an icon and this map resolves it here,
 * where the active state that sizes it is also known.
 */
const icons = {
  dashboard: LayoutDashboard,
  library: Library,
  topics: BookOpen,
  settings: Settings,
} satisfies Record<string, LucideIcon>;

export type NavIconName = keyof typeof icons;

interface NavLinkProps {
  href: string;
  label: string;
  icon: NavIconName;
  /** Ordinal stamped in the corner of the rail cell. Decorative. */
  index?: number;
  /** "rail" is the fixed desktop column, "bar" the mobile bottom strip. */
  variant?: "rail" | "bar";
}

export function NavLink({ href, label, icon, index, variant = "rail" }: NavLinkProps) {
  const Icon = icons[icon];
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  if (variant === "bar") {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex min-h-[3.75rem] flex-1 flex-col items-center justify-center gap-1.5 border-r border-line font-mono text-[0.5625rem] uppercase tracking-[0.06em] transition-colors last:border-r-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal",
          active ? "bg-signal-soft text-signal" : "text-ink-faint hover:text-ink-soft",
        )}
      >
        <span
          className={cn("absolute inset-x-0 top-0 h-px", active ? "bg-signal" : "bg-transparent")}
          aria-hidden="true"
        />
        <Icon size={16} strokeWidth={active ? 2.2 : 1.6} />
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-[4.75rem] flex-col items-center justify-center gap-1.5 border-b border-line font-mono text-[0.5625rem] uppercase leading-none tracking-[0.05em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal",
        active
          ? "bg-signal-soft text-signal"
          : "text-ink-faint hover:bg-surface-muted/60 hover:text-ink-soft",
      )}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-0.5 transition-colors",
          active ? "bg-signal" : "bg-transparent",
        )}
        aria-hidden="true"
      />
      {index !== undefined ? (
        <span
          className={cn(
            "absolute right-1.5 top-2 text-[0.5rem] transition-colors",
            active ? "text-signal/70" : "text-line-strong group-hover:text-ink-faint",
          )}
          aria-hidden="true"
        >
          {String(index).padStart(2, "0")}
        </span>
      ) : null}
      <Icon size={17} strokeWidth={active ? 2.2 : 1.6} />
      {label}
    </Link>
  );
}
