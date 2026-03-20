# Agent Workflow Notes

- Before suggesting any `git add` or `git commit` commands, run `git status --short`.
- Group commit suggestions logically by changed files and purpose instead of suggesting one broad commit by default.
- Do not suggest commit commands immediately after a change; first ask the user whether the work is finished and whether they like the result.
- If suggesting `git add .`, make sure the commit message covers all staged changes. If the commit message is narrower than the full diff, suggest scoped `git add` commands instead of `git add .`.
- Do not execute `git add`, `git commit`, or `git push` from the assistant. Always give those commands to the user to run manually.
- Do not execute git branch/switch commands from the assistant unless the user explicitly asks for that git action.
- If the user explicitly asks to undo or move git work, prefer non-destructive commands that preserve the working tree (`git reset --soft`, branch switch with carried changes, etc.).
- After each meaningful UI/code change, provide the relevant test command(s) and short manual test steps.
- Before starting each UI-facing step, tell the user exactly which screen/component/flow to compare in the app so they can visually verify before and after.
- After each UI-facing step, repeat those exact check locations as a short manual verification list.
- When giving UI verification, describe it as step-by-step app navigation: which page to open, which component to locate, which visual properties to compare, and which interaction state to try.
- If the user asks to work step by step, make one bounded change at a time, then stop for feedback before moving to the next visual revision.
- When the user says “note to yourself” for a project-specific workflow/design rule, record it here if it should persist for later turns in this repo.
- During redesign work, update `components/UI/classTokens.ts` and the relevant agent docs incrementally at each step instead of batching those updates at the end.
- During visual cleanup and class unification, preserve existing interaction behavior such as hover-revealed timestamps, tooltips, contextual actions, and disclosure states. Remove only the decorative layer you intend to remove, not the state hook that drives related behavior.
- After refactors or component extraction, verify that no stale references/import removals are left behind. Smoke test the directly affected screen/tab to avoid runtime `ReferenceError` issues.
- When you discover an unused, parallel, or no-longer-rendered component during a task, record it in `agent/lessons.md` so future work does not accidentally target dead UI paths.
- Before deleting "unused" files, verify real imports/usages first and then clean up stale state, handlers, comments, and support types in the entry points that previously referenced them.
- If the user explicitly defers a refactor or architecture cleanup to another branch, record it in the agent docs/backlog immediately and stop treating it as in-scope for the current branch.
- Keep shared visual class tokens centralized in one source of truth. In this repo, prefer extending `components/UI/classTokens.ts` instead of creating new small parallel `*Theme.ts` token files for the same UI layer.
- For entry-page headers, treat the home header as the visual source of truth and reuse one shared header shell/parts system instead of letting home, sync, and stream drift into separate wrappers.
- For top-level sibling entry pages such as `/sync` and `/stream`, prefer the home-style brand/logo in the shared header and omit back navigation unless the flow truly needs hierarchical “go back” behavior.
- If shared UI tokens become too large for one file, split them intentionally into a dedicated `components/UI/constants/` structure by domain. Do not scatter them across ad hoc theme files.
- When matching one component to another for visual consistency, treat the approved component as the visual reference and avoid changing that reference component unless the user explicitly asks for it.
- For repeated presentational UI structure, prefer small reusable primitives over duplicating markup or pushing many style props through multiple layers.
- For shared entry headers, align visible edges optically, not only by raw box dimensions. If a control's hit area makes it look inset, fix that once in the shared header token/component instead of nudging individual pages.
- Active entry routes should use the same header positioning mode and the same shared body offset. Do not mix fixed home headers with flow subpage headers when the goal is pixel-stable top spacing.
- Keep shared entry headers on one fixed-height row. If a subpage needs a centered title, overlay it inside that row instead of switching to a second internal layout mode.
- When entry pages share the same atmosphere or section-heading pattern, extract that into shared UI primitives instead of duplicating background layers or heading markup across routes.
- When the same backdrop should affect multiple routes, mount it once at the app/layout or shared scaffold level and make page wrappers transparent instead of re-rendering or overriding the backdrop per page.
- Once a backdrop is centralized in layout/scaffold ownership, do not keep exporting/importing that backdrop through page-level UI barrels; import it only at the owner layer so future pages do not accidentally reclaim background ownership.
- Name shared layout tokens by responsibility and viewport behavior (`layout content`, `fixed viewport page`, `flexible viewport page`) rather than names that could imply they own background styling.
- When `/sync`, `/stream`, and `/stream/screen` should feel like one family, push their shared surface/button/status color language into `components/UI/classTokens.ts` instead of leaving one-off inline gradients in only one route.
- During redesign, preserve the approved page structure, order, and placement unless the user explicitly asks for a structural change. Improve the visual system first, not the layout skeleton.
- During redesign, preserve the approved page sizing and proportional rhythm too. Do not change column widths, section heights, or component size hierarchy unless the user explicitly asks for that.
- On split entry pages, avoid adding large outer left/right section backgrounds when the child cards, fields, and lists already provide enough surface definition.
- On split entry pages, keep both columns on the same title-to-bottom rhythm. Use one shared flex-height contract rather than padding hacks to align their bottoms.
- In empty states, remove redundant helper tips when the placeholder rows/cards already communicate the flow clearly.
- For safe refactor passes, follow the checklist:
  - Only touch exact-match class strings or localize them into constants.
  - Do not change component behavior, state logic, or interaction wiring.
  - Keep the visual result identical; no color, spacing, or layout shifts.
  - Run lint on touched files and provide step-by-step UI checks.

