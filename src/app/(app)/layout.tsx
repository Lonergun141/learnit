import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedAppLayout({ children }: { children: ReactNode }) {
  const user = await requireAuthenticatedUser();
  const supabase = await createClient();
  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.from("user_settings").select("onboarded_at").eq("user_id", user.id).maybeSingle(),
  ]);

  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "Learner";
  // A missing settings row means the read failed or the account was never
  // provisioned. Treating that as "already onboarded" is the safe direction: an
  // unreadable row would otherwise reopen a walkthrough that can never be
  // recorded as seen, on every navigation.
  const onboardingPending = settings ? !settings.onboarded_at : false;

  return (
    <AppShell displayName={displayName} email={user.email} onboardingPending={onboardingPending}>
      {children}
    </AppShell>
  );
}
