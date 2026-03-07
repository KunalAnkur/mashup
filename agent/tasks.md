# Tasks

Primary backlog lives in [tasks/notion-backlog.md](./tasks/notion-backlog.md).

## Current Step

- Date: 2026-03-07
- Active task: Task 3 + Task 9 (chat message delay and sender own-message delay)
- Status: In progress (Task 1 and Task 2 completed)
- Sub-update: Added optimistic message rendering and server-event reconciliation for chat sends.
- Sub-update: Fixed multiline chat composer width shrink by enforcing `flex-1 min-w-0 w-full` input area and `flex-shrink-0` actions area.
- Sub-update: Fixed composer wrap instability by making action buttons absolute and reserving right padding in input/textarea.
- Sub-update: Reduced reserved right padding to bring text visually closer to composer action buttons.
- Sub-update: Reverted absolute composer actions and restored balanced flex layout; added long-word wrapping (`break-all`) for textarea stability.
- Sub-update: Restored compact composer height and centered icon/text alignment while keeping long-word wrapping.
- Sub-update: Adjusted input/textarea line-height (`leading-5`) to center placeholder/text vertically.
- Sub-update: Re-aligned composer to dev-branch baseline classes/structure and kept only `break-all` for long unbroken words.
- Sub-update: Centralized generic username detection into shared `utils/chatName.ts` and removed duplicate logic from `useChat` + `ChatTab`.
- Sub-update: Synced typing user payload type with optional `username` alias to avoid frontend type mismatch and IDE red underlines.
- Sub-update: Fixed `resolveDisplayName` TS2322 by normalizing candidate to `string` before return (`(candidate ?? \"\").trim()`).
- Localization note: No new UI text in this step (`tr/en/es` unchanged).

Rules for execution:

1. Do not start any task without your permission.
2. Before coding, explain the planned implementation.
3. After each change, provide meaningful `git add` and `git commit -m` suggestions.
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
