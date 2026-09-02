export function safeNextPath(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

interface CallbackFailure {
  /** `error` query parameter, set when Supabase itself rejected the link. */
  providerError: string | null;
  /** `error_description` query parameter, already human-readable. */
  providerDescription: string | null;
  /** Message from `exchangeCodeForSession`, when the exchange was attempted. */
  exchangeError: string | null;
}

const GENERIC = "Your sign-in link is invalid or expired.";

function sentence(text: string): string {
  const trimmed = text.trim();
  return trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
}

/**
 * Picks the most specific explanation available.
 *
 * A missing PKCE verifier is not an expired link — it means the confirmation was
 * opened somewhere other than where the sign-up happened, which needs completely
 * different advice from "request a new link".
 */
export function describeCallbackFailure({
  providerError,
  providerDescription,
  exchangeError,
}: CallbackFailure): string {
  if (providerDescription?.trim()) return sentence(providerDescription);
  if (providerError?.trim()) return sentence(providerError);

  if (exchangeError?.toLowerCase().includes("code verifier")) {
    return "Open the confirmation link in the same browser you signed up in, then try again.";
  }

  return GENERIC;
}
