# Lessons

Use this file to record mistakes, root causes, and prevention steps.

## Entry Template

- Date:
- Context:
- Error:
- Root cause:
- Prevention checklist:
- Follow-up action:

## 2026-03-07

- Date: 2026-03-07
- Context: Google One Tap login in `costume` app.
- Error: `FedCM get() rejects with NetworkError: Error retrieving a token.`
- Root cause: Google One Tap token request can fail when OAuth JavaScript origins are not configured for the active origin or browser privacy blocks FedCM/cookies.
- Prevention checklist:
  - Validate `NEXT_PUBLIC_GOOGLE_CLIENT_ID` per environment.
  - Ensure all active origins are listed in Google OAuth Authorized JavaScript origins.
  - Test login in normal browser mode before release.
- Follow-up action: Keep auth provider setup and environment checks in pre-release QA.

## 2026-03-07 (Chat Scroll UX)

- Date: 2026-03-07
- Context: Chat tab in right panel re-opened after switching tabs.
- Error: Scroll starts at top and then visibly moves to bottom.
- Root cause: Chat remount + auto-scroll via `scrollIntoView({ behavior: "smooth" })` after render.
- Prevention checklist:
  - Use container-based scroll with `useLayoutEffect` for bottom pin on mount/history render.
  - Auto-scroll only when user is near bottom.
  - Avoid smooth auto-scroll for initialization cases.
  - Do not apply stagger/mount animations to full historical chat lists on tab mount.
- Follow-up action: Apply same scroll pattern to any future chat-like list.

## 2026-03-07 (Typing Username Resolution)

- Date: 2026-03-07
- Context: Chat typing indicator was showing generic `USER` instead of real username.
- Error: Typing label looked like placeholder text, reducing clarity in multi-user rooms.
- Root cause: Typing payload/userName fallback path allowed generic values; UI relied on raw typing event name.
- Prevention checklist:
  - Resolve typing display names from participant data first (`socketId` match), then message history.
  - Prefer `username` over `name` for typing payloads.
  - Keep fallback order deterministic: `username` -> `name` -> email prefix -> `User`.
- Follow-up action: Reuse this resolution pattern for other transient user-presence UI states.
- Validation: Confirmed working by user on 2026-03-07.

## 2026-03-07 (Message Delay and Empty Gap)

- Date: 2026-03-07
- Context: Chat tab message appears late; sender also sees own message with delay.
- Error: Visual gap/latency before message bubble appears.
- Root cause: Message UI waited for network roundtrip (`emitWithAck` + receive event) before rendering, with no optimistic local append.
- Prevention checklist:
  - Render outgoing message optimistically immediately.
  - Reconcile optimistic message with server `id/timestamp` when ack or receive event arrives.
  - Deduplicate incoming messages using both `id` and optimistic match rules.
- Follow-up action: Use the same optimistic + reconciliation pattern for future realtime list interactions.

## 2026-03-07 (Composer Width Shrink on Long Text)

- Date: 2026-03-07
- Context: Chat input/composer in right panel.
- Error: Long multiline text used a narrow typing area instead of full available width.
- Root cause: Composer row lacked a strict width contract between text input and action buttons.
- Prevention checklist:
  - Keep text input wrapper as `flex-1 min-w-0`.
  - Keep textarea/input as `w-full min-w-0`.
  - Keep action icon group as `flex-shrink-0`.
  - Keep wrapping/layout fixes scoped so composer height and centering are not unintentionally changed.
- Follow-up action: Reuse the same flex layout pattern for any input+actions composer UI.

## 2026-03-07 (Composer Spacing Regression)

- Date: 2026-03-07
- Context: Chat composer after width-fix iteration.
- Error: Content looked top-heavy; excessive visual gap between text and action buttons.
- Root cause: Absolute-positioned action buttons with reserved right padding hurt vertical and horizontal balance.
- Prevention checklist:
  - Prefer natural flex layout (`input flex-1` + `actions flex-shrink-0`) before absolute positioning.
  - Tune vertical paddings symmetrically (`py-*` on container and input/textarea).
  - If placeholder baseline feels off, adjust line-height first (`leading-*`) before changing height/padding.
  - For long unbroken words, apply explicit wrap behavior (`break-all`).
- Follow-up action: Keep composer fixes layout-first, then micro-tune spacing.
- Validation: Returned to compact composer height and centered alignment after user feedback.

## 2026-03-07 (Composer Baseline Matching)