# Agent Doc Roles

- `AGENTS.md` is the source of truth for durable workflow rules, UI/system standards, and persistent repo-specific instructions.
- `agent/rules.md` should stay as a concise mirror of the active execution rules and must not contradict `AGENTS.md`.
- `agent/tasks.md` should track the current active workstream, recent implementation status, and verification reminders. It should not keep stale "current step" notes after focus changes.
- `agent/lessons.md` should store mistakes, root causes, prevention rules, and notable design/engineering lessons learned from shipped or attempted work.
- `agent/tasks/notion-backlog.md` should stay as a product/backlog list, not as a duplicate execution log.
- When these files drift, prefer consolidating duplicate guidance and updating the file that matches the note's purpose instead of copying the same content into all files.
- `README.md` should stay project-specific and contributor-useful; do not leave it as generic framework boilerplate.
- Keep `AGENTS.md`, `agent/rules.md`, `agent/tasks.md`, `agent/lessons.md`, `agent/tasks/notion-backlog.md`, and `README.md` updated continuously when durable repo context changes; do not postpone doc upkeep until the end of a long workstream.
- In redesign passes, keep `components/UI/classTokens.ts` and the agent docs synchronized as the design evolves so shared tokens and workflow notes do not lag behind the UI changes.

# Localization Rules

- Keep user-facing i18n text synchronized for `en`, `tr`, `es`, and `ar` whenever UI copy changes.
- Keep translation keys under the correct namespace. Fix wrong call sites instead of duplicating the same copy under the wrong namespace just to silence missing-key issues.
- Replace hardcoded toast text and touched visible UI copy with translations in the areas you modify.
- When a backend or runtime error message may be absent, provide a translated fallback title/description instead of exposing a raw English fallback.
- After localization work, verify both locale-file parity and code-used translation key coverage; matching JSON structure alone is not enough.

# Page Stability Rules

- Avoid time-based layout shifts on onboarding, auth, stream, and other entry pages.
- Do not mount empty wrappers, helper rows, or placeholder blocks that auto-disappear later and change page geometry.
- If helper content needs to fade out, keep the layout height stable or animate opacity/content only.
- When a page has delayed state changes after mount, sanity-check the screen after a few seconds of idle time to catch vertical jumps or reflow regressions.
- On entry pages with one clear primary input, prefer focusing that input on open so the user can start typing immediately without an extra click.

# Entry UI Direction

