# Tasks

Primary backlog lives in [tasks/notion-backlog.md](./tasks/notion-backlog.md).

## Current Step

- Date: 2026-03-19
- Active task: Home-page professional polish while preserving the room/panel visual pattern.
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
  - Keep the home page shell centered at `max-w-7xl` while preserving the existing content order and alignment.
  - Route repeated home-entry styling through `components/UI/classTokens.ts` where practical instead of adding new near-duplicate inline surface classes.
  - During redesign, keep `components/UI/classTokens.ts` and the relevant agent docs updated at each step so the system stays easy to extend.
  - On single-input entry flows, prefer focusing the primary input on open to reduce click friction.
  - Apply that single-input autofocus rule only to clear entry flows like home join and sync URL entry, not to multi-input forms or hidden utility inputs.
  - When applying entry UX rules, check the live route's actual rendered component path first, not only older parallel components.
  - Record discovered unused/non-rendered component paths in `agent/lessons.md` during each step so future work avoids dead UI.
  - This autofocus pass is complete for the current top-level entry routes: apply only on `/` join and live `/sync` URL input unless a new qualifying entry flow is added later.
  - Top-level route audit is complete: do not add autofocus to room chat, hidden file inputs, checkboxes, or multi-input auth/forms in the current app structure.
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
