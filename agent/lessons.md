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
