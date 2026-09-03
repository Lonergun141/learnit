import type { Metadata } from "next";

import { AuthForm } from "../components/auth-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div className="rise">
      <p className="mono-label flex items-center gap-3">
        <span className="h-px w-8 bg-signal" aria-hidden="true" />
        New account
      </p>
      <h1 className="display mt-8 text-[2.5rem] leading-[0.95]">
        Start your <span className="accent-italic text-signal">library</span>
      </h1>
      <AuthForm mode="signup" />
    </div>
  );
}
