"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { resolveAppUrl } from "@/lib/env/app-url";
import { createClient } from "@/lib/supabase/server";

import {
  loginSchema,
  retainedAuthValues,
  signupSchema,
  type AuthActionState,
} from "./lib/auth-schema";

function invalidState(
  error: { flatten(): { fieldErrors: Record<string, string[]> } },
  formData: FormData,
): AuthActionState {
  return { fieldErrors: error.flatten().fieldErrors, values: retainedAuthValues(formData) };
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalidState(parsed.error, formData);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { message: "Email or password is incorrect.", values: retainedAuthValues(formData) };
  }
  redirect("/dashboard");
}

export async function signupAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalidState(parsed.error, formData);

  const requestHeaders = await headers();
  const appUrl = resolveAppUrl({ requestOrigin: requestHeaders.get("origin") });
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    return {
      message: "We could not create that account. Try signing in instead.",
      values: retainedAuthValues(formData),
    };
  }
  if (!data.session) return { message: "Check your email to confirm your account, then sign in." };

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims.sub) await supabase.auth.signOut();
  redirect("/login");
}
