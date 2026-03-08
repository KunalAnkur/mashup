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

## 2026-03-08

- Active task: Chat tab message-bubble reactions.
- Status: Implemented, awaiting manual host/guest verification.
- Scope:
  - Added WhatsApp-style quick reactions to chat bubbles.
  - Added grouped reaction chips under each message bubble.
  - Added optimistic reaction toggle on the frontend.
  - Added minimal reaction-detail list when users tap an existing reaction chip.
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
  - Flip the message reaction picker below the bubble when the message sits near the top of the scroll area so the full row stays visible.
  - Raise the active message row and picker stacking order so the picker always stays above neighboring bubbles, including emoji-only messages.
  - Open a minimal `username + emoji` reaction list as an absolute overlay anchored to the reaction chips so it does not push the chat layout down while staying visible on mobile and desktop.
  - Keep reaction-detail chips clickable even when the chat is not in an active send state; view interactions must not be disabled by `isJoined`.
  - Merge `useChat.tsx` conflicts by keeping message reactions and pinned-message state from the reaction branch while preserving the newer typing/message lifecycle from `dev`.
  - Merge `ChatTab.tsx` conflicts by keeping the reaction/pin UI state and overlay refs, while folding in guarded auto-scroll behavior so new messages do not force-scroll users who read older chat.
  - After manual GitHub conflict resolution, run a focused compile pass and remove duplicated refs/imports immediately; conflict markers can be gone while broken merge state remains.
  - Remove message-row entry animation so incoming chat bubbles render immediately instead of flashing.
  - Restyle message reaction chips into a single WhatsApp-like capsule row instead of separate floating circles.
  - Move hover reaction/pin actions to the side of the message bubble instead of stacking them above the bubble.
  - Keep side actions on the bubble's visible empty side and remove nested reaction-chip backgrounds for a simpler, more legible WhatsApp-like tray.
  - For wide bubbles, move hover actions above the bubble automatically so side actions never create horizontal scroll.
  - In top-placement mode, let hover actions overlap the bubble's top border slightly instead of floating too far above it.
  - Align the absolute reaction-detail overlay to the reaction tray edge (`start/end`) so it opens with consistent positioning instead of drifting.
  - Keep the reaction-detail overlay black and minimal; avoid decorative tinted card styling for this popover.
  - Keep the reaction-detail overlay anchored from a stable start edge so short messages do not make the popover jump left/right when opened.
  - For wide bubbles, center the reaction-detail overlay only when there is enough safe horizontal space; otherwise keep the stable start anchor.
  - Anchor the reaction-detail overlay to the reaction tray itself, not to the full message row, and keep its stacking above hover action buttons.
  - Render the reaction-detail overlay as a viewport-clamped fixed layer so it never expands chat scroll width or causes horizontal scrolling.
  - Compute reaction-detail placement and viewport-clamped fixed position in the same pass so the popover never flashes into a wrong intermediate spot.
  - Auto-close the message reaction picker/detail overlay on scroll as well as outside click; temporary chat overlays should not linger.
  - Keep the reaction-detail popover closer to the tray button than the picker and trim its spacing so it reads as a compact utility overlay.
  - Position the reaction-detail popover from the clicked reaction button rect, not the whole tray, so the list can start from the button edge consistently.
  - Do not recenter the reaction-detail popover for wide messages; long bubbles should still open the list from the clicked emoji button edge.
  - Keep the hover reaction/pin actions tighter to each other and to the bubble edge, and keep the host pin affordance visible on long user messages as a disabled, tooltip-backed control when the pin limit blocks the action.
  - Keep the reaction-detail popover centered on the clicked reaction chip with a tight vertical gap, then clamp only at the viewport edges; chip-centered placement stays stable for both short and wide messages.
  - Replace the viewport `left/top` math for the reaction-detail list with a real absolute popover rendered under the clicked reaction chip wrapper; long-message behavior should come from trigger-relative DOM positioning, not fake page coordinates.
  - Do not add a second centering transform on top of the clicked-chip wrapper anchor; once the popup is rendered as an absolute child of the chip wrapper, `left-0` / `right-0` on that wrapper is already the correct short-message anchor.
  - Choose the detail popover side from real viewport room at click time (`start` if there is room on the right, `end` if there is room on the left, otherwise the larger side) instead of inheriting message alignment.
  - Collapse the message-side react/pin icons into one shared hover shell with transparent inner buttons so the actions sit tighter and do not read as nested floating circles.
  - Set the shared hover-action shell to `gap-1` so the react and pin icons have a deliberate but still compact separation.
