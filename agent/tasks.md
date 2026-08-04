# Tasks

Primary backlog lives in [tasks/notion-backlog.md](./tasks/notion-backlog.md).

## Current Step

- Date: 2026-03-20
- Active task: Refine the top intro state on `/stream/screen` so the icon, title, and support text read as one aligned cluster without reintroducing boxy hero chrome.
- Status: In progress.
- Completed in this workstream:
  - Refreshed `AGENTS.md` as the durable source of truth for workflow, localization, git, and layout-stability rules.
  - Synced `agent/rules.md` to the updated Movmash rules.
  - Replaced the generic `README.md` with a Movmash-specific contributor overview.
  - Added new lessons for localization audit coverage and stream-page layout stability.
  - Added a backlog reminder for the remaining app-wide hardcoded-copy/i18n pass.
- Current focus:
  - Keep rule docs aligned with actual shipped behavior and recent fixes.
  - Update `AGENTS.md` first when durable context changes, then mirror only the concise pieces into `agent/`.
  - Keep the repo docs updated during the workstream, not only as an end-of-branch cleanup.
  - Keep the room/panel-style home background and the newer language selector treatment.
  - Keep the original home-page placement/order intact instead of introducing a new composition.
  - Keep shared entry pages on a centered `max-w-6xl` shell while preserving the existing content order and alignment.
  - Route repeated home-entry styling through `components/UI/classTokens.ts` where practical instead of adding new near-duplicate inline surface classes.
  - During redesign, keep `components/UI/classTokens.ts` and the relevant agent docs updated at each step so the system stays easy to extend.
  - On single-input entry flows, prefer focusing the primary input on open to reduce click friction.
  - Apply that single-input autofocus rule only to clear entry flows like home join and sync URL entry, not to multi-input forms or hidden utility inputs.
  - When applying entry UX rules, check the live route's actual rendered component path first, not only older parallel components.
  - Record discovered unused/non-rendered component paths in `agent/lessons.md` during each step so future work avoids dead UI.
  - This autofocus pass is complete for the current top-level entry routes: apply only on `/` join and live `/sync` URL input unless a new qualifying entry flow is added later.
  - Top-level route audit is complete: do not add autofocus to room chat, hidden file inputs, checkboxes, or multi-input auth/forms in the current app structure.
  - Start `/sync` redesign from the header first, using one shared entry-header component directly in home, `sync`, and `stream` routes so wrapper drift cannot reappear.
  - Keep `/sync` on a `max-w-6xl` stage and avoid making the header feel like a bordered/shadowed floating card.
  - Use shared entry-page shell/inset tokens for home and `/sync` so horizontal spacing stays identical across those pages.
  - Apply one shared entry-header shell/parts system to every `PageHeader` route instead of maintaining separate home vs subpage header wrappers.
  - Keep active entry routes mounted on `EntryPageHeader` directly so alignment fixes live in one place instead of drifting between wrapper components.
  - Keep the back-navigation hit area, but optically align the visible arrow with the home header edge in the shared header token instead of patching route-specific padding.
  - For top-level sibling entry pages like `/sync` and `/stream`, keep the home-style brand/logo in the shared header and drop the back button so the top bar still feels like one family.
  - Keep shared entry-header interactions minimal: the back arrow should only change color on hover, and the authenticated avatar should match the logo size for a cleaner, more consistent top bar.
  - Keep active entry routes on the same fixed-header + shared body-offset contract so the top gap cannot drift by a couple of pixels between home and subpages.
  - Keep the shared entry header on one fixed-height row and render subpage titles as overlays inside that row so title/back/auth variations never change the top rhythm.
  - Keep the shared back-arrow hit area large, but align the visible arrow anchor to the same left start line as the home logo so page switches feel perfectly consistent.
  - Keep the shared back arrow visually strong enough to balance the home logo mark; tune icon size in the shared header component instead of per-route overrides.
  - Keep shared back-arrow strength in the token/component layer too: if it feels too weak next to the home logo, increase icon size/stroke there instead of padding hacks.
  - Keep home, `/sync`, and `/stream` on one shared entry backdrop primitive and one shared header system so the redesign stays consistent without route-specific wrappers.
  - Keep the app-wide backdrop owned once in `app/layout.tsx`, then remove page-level backdrop duplicates and opaque route wrappers so one edit changes the whole product atmosphere.
  - Keep route/page wrappers transparent once the global backdrop is in place; do not leave old solid fills or duplicated glow/emoji background blocks hiding the shared backdrop.
  - Preserve the exact approved base darkness when centralizing the backdrop; the shared backdrop owner should carry the old `#09090c` base tone so the app does not drift into a grayer mood after layout centralization.
  - Keep page viewport helpers responsible only for height/overflow/text rhythm; backdrop ownership should stay in layout and not leak back into page-level imports or tokens.
  - Keep token names equally explicit: use viewport/layout wording for wrapper helpers so future edits do not confuse height helpers with background ownership.
  - Keep `/stream/screen` in the same visual family as `/stream` and `/sync` by routing hero/status/step/warning/button surfaces into shared class tokens instead of leaving older zinc-only gradients inline in the page file.
  - On `/stream/screen`, keep the first `Ready to share` state visually open: remove the extra outer hero surface when it makes the page feel box-in-box, then center the CTA and strengthen supporting copy through shared tokens.
  - On `/stream/screen`, keep the intro copy and icon in one side-by-side cluster when that makes the first state easier to scan than a stacked icon-above-title treatment.
  - On `/stream/screen`, keep the intro cluster and its primary CTA on the same width guide so the top state feels deliberately aligned instead of loosely centered.
  - On `/stream/screen`, keep the intro copy itself centered and slightly strengthen small supporting text when the first state still feels hard to read.
  - On `/stream/screen`, if the icon does not add meaning in the open intro state, remove it and let the centered title/subcopy carry the section.
  - On `/stream/screen`, keep scroll behavior but hide the visible scrollbar when it adds visual noise; users should still be able to scroll the page naturally.
  - On `/stream/screen`, the full viewport should feel scrollable, not only the centered content column; if React-level wheel forwarding is unreliable, use a route-scoped `window` wheel listener and slightly stronger delta so the page still feels fast.
  - Keep `app/not-found.tsx` on the shared entry shell/header too; fallback pages should feel like first-class Movmash routes instead of custom one-off animated screens.
  - Keep `not-found` CTAs on explicit router handlers too: `Go Home` should always route to `/`, and `Go Back` should fall back to home if browser history does not actually change the page.
  - On `not-found`, make `Go Home` the fast path: prefer a prefetched `Link` to `/` over a timeout-based JS handler when the route is known and stable.
  - On `not-found`, prefer the normal home-style brand header over a centered header title so the Movmash logo stays clearly visible.
  - Keep the `notFound` translation namespace fully synced in every locale and verify the page renders every key it depends on, including the translated title.
  - For entry-page redesign passes, keep the approved layout skeleton intact and avoid large structure shifts unless the user explicitly asks for them.
  - On split entry pages like `/sync`, avoid extra outer left/right panel backgrounds; let the inner controls/cards define the surfaces.
  - Keep split entry columns visually equal in height through the shared row/column contract, not by wrapping each side in another large background panel.
  - If a sub-section already had an approved strong internal card style, restore that child-level character before inventing a flatter replacement; keep the column open but let the boxes stay bold.
  - When a redesign pass restores a baseline structure/sizing pattern, remove any now-unused primitives created by the abandoned direction instead of leaving parallel UI helpers behind.
  - Keep adjacent controls in the same row visually paired; if an input and its primary companion button sit side by side, their corner radius should match.
  - On `/sync`, keep section content aligned to the title guide and avoid extra empty-state wrapper backgrounds; the placeholder cards themselves are enough.
  - On `/sync`, keep left and right columns aligned from the section titles down to the bottom edge, and remove redundant tip copy from the empty state.
  - On `/sync`, keep the filled URL list shell visually open too; once the child URL cards exist, do not add another background panel behind them.
  - On `/sync`, keep added URL cards visually static and keep the input/action controls slightly shorter once the structure is approved; oversized or reactive cards make the page feel heavier than it needs to.
  - Keep `/sync` URL-card thumbnails on a video-friendly ratio so previews do not feel cut from the top and bottom.
  - Keep `/sync` card numbering minimal too; once the order is clear, prefer a quiet numeral over a separate badge chip.
  - Keep the `/sync` card start cluster tight too: the ordinal should sit close to the left edge, with a smaller gap before the thumbnail.
  - Once the `/sync` card index becomes plain text, remove any leftover fixed box width/height around it too; otherwise hidden badge spacing remains.
  - Treat the panel active-tab gradient as the current canonical Movmash theme color; reuse it when the user asks for "Movmash theme color" on buttons or accents.
  - When an empty shell is transparent, top-align the placeholder rows instead of vertically centering them; centered empty states create fake top/bottom imbalance.
  - On `/sync`, use enough placeholder rows in the empty list to avoid leaving a large dead gap; three rows is the current better balance than two.
  - On approved `/sync` structure, make minimal cleanup through calmer type, lighter font weights, and reduced border/shadow noise before touching wrappers or layout contracts.
  - Keep entry-page section titles closer to the shared header title scale and remove decorative accent rails when the typography already carries the hierarchy.
  - On `/stream`, keep the existing screen-share-left / file-selection-right structure and only simplify surfaces, typography, borders, and CTA color weight.
  - On `/stream`, route the new visual language through `components/UI/classTokens.ts` instead of reintroducing local gradient/overlay stacks in `FileSelection` or `ScreenShareBox`.
  - On `/stream`, keep the columns visually open like `/sync`: remove extra nested panel backgrounds and let the real cards/controls carry the surfaces.
  - On `/stream`, reuse the home-page accent mood for color treatment so the page feels like the same product family instead of a separate palette.
  - On `/stream`, once the outer panel bg is gone, also remove leftover inner padding/right-scroll padding so the right column aligns cleanly to the same left/right guides as the title row and action buttons.
  - On `/stream`, keep the upload surface borderless when the gradient/background already defines the drop area strongly enough.
  - On `/stream`, if the user asks for the new gradient vibe, apply it across the real action buttons too so the CTA family feels intentional instead of mixing one vivid button with plain gray siblings.
  - On `/stream`, remove helper tip copy entirely once the upload states and controls are already self-explanatory.
  - On `/stream`, if the left screen-share area still feels off after the button pass, retune that card slightly within the same home-like gradient family and avoid re-adding the removed helper text block.
  - On `/stream`, once the bottom actions are clear enough, drop the extra local back button and keep `Use Sync` + `Start Watching` paired in one row.
  - On `/stream`, if the file cards still feel dull or bulky, reduce their height first and then tune the card gradients/thumbnail surface before touching layout.
  - On `/stream`, if the selected file edge gets clipped, add only a tiny top/side breathing room to the list and prefer an inset selected border over an outer ring.
  - On `/stream`, keep the desktop file-list viewport tall enough to show 3 cards before scrolling; the right column feels better with a slightly larger visible stack.
  - On `/stream`, keep the empty file state on that same 3-row viewport height too; do not let the empty upload state collapse shorter than the filled list.
  - On `/stream`, keep the original centered upload empty-state artwork intact; increase the viewport height around it instead of filling the box with extra placeholder rows.
  - On `/sync`, keep the approved structure but retune the surface palette toward the newer `/stream` family so left cards, right controls, and bottom actions feel like one product line.
  - Keep `stream`, `stream/screen`, and `/sync` on the same shared width/inset contract so their left-right page edges never drift apart.
  - Match every shared `PageHeader` route to the home header's exact side-ratio (`mx-4` mobile, `mx-5` from `sm`) instead of letting stream/sync drift wider than the home top bar.
  - Remove leftover outer flex-centering wrappers and extra header spacing from entry pages when the shared `max-w-6xl` shell already owns page width, so the visual stage stays identical to home.
  - Limit home-page changes to refreshed colors, surfaces, and typography while preserving existing locations.
  - Keep the home brand in the fixed top row with the language/auth controls instead of duplicating it in the content column.
  - Prefer an icon-led but borderless/background-free auth trigger in the top-right header.
  - Keep temporary implementation history out of this file unless it changes current execution priorities.
