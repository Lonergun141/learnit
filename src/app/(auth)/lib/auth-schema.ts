import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

export const loginSchema = z.object({
  email,
  password: z.string().min(8, "Enter your password").max(200),
});

export const signupSchema = z.object({
  displayName: z.string().trim().min(2, "Use at least 2 characters").max(80),
  email,
  password: z
    .string()
    .min(12, "Use at least 12 characters")
    .max(200)
    .regex(/[A-Za-z]/, "Add at least one letter")
    .regex(/[0-9]/, "Add at least one number")
    .regex(/[^A-Za-z0-9]/, "Add at least one symbol"),
});

export interface AuthActionState {
  message?: string;
  fieldErrors?: Partial<Record<"displayName" | "email" | "password", string[]>>;
  /** Echoed back so a rejected submission redisplays what was typed. */
  values?: { displayName?: string; email?: string };
}

/**
 * The non-secret fields worth redisplaying after a rejected submission. React
 * resets an uncontrolled form once its action settles, so without this a bad
 * password also clears the name and email. The password is deliberately absent:
 * it must never travel back to the browser.
 */
export function retainedAuthValues(formData: FormData): AuthActionState["values"] {
  const read = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : undefined;
  };

  return { displayName: read("displayName"), email: read("email") };
}
