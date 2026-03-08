# Costume Task Log

- Active task: Task 4 (host pin message in chat with 180-char limit and top banner UI).
- Scope:
  - Add host pin/unpin action from existing message bubbles.
  - Show pinned message at top of chat tab with distinct background.
  - Sync pinned state for users joining an active room.
  - Keep i18n keys updated across `en/tr/es/ar`.
- Test reminder:
  - Verify host can pin/unpin.
  - Verify non-host cannot pin/unpin.
  - Verify pinned banner is visible for newly joined users while room is active.
- UI refinement (2026-03-07):
  - Move per-message pin action inside the message bubble (top-right) for a minimal and modern look.
  - Remove external side pin button to avoid visual clutter.
  - Remove redundant "Pinned message" title text from pinned banner for cleaner hierarchy.
  - Make pin icon plain white outline only (remove decorative bg/border layers).
  - Format pinned content as `username: message` in a single clean text block.
  - Align pinned banner close button with fixed-size top placement.
  - Prevent long-word first-line gap in pinned text by forcing `overflow-wrap:anywhere`.
  - Keep `pin icon + text + close` in one top-aligned row, with close action anchored on the right.
  - Remove close icon and use a small filled white pin at top-right as the unpin affordance (host only).
  - Replace pinned banner `pr-*` spacing hack with `flex + justify-between` layout for cleaner, maintainable alignment.
  - Reduce pinned banner text scale and weight for less visual dominance.
  - Tone down pinned banner background to a softer, less saturated gradient.

## 2026-03-08

- Active task: Chat tab message-bubble reactions.
- Status: Implemented, awaiting manual host/guest verification.
- Scope:
  - Added WhatsApp-style quick reactions to chat bubbles.
  - Added grouped reaction chips under each message bubble.
  - Added optimistic reaction toggle on the frontend.
  - Added `tr/en/es/ar` chat tooltip text for message reactions.
- Testing reminder:
  - Test with host + guest in the same room.
  - Test add, switch, and remove reaction on the same message.
  - Test older messages so reaction updates do not force chat scroll to bottom.

- UI refinement (2026-03-08):
  - Remove empty right-side pin padding from message bubbles.
  - Keep timestamp at the classic bottom-right position inside the bubble.
  - Float pin/reaction actions above the bubble edge so text width stays intact at rest.
  - Open message reaction picker from the message start edge to avoid left/right clipping on mobile and desktop.
