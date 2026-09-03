import type { Metadata } from "next";

import { AuthForm } from "../components/auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <div className="rise">
      <p className="mono-label flex items-center gap-3">
        <span className="h-px w-8 bg-signal" aria-hidden="true" />
        Access
      </p>
      <h1 className="display mt-8 text-[2.5rem] leading-[0.95]">
        Welcome <span className="accent-italic text-signal">back</span>
      </h1>
      {typeof error === "string" ? (
        <p
          className="mt-10 border-l-2 border-danger bg-danger-soft/60 py-3 pl-4 text-sm leading-6 text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <AuthForm mode="login" />
    </div>
  );
}
