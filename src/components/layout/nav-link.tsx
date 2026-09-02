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
  mobile?: boolean;
}

export function NavLink({ href, label, icon, mobile = false }: NavLinkProps) {
  const Icon = icons[icon];
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  if (mobile) {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal",
          active ? "text-signal" : "text-ink-faint hover:text-ink",
        )}
      >
        <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal",
        active ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/[0.06] hover:text-white",
      )}
    >
      <span
        className={cn(
          "absolute -left-[1.56rem] size-2 rounded-full border-2 border-[#18332d] transition-colors",
          active ? "bg-[#f0d36a]" : "bg-[#6a7d77] group-hover:bg-white",
        )}
        aria-hidden="true"
      />
      <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
      {label}
    </Link>
  );
}