- Date: 2026-03-07
- Context: Final visual parity request for chat composer (placeholder + icons).
- Error: Iterative fixes still looked visually off versus known-good dev baseline.
- Root cause: Multiple micro changes drifted away from baseline spacing/alignment classes.
- Prevention checklist:
  - When pixel parity matters, diff against known-good branch and restore exact class structure.
  - Keep only minimal functional delta (`break-all`) after baseline parity is re-established.
- Follow-up action: Use branch-baseline matching earlier for UI parity requests.

## 2026-03-07 (Generic Name Drift)

- Date: 2026-03-07
- Context: Typing/message display name fallback in chat.
- Error: Generic-name filtering logic was duplicated across `useChat` and `ChatTab`, making behavior drift-prone and harder to debug.
- Root cause: Same helper logic (`isGenericName`, email prefix fallback) was copy-pasted in multiple files instead of shared utility.
- Prevention checklist:
  - Keep name-resolution rules in one shared helper.
  - Reuse the same helper in hook and UI layers.
  - Include backward-compatible payload aliases in types when socket payloads can vary (`userName` vs `username`).
- Follow-up action: Reuse `utils/chatName.ts` for any new chat/presence display-name paths.

## 2026-03-07 (TS Narrowing in Name Resolver)

- Date: 2026-03-07
- Context: Shared chat display-name utility.
- Error: TS2322 in `resolveDisplayName` (`string | undefined` returned where `string` required).
- Root cause: `candidate?.trim()` preserves `undefined` in type flow.
- Prevention checklist:
  - Normalize optional strings before return (`(value ?? \"\").trim()`).
  - Keep helper function return contracts strict and explicit.
- Follow-up action: Apply same pattern in other utility resolvers with optional inputs.
# Costume Lessons

## 2026-03-07 (Pinned Message UI + Sync)

- Pinning should operate on existing messages (message `id`), not free-form text input.
- Character-limit validation belongs to backend; frontend should still guide users and handle errors gracefully.
- Join payload should include the room's current pinned message so newcomers see consistent chat context.
- Keep pinned rendering separate from message list to avoid scroll-behavior regressions.

## 2026-03-07 (Pin Action Visual Placement)

- External action buttons next to bubbles create noisy alignment in dense chat layouts.
- Keeping pin action inside the bubble top-right gives cleaner scanning and better message grouping.
- For minimal UX, show unpinned icon on hover and keep pinned state icon always visible.
- Avoid redundant labels inside pinned banner when pin affordance is already explicit.
- For clean visual hierarchy in chat, prefer icon-only affordances (outline white) over layered badge styles.
- For pinned previews, `username: message` in one block is easier to scan than split-line styling.
- For mixed inline metadata (`username: message`), `overflow-wrap:anywhere` prevents awkward empty trailing space on line 1.
- Fixed-size action buttons (`h/w + self-start`) are more stable than padding-based alignment in multiline rows.
- For polished banner layout, use `justify-between` on the outer row and keep message block `min-w-0` to preserve right-side action alignment.
- A small filled/angled pin icon communicates "pinned state" better than a separate close icon in compact chat banners.
- Prefer structural flex alignment (`justify-between`, `flex-shrink-0`) over padding reservations (`pr-*`) for right-side actions.
- Pinned preview typography should be one step smaller than normal chat bubbles to avoid dominating chat hierarchy.
- High-saturation warning colors can overpower chat UI; prefer muted accent gradients for pinned state.

## 2026-03-08 (Message Bubble Reactions)