- For home, onboarding, auth, and other entry flows, prefer calm low-chrome surfaces over loud decoration.
- Reduce border-heavy cards, stacked gradients, floating decorative elements, and heavy shadows unless they serve a clear UX purpose.
- Keep one primary brand accent system and let spacing, typography, and hierarchy do more of the work than visual effects.
- When simplifying a screen, remove decorative layers first before inventing new ones.
- On approved entry-page layouts, push minimal redesigns through typography, font weight, shadow, and border simplification before changing wrappers, spacing contracts, or component structure.
- If a section heading is already clear through spacing and type, avoid extra accent rails or colorful side lines; keep entry-page section titles closer to the shared header title scale.
- If the user says "Movmash theme color", use the panel active-tab gradient as the canonical brand accent unless they explicitly ask for a different palette.

# Modal Standardization Rules

- Prefer shared modal primitives and shared class tokens over repeating modal markup or local one-off styles.
- Avoid both style duplication and structure duplication in modals. Extract reusable layout/components before copying the same modal pattern twice.
- Keep modal surface/background, spacing rhythm, close button behavior, cancel/discard buttons, and confirm/primary buttons consistent across modals unless a modal truly needs a different behavior.
- Use shared color tokens/constants for frequently reused modal brand colors instead of repeating gradient strings inline.
- Modal close buttons should stay minimal: no hover background fill, no unnecessary outline/ring styling, and hover should mainly change icon color.
- Modal action buttons should default to no shadow unless there is a clear approved reason to add one.
- Modal inputs should follow a minimal path by default: no visible border, no heavy outline, and only a subtle focus treatment.
- Prefer inline validation messaging inside form modals for field-level input errors; reserve toast notifications for success states and general/backend errors.
- In form modals, if an error belongs to a specific field, show it near that field instead of using a toast. Use toast only when the message is not tied to one field or when it is a success/global state.
- Modal panels should avoid unnecessary outer borders when the shared modal surface already defines the look.
- Prefer balanced top/bottom spacing in modal content. Do not let ad hoc header padding create awkward empty space.
- Keep modal UI minimal and avoid overdesign: no extra decorative layers, outlines, hover fills, or nested backgrounds without a clear reason.
- Keep discard/cancel actions on one shared visual style and keep confirm actions on one shared visual style.
- For destructive confirm modals, keep the confirm action danger-oriented, but header/icon branding may use the shared Movmash brand palette when that matches the approved design direction.
- Before changing modal input visuals in future steps, get user confirmation first if the change is a design revision rather than a bug fix.

# Layout And Alignment Rules

- For alignment work, prefer structural layout utilities such as `flex`, `grid`, `items-*`, `justify-*`, `self-*`, and `gap-*` before reaching for ad hoc margin/padding tweaks.
- Keep sibling alignment consistent by putting items inside a shared layout wrapper instead of offsetting one side with extra left/right spacing.
- Use padding mainly for container insets and section breathing room; use layout utilities for internal alignment.
- When tightening or balancing UI spacing, prefer shared wrapper spacing and `gap-*` over scattered one-off `ml-*`, `mr-*`, `mt-*`, or `mb-*` fixes.
- When a shared surface token already defines the panel/popover/card look, prefer using it directly instead of stacking extra shadow, border, or blur utilities on top unless the extra layer creates a clearly intentional distinction.
- In class unification work, remove redundant visual add-ons from consumers before creating new tokens for them. Favor one unified surface treatment over multiple slightly different layered versions.
- Treat `components/UI/classTokens.ts` as the first stop for shared UI surface and control styling. Before adding or editing repeated classes, check whether an existing token should be reused or extended there instead of creating a near-duplicate inline string.
- When `classTokens.ts` is being actively unified, edit cautiously: preserve the existing visual system, avoid parallel duplicates, and do not let one local tweak drift the app-wide CSS language.

# Future UI TODOs

- `UrlModal`: for unsupported links, disable the primary add button instead of keeping it clickable. On hover over the disabled button, show a tooltip explaining that the link is not supported, so we can remove extra helper/info text below the input.
