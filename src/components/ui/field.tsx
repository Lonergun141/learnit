"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

const controlClassName =
  "min-h-11 w-full rounded-lg border border-line bg-surface-muted/50 px-3.5 py-2.5 text-[0.9375rem] text-ink outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-ink-faint hover:border-line-strong focus:border-signal focus:bg-surface-muted focus:ring-2 focus:ring-signal/25 disabled:bg-surface/60 disabled:text-ink-faint";

interface FieldFrameProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

function FieldFrame({ label, htmlFor, hint, error, children }: FieldFrameProps) {
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <label className="mono-label text-ink-muted" htmlFor={htmlFor}>
          {label}
        </label>
        {hint ? <span className="mono-label">{hint}</span> : null}
      </div>
      {children}
      {error ? (
        <p className="text-xs leading-5 text-danger" id={`${htmlFor}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function InputField({ label, error, hint, className, id, ...props }: InputFieldProps) {
  const fieldId = id ?? props.name;
  if (!fieldId) throw new Error("InputField requires an id or name");

  return (
    <FieldFrame label={label} htmlFor={fieldId} error={error} hint={hint}>
      <input
        {...props}
        id={fieldId}
        className={cn(controlClassName, error && "border-danger/60", className)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : props["aria-describedby"]}
      />
    </FieldFrame>
  );
}

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
  hint?: string;
}

/**
 * A password input with a reveal toggle. Visibility lives in component state and
 * only swaps the input `type`, so the field stays uncontrolled and whatever was
 * already typed survives the switch.
 */
export function PasswordField({ label, error, hint, className, id, ...props }: PasswordFieldProps) {
  const fieldId = id ?? props.name;
  if (!fieldId) throw new Error("PasswordField requires an id or name");

  const [revealed, setRevealed] = useState(false);
  const RevealIcon = revealed ? EyeOff : Eye;

  return (
    <FieldFrame label={label} htmlFor={fieldId} error={error} hint={hint}>
      <div className="relative">
        <input
          {...props}
          id={fieldId}
          type={revealed ? "text" : "password"}
          className={cn(controlClassName, "pr-12", error && "border-danger/60", className)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-error` : props["aria-describedby"]}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-ink-faint transition-colors duration-200 hover:text-ink focus-visible:outline-none focus-visible:text-signal focus-visible:ring-2 focus-visible:ring-signal/40"
          onClick={() => setRevealed((current) => !current)}
          aria-controls={fieldId}
          aria-label={revealed ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={revealed}
        >
          <RevealIcon size={16} aria-hidden="true" />
        </button>
      </div>
    </FieldFrame>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function SelectField({
  label,
  error,
  hint,
  className,
  id,
  children,
  ...props
}: SelectFieldProps) {
  const fieldId = id ?? props.name;
  if (!fieldId) throw new Error("SelectField requires an id or name");

  return (
    <FieldFrame label={label} htmlFor={fieldId} error={error} hint={hint}>
      <select
        {...props}
        id={fieldId}
        className={cn(controlClassName, error && "border-danger/60", className)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : props["aria-describedby"]}
      >
        {children}
      </select>
    </FieldFrame>
  );
}
