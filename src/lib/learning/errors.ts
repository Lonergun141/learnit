/**
 * Turns a database exception into something worth showing a user.
 *
 * The RPCs raise a small, fixed set of messages for situations the user can act
 * on — a limit reached, an item in the wrong state, an integration not set up.
 * Anything outside that set is an internal detail and gets the caller's generic
 * fallback instead, so constraint names and SQL never reach the page.
 */
const USER_FACING_MESSAGES: Record<string, string> = {
  "Daily learning item limit reached":
    "You have reached today's capture limit. Save more links tomorrow.",
  "Learning item is not in a retryable state":
    "This item cannot be retried from its current state.",
  "Learning item not found": "That item is no longer in your library.",
  "Playlist capture must be configured and enabled":
    "Turn on playlist capture and save a playlist first.",
};

export function describeDatabaseFailure(
  error: { message?: string } | null | undefined,
  fallback: string,
): string {
  const message = error?.message?.trim();
  return (message && USER_FACING_MESSAGES[message]) || fallback;
}
