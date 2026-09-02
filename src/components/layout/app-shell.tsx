import { LogOut } from "lucide-react";
import type { ReactNode } from "react";

import { logoutAction } from "@/app/(auth)/actions";
import { Brand } from "@/components/layout/brand";
import { NavLink, type NavIconName } from "@/components/layout/nav-link";

const navigation: { href: string; label: string; icon: NavIconName }[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/library", label: "Library", icon: "library" },
  { href: "/topics", label: "Topics", icon: "topics" },
  { href: "/settings/integrations", label: "Settings", icon: "settings" },
];

interface AppShellProps {
  children: ReactNode;
  displayName: string;
  email: string | null;
}

export function AppShell({ children, displayName, email }: AppShellProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <aside className="hidden min-h-screen bg-[#10231f] px-5 py-6 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <Brand inverse />
        <div className="relative mt-10 flex-1 pl-5">
          <span className="absolute bottom-7 left-[0.19rem] top-5 w-px bg-white/15" aria-hidden="true" />
          <nav className="grid gap-1.5" aria-label="Primary navigation">
            {navigation.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>
        </div>
        <div className="border-t border-white/10 pt-5">
          <p className="truncate text-sm font-medium text-white">{displayName}</p>
          {email ? <p className="mt-0.5 truncate text-xs text-white/50">{email}</p> : null}
          <form action={logoutAction} className="mt-3">
            <button
              className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs font-medium text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
              type="submit"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-background/95 px-4 backdrop-blur-sm lg:hidden">
          <Brand />
          <span className="max-w-40 truncate text-xs font-medium text-ink-muted">{displayName}</span>
        </header>
        <main className="mx-auto w-full max-w-[91rem] px-4 py-7 pb-24 sm:px-7 sm:py-9 lg:px-10 lg:pb-12 xl:px-14">
          {children}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
        aria-label="Primary navigation"
      >
        {navigation.map((item) => (
          <NavLink key={item.href} {...item} mobile />
        ))}
      </nav>
    </div>
  );
}
