"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/field";

import { loginAction, signupAction } from "../actions";
import type { AuthActionState } from "../lib/auth-schema";

const initialState: AuthActionState = {};

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const isSignup = mode === "signup";
  const [state, action, pending] = useActionState(
    isSignup ? signupAction : loginAction,
    initialState,
  );

  return (
    <form action={action} className="mt-10 grid gap-5" noValidate>
      {isSignup ? (
        <InputField
          label="Display name"
          name="displayName"
          autoComplete="name"
          placeholder="Ada Learner"
          defaultValue={state.values?.displayName}
          error={state.fieldErrors?.displayName?.[0]}
          required
        />
      ) : null}
      <InputField
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@example.com"
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email?.[0]}
        required
      />
      <InputField
        label="Password"
        hint={isSignup ? "12+ characters" : undefined}
        name="password"
        type="password"
        autoComplete={isSignup ? "new-password" : "current-password"}
        error={state.fieldErrors?.password?.[0]}
        required
      />
      {state.message ? (
        <p
          className="rounded-lg border border-line bg-surface-muted/60 px-4 py-3 text-sm leading-6 text-ink-muted"
          role="status"
        >
          {state.message}
        </p>
      ) : null}
      <Button className="mt-2 w-full" disabled={pending} type="submit">
        {pending ? <LoaderCircle className="animate-spin" size={16} /> : null}
        {pending ? "Working…" : isSignup ? "Create account" : "Sign in"}
        {!pending ? <ArrowRight size={16} /> : null}
      </Button>
      <p className="mt-2 flex items-center justify-center gap-2 text-center text-sm text-ink-faint">
        {isSignup ? "Already have an account?" : "New to LearnIT?"}
        <Link className="bracket-link" href={isSignup ? "/login" : "/signup"}>
          {isSignup ? "Sign in" : "Create one"}
        </Link>
      </p>
    </form>
  );
}