- Existing reaction flow was only for floating room reactions, not per-message state.
- Keep floating reactions and message reactions as separate socket flows.
- Do not bind auto-scroll to the full `messages` object when message metadata can change.
- Normalize incoming message shape so older history payloads without `reactions` do not break UI.
- If users want long-press mobile behavior later, add it on top of the current quick-reaction picker instead of replacing the socket contract.
- Do not reserve permanent `pr-*` space for hover-only pin controls; keep the idle bubble layout full-width and move transient actions into a floating overlay.
- For chat bubble readability, keep the timestamp in its expected bottom-right slot and float hover actions above the bubble instead of mixing them into text/time layout.
- Message reaction pickers should open from the bubble's own start edge with a capped width and horizontal overflow handling, otherwise icons can clip off-screen on narrow layouts.
- Message reaction pickers cannot use a fixed upward offset only; they must choose top or bottom placement from the available space inside the scroll container or the first visible messages will clip the picker.
- A reaction picker that overlaps neighboring rows needs row-level stacking control; raising only the picker is not enough if sibling message rows create their own stacking contexts.
- Message reaction chips and reaction edit pickers should not share the same click behavior; use chips for viewing reactor details and keep add/remove/change actions in the dedicated picker to avoid accidental toggles.
- Reaction detail overlays should be anchored to the reaction-chip row itself with high `z-index`; that preserves an overlay feel without pushing chat layout down.
- View-only reaction chips should never depend on the send/join enabled state, and decorative glow layers must be `pointer-events-none` so the chips remain clickable.
- `useChat.tsx` merge conflicts should not be resolved by choosing a whole side; keep the reaction/pin data model and socket handlers from the feature branch, then layer in the latest `dev` typing/message lifecycle changes explicitly.
- `ChatTab.tsx` merge conflicts also need a true merge: keep overlay refs/state from the feature branch and combine them with guarded auto-scroll logic instead of accepting one side wholesale.
- A file can still be broken after all conflict markers are removed; duplicate refs/imports from blind "Accept current change" resolutions must be caught with a local compile check before pushing.
- Chat message rows should not use entry fade animations in a live conversation UI; they read as flicker and feel worse than immediate render.
- Message reaction chips should read as one attached reaction tray, not as separate floating pills, when the goal is WhatsApp-like chat hierarchy.
- Hover actions scan better when they sit beside the bubble body; stacking them above the bubble competes with the message shape and looks disconnected.
- If the chat layout keeps all bubbles left-aligned, the "empty side" for hover actions is the bubble's right edge; pushing actions to the left can hide them behind the avatar/gutter.
- For minimal reaction trays, avoid both an outer badge background and separate inner chip backgrounds at the same time; keep one visual layer only.
- Side hover actions need a placement fallback for wide bubbles; otherwise their absolute offset can increase scroll width and create horizontal scrolling.
- For top-placement hover actions, a slight overlap on the bubble border reads more integrated than leaving the controls fully detached above the message.
- Absolute reaction detail popovers need both vertical placement and horizontal alignment; `top/bottom` alone is not enough for a polished chat layout.
- Reaction detail popovers work better as plain black utility overlays than as styled accent cards; this UI needs low visual noise.
- If message widths vary a lot, reaction detail overlays should open from one stable horizontal anchor; switching between `left` and `right` alignment makes short-message popovers feel jumpy.
- A good reaction-detail popover strategy is hybrid: keep short-message popovers start-anchored, but allow wide-message popovers to center only when there is proven room on both sides.
- If the detail popover is anchored to a full-width wrapper instead of the reaction tray itself, wide-message layouts will feel wrong; keep the wrapper `w-fit`/inline and raise its stacking above hover controls.
- If an absolute popover participates in the scroll container, it can increase scroll width and create horizontal scrolling; use fixed positioning plus viewport clamping for stable chat overlays.
- For fixed chat overlays, do not derive position from a stale placement state; compute placement and coordinates together or the popover can flash in the wrong place for one frame.
- Temporary chat overlays such as reaction pickers/details should dismiss on scroll, not only on outside click; otherwise they remain visually detached from the message they belong to.
- Reaction detail popovers should sit closer to their trigger than the emoji picker does; reusing the same offset for both makes the detail list feel detached.
- When the requirement is "open from the button edge", tray-level anchoring is too coarse; use the clicked chip/button rect as the popup anchor.
- If the requirement is "start from the button edge", avoid adding a second centering rule for wide messages; that fights the intended alignment and causes long-message popovers to drift left.
- If a host-only action is blocked by a rule like a character limit, keep the control visible in a disabled state with the error tooltip; hiding it entirely on long messages reads as a layout bug, not an intentional constraint.
- The stable rule for reaction-detail popovers is trigger-centered, not message-width-based: center the popup on the clicked chip with a small vertical offset, then clamp to the viewport edges. That keeps both short and wide message popovers close to the trigger without special long-message drift rules.
- If the UX rule is "open under the trigger", stop using viewport coordinate math for this popup. Render the reaction-detail list as an absolute child of the clicked reaction-chip wrapper and align it with `left-0` or `right-0`; that keeps long-message placement correct without chasing per-message geometry bugs.
- Once the reaction-detail popup is rendered as an absolute child of the clicked chip wrapper, do not add an extra centering transform for short messages. The wrapper itself is the precise anchor; adding `left-1/2 -translate-x-1/2` over-corrects and shifts the popup right.
- The correct side for a trigger-relative absolute popup should come from available viewport room at click time, not from message alignment. Decide `start` vs `end` from the clicked trigger rect, then let the popup stay absolute to that trigger wrapper.
