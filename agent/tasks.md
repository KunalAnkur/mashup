# Tasks

Primary backlog lives in [tasks/notion-backlog.md](./tasks/notion-backlog.md).

## Current Step

- Date: 2026-03-19
- Active task: Entry-page polish, now extending the home direction into the `/sync` header.
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
  - Keep the home brand only on the home-style fixed header; subpage entry headers (`/sync`, `/stream`, `/stream/screen`) should not re-show the Movmash logo/text.
  - Keep shared entry-header interactions minimal: the back arrow should only change color on hover, and the authenticated avatar should match the logo size for a cleaner, more consistent top bar.
  - Keep active entry routes on the same fixed-header + shared body-offset contract so the top gap cannot drift by a couple of pixels between home and subpages.
  - Keep the shared entry header on one fixed-height row and render subpage titles as overlays inside that row so title/back/auth variations never change the top rhythm.
  - Keep the shared back-arrow hit area large, but align the visible arrow anchor to the same left start line as the home logo so page switches feel perfectly consistent.
  - Keep the shared back arrow visually strong enough to balance the home logo mark; tune icon size in the shared header component instead of per-route overrides.
  - Keep shared back-arrow strength in the token/component layer too: if it feels too weak next to the home logo, increase icon size/stroke there instead of padding hacks.
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

## Execution Reminders

1. Do not start implementation without user permission if the user wants step-by-step approval first.
2. Before coding, explain the next implementation step briefly.
3. After each meaningful change, provide test steps.
4. Only suggest commit commands after checking `git status --short` and after the user confirms the change is finished.
