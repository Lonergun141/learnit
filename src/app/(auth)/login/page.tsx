import type { Metadata } from "next";

import { AuthForm } from "../components/auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-[-0.03em] text-ink">Welcome back</h1>
      <p className="mt-2 text-sm leading-6 text-ink-muted">
        Sign in to continue along your learning routes.
      </p>
      {typeof error === "string" ? (
        <p className="mt-6 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <AuthForm mode="login" />
    </div>
  );
}
