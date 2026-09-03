"use server";

import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Records that the account has seen the walkthrough, whether it was finished or
 * skipped — both mean "do not open this unprompted again". Writing the first
 * completion only keeps the original date honest when the walkthrough is
 * replayed later from the rail.
 *
 * Failure is deliberately silent to the caller: the walkthrough has already been
 * dismissed on screen, and a toast about a settings write would be noise. The
 * worst case is that it opens once more on the next visit.
 */
export async function completeOnboardingAction(): Promise<void> {
  const user = await requireAuthenticatedUser();
  const supabase = await createClient();

  await supabase
    .from("user_settings")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("onboarded_at", null);
}
