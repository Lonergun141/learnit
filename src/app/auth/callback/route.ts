import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

import { describeCallbackFailure, safeNextPath } from "./callback";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const next = safeNextPath(params.get("next"));
  let exchangeError: string | null = null;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
    exchangeError = error.message;
  }

  // The reason is otherwise lost: the user only ever sees the redirect.
  console.error("[auth/callback] sign-in link rejected", {
    hasCode: Boolean(code),
    providerError: params.get("error"),
    errorCode: params.get("error_code"),
    exchangeError,
  });

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "error",
    describeCallbackFailure({
      providerError: params.get("error"),
      providerDescription: params.get("error_description"),
      exchangeError,
    }),
  );
  return NextResponse.redirect(loginUrl);
}
