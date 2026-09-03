import type { ReactNode } from "react";

import { logoutAction } from "@/app/(auth)/actions";
import { Brand } from "@/components/layout/brand";
import { NavLink, type NavIconName } from "@/components/layout/nav-link";
import { RouteLabel } from "@/components/layout/route-label";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { OnboardingTrigger } from "@/components/onboarding/onboarding-trigger";
import { Blueprint } from "@/components/ui/blueprint";

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
  /** True when this account has never finished or skipped the walkthrough. */
  onboardingPending: boolean;
}

/**
 * Instrument frame: a fixed rail of numbered cells on the left, a thin HUD bar
 * across the top, and the sheet itself running edge to edge underneath. Content
 * bands draw their own rules, so the shell adds no padding of its own.
 */
export function AppShell({ children, displayName, email, onboardingPending }: AppShellProps) {
  return (
    <OnboardingProvider pending={onboardingPending}>
      <div className="min-h-screen lg:pl-[4.75rem]">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[4.75rem] flex-col border-r border-line bg-background lg:flex">
          <div className="flex h-36 items-center justify-center border-b border-line">
            <Brand inverse vertical />
          </div>

          <nav aria-label="Primary navigation">
            {navigation.map((item, position) => (
              <NavLink key={item.href} index={position + 1} {...item} />
            ))}
          </nav>

          <div className="relative flex-1 overflow-hidden">
            <Blueprint
              variant="axis"
              className="absolute -left-6 bottom-16 w-32 text-signal/[0.14] [transform:rotate(90deg)]"
            />
          </div>

          <OnboardingTrigger />
        </aside>

        <header className="sticky top-0 z-30 border-b border-line bg-background/85 backdrop-blur-md">
          <div className="flex h-14 items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
            <div className="lg:hidden">
              <Brand />
            </div>
            <div className="hidden lg:block">
              <RouteLabel />
            </div>

            <div className="flex items-center gap-5 sm:gap-7">
              <span className="mono-label hidden items-center gap-2.5 sm:flex">
                <span className="relative flex size-1.5" aria-hidden="true">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-signal" />
                </span>
                <span className="max-w-36 truncate text-ink-soft">{displayName}</span>
                {email ? <span className="hidden xl:inline">{email}</span> : null}
              </span>
              <OnboardingTrigger className="lg:hidden" variant="bar" />
              <form action={logoutAction}>
                <button
                  className="bracket-link min-h-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
                  type="submit"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="relative pb-24 lg:pb-0">{children}</main>

        <nav
          className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
          aria-label="Primary navigation"
        >
          {navigation.map((item) => (
            <NavLink key={item.href} variant="bar" {...item} />
          ))}
        </nav>
      </div>
    </OnboardingProvider>
  );
}
