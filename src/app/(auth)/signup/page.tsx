import type { Metadata } from "next";

import { AuthForm } from "../components/auth-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-[-0.03em] text-ink">Start your library</h1>
      <p className="mt-2 text-sm leading-6 text-ink-muted">
        Capture what matters and turn scattered sources into useful knowledge.
      </p>
      <AuthForm mode="signup" />
    </div>
  );
}
