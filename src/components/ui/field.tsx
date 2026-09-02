import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

const controlClassName =
  "min-h-11 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[0.9375rem] text-ink outline-none transition-[border-color,box-shadow,background-color] placeholder:text-ink-faint hover:border-line-strong focus:border-signal focus:ring-4 focus:ring-signal-soft disabled:bg-surface-muted disabled:text-ink-faint";

interface FieldFrameProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

function FieldFrame({ label, htmlFor, hint, error, children }: FieldFrameProps) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-4">
        <label className="text-sm font-semibold text-ink" htmlFor={htmlFor}>
          {label}
        </label>
        {hint ? <span className="text-xs text-ink-faint">{hint}</span> : null}
      </div>
      {children}
      {error ? (
        <p className="text-sm text-danger" id={`${htmlFor}-error`} role="alert">
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
        className={cn(controlClassName, className)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : props["aria-describedby"]}
      />
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
        className={cn(controlClassName, className)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : props["aria-describedby"]}
      >
        {children}
      </select>
    </FieldFrame>
  );
}
