# Tasks

Primary backlog lives in [tasks/notion-backlog.md](./tasks/notion-backlog.md).

## Current Step

- Date: 2026-03-15
- Active task: Panel/room modal standardization plus agent doc synchronization.
- Status: In progress.
- Completed in this workstream:
  - Shared modal shell/tokens standardized in `components/UI/Modal.tsx`.
  - `Leave`, `Logout`, `Invite room`, and `Add URL` modal flows moved toward one shared modal system.
  - `Feedback` modal extracted from `SettingTab` into its own shared modal component.
  - Shared modal color tokens moved into `components/UI/modalTheme.ts`.
  - Modal workflow/design rules consolidated in `AGENTS.md`.
- Current focus:
  - Finish `Feedback` modal UX polish with inline validation and consistent action sizing.
  - Audit remaining modal-heavy flows such as `DeviceModal` and `UrlModal`.
  - Keep agent docs aligned so there is one clear source of truth for rules vs lessons vs backlog.
- Testing reminder:
  - Verify `Settings` tab opens without runtime errors.
  - Verify `Leave`, `Logout`, `Invite`, `Add URL`, and `Feedback` modals share the intended spacing and action language.
  - Verify field-level modal validation appears inline after submit and not behind modal overlays.
  - Verify toast remains only for success/global/backend cases in form modals.

Rules for execution:

1. Do not start any task without your permission.
2. Before coding, explain the planned implementation.
3. After each meaningful change, provide test steps.
4. Only suggest commit commands after checking `git status --short` and after the user confirms the change is finished.

## 2026-03-12

- Active task: Playlist panel refinement.
- Scope:
  - Reposition playlist CTA actions into a top toolbar.
  - Redesign playlist cards in a more minimal, calmer visual style.
  - Make selected-state action badge reflect real playback state instead of selection only.
  - Keep git workflow ready with manual branch/commit suggestions for the user to run.
- Testing reminder:
  - Verify CTA row stays on one line across target panel sizes.
  - Verify selected playlist card shows `pause` while video is playing and `play` while paused.
  - Verify thumbnail no longer shows any playback icon.
  - Verify changing selected playlist item updates the right-side badge immediately.
  - Verify both sync and stream rooms reflect playback icon changes correctly for host and guest.
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
  - Redesign screen-share playlist thumbnails from actual capture mode (`browser/tab`, `window`, `monitor/screen`) so the selected share type is obvious at a glance instead of using one generic broadcast tile.
  - Keep screen-share thumbnail labels as simple text pills; remove decorative dots and extra translucent inner layers when they make the small thumbnail feel noisy.
  - If the label background still feels visually loud in a tiny thumbnail, drop the label fill entirely and keep only the text.
  - When labels need to stay visible, use a solid compact color block behind the text instead of translucent glass styling.
  - If the cleanest result is to let the full thumbnail carry the mode, use a gradient thumbnail background with one simple icon + text row instead of a separate embedded label.

## 2026-03-15

- Active task: Modal system cleanup in room/panel flows.
- Scope:
  - Standardize modal surface, spacing, close buttons, cancel/confirm actions, and shared brand tokens.
  - Remove duplicated modal markup where the same room flow has both inline modal markup and a reusable component.
  - Move field-level validation errors inside form modals instead of relying on toast notifications.
  - Keep `AGENTS.md`, `agent/rules.md`, `agent/tasks.md`, `agent/lessons.md`, and backlog roles clearly separated.
- Testing reminder:
  - Verify `Settings` tab and `Feedback` modal open without runtime errors after extraction/refactors.
  - Verify `Add URL` modal still validates and submits correctly after being routed through the shared component.
  - Verify destructive modals keep danger confirm actions but remain visually consistent with the shared modal system.
