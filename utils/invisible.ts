/**
 * Invisible participants — the client's copy of the rule.
 *
 * `communication/src/utils/invisible.ts` is the source of truth: the server is what actually
 * withholds the join line, the people-tab entry and the peer announcements, and nothing here
 * can grant or revoke invisibility. This exists because one client-side decision genuinely
 * depends on knowing: an invisible participant has to open its own call connections, since
 * the people it wants to watch cannot see it in the roster and will therefore never offer.
 *
 * Keep the two in step. Changing the rule on one side only makes a participant the server
 * hides and the client does not compensate for — which reads as a call that connects half
 * the time, not as a broken predicate.
 */
export const INVISIBLE_USERNAME_MARKER = "invisible";

export function isInvisibleUsername(username?: string | null): boolean {
  return (
    typeof username === "string" &&
    username.toLowerCase().includes(INVISIBLE_USERNAME_MARKER)
  );
}
