import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "./server";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
}

export const getAuthenticatedUser = cache(async (): Promise<AuthenticatedUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims.sub) return null;

  return {
    id: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
  };
});

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");
  return user;
}