- Verification reminder:
  - After UI copy changes, re-run locale parity and code-used translation-key checks.
  - After onboarding/auth/stream layout changes, idle on the page for a few seconds to catch delayed reflow/jump regressions.
  - When simplifying entry screens, verify that removed decorative layers do not leave behind spacing gaps or visual imbalance.
  - After git workflow requests, verify branch pointers and working-tree state before and after any undo/move operation.

## Recent Durable Context

- Shared modal primitives, modal theme tokens, and modal consistency rules are now the default path for room/panel modal work.
- Deferred to separate branches:
  - Rename `DeviceModalComponents`, `UrlModalComponents`, and `hooks/ModalHooks` to match their broader responsibilities.
  - Run an app-wide alignment/spacing cleanup toward shared layout patterns instead of margin/padding drift.
  - Do a broader architecture cleanup around `stream` / `sync` page ownership.
- Localization work now requires both dictionary sync and a code-usage audit; matching locale file structure alone is not enough.
- The daily watch limit now has three escalation tiers, and new limit UI should slot into one of them rather than adding a fourth surface: ambient panel card (always, `WatchLimitIndicator`), a one-shot host-only toast nudge at 10 minutes remaining (`showActionToast`, guarded by `room.watchLimitNudgeShown`), and the blocking modal at zero. The 10-minute threshold is a starting guess — tune it from `watch_limit_nudge_shown` vs. `upgrade_clicked` / `daily_limit_reached`.

## Execution Reminders

1. Do not start implementation without user permission if the user wants step-by-step approval first.
2. Before coding, explain the next implementation step briefly.
3. After each meaningful change, provide test steps.
4. Only suggest commit commands after checking `git status --short` and after the user confirms the change is finished.
