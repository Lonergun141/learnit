/**
 * Where the app lives, as an absolute origin, for links that leave the app and
 * have to come back — currently the sign-up confirmation email.
 *
 * Getting this wrong is invisible until a real user clicks a real email, so the
 * resolution is deliberately defensive rather than a single `??` chain:
 *
 *   - An unset variable and an empty one are the same thing. `.env.example`
 *     ships `NEXT_PUBLIC_APP_URL=` blank, and `??` would have happily produced
 *     the relative URL `/auth/callback`, which Supabase discards in favour of
 *     the project's Site URL.
 *   - A localhost value is refused outside development. A deployed build that
 *     inherited a developer's `http://localhost:3000` would otherwise mail that
 *     address to every new account.
 */

interface ResolveOptions {
  /** Environment to read. Defaults to the real process environment. */
  source?: Record<string, string | undefined>;
  /** `origin` header of the request being served, when there is one. */
  requestOrigin?: string | null;
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]", "::1"]);

/** Normalises a candidate to a bare origin, or rejects it. */
function toOrigin(value: string | undefined | null, allowLoopback: boolean): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  if (!allowLoopback && LOOPBACK_HOSTS.has(parsed.hostname)) return null;

  // `origin` drops any path, query, and trailing slash, so callers can always
  // append a path without doubling the separator.
  return parsed.origin;
}

export function resolveAppUrl({ source = process.env, requestOrigin }: ResolveOptions = {}): string {
  const allowLoopback = source.NODE_ENV !== "production";
  const productionHost = source.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  return (
    toOrigin(source.NEXT_PUBLIC_APP_URL, allowLoopback) ??
    // Vercel exposes the stable production domain at runtime. Preferred over the
    // per-deployment VERCEL_URL, which changes on every push and would bake a
    // dead host into an email that outlives the deployment.
    toOrigin(productionHost ? `https://${productionHost}` : null, allowLoopback) ??
    toOrigin(requestOrigin, allowLoopback) ??
    "http://localhost:3000"
  );
}
