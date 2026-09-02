import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedAppLayout({ children }: { children: ReactNode }) {
  const user = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "Learner";

  return (
    <AppShell displayName={displayName} email={user.email}>
      {children}
    </AppShell>
  );
}
