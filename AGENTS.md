# Agent Workflow Notes

- Before suggesting any `git add` or `git commit` commands, run `git status --short`.
- Group commit suggestions logically by changed files and purpose instead of suggesting one broad commit by default.
- Do not suggest commit commands immediately after a change; first ask the user whether the work is finished and whether they like the result.
- If suggesting `git add .`, make sure the commit message covers all staged changes. If the commit message is narrower than the full diff, suggest scoped `git add` commands instead of `git add .`.
- After each meaningful UI/code change, provide the relevant test command(s) and short manual test steps.
- If the user asks to work step by step, make one bounded change at a time, then stop for feedback before moving to the next visual revision.
- When the user says “note to yourself” for a project-specific workflow/design rule, record it here if it should persist for later turns in this repo.
- After refactors or component extraction, verify that no stale references/import removals are left behind. Smoke test the directly affected screen/tab to avoid runtime `ReferenceError` issues.
- Before deleting "unused" files, verify real imports/usages first and then clean up stale state, handlers, comments, and support types in the entry points that previously referenced them.
- If the user explicitly defers a refactor or architecture cleanup to another branch, record it in the agent docs/backlog immediately and stop treating it as in-scope for the current branch.

# Agent Doc Roles

- `AGENTS.md` is the source of truth for durable workflow rules, UI/system standards, and persistent repo-specific instructions.
- `agent/rules.md` should stay as a concise mirror of the active execution rules and must not contradict `AGENTS.md`.
- `agent/tasks.md` should track the current active workstream, recent implementation status, and verification reminders. It should not keep stale "current step" notes after focus changes.
- `agent/lessons.md` should store mistakes, root causes, prevention rules, and notable design/engineering lessons learned from shipped or attempted work.
- `agent/tasks/notion-backlog.md` should stay as a product/backlog list, not as a duplicate execution log.
- When these files drift, prefer consolidating duplicate guidance and updating the file that matches the note's purpose instead of copying the same content into all files.

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

# Future UI TODOs

- `UrlModal`: for unsupported links, disable the primary add button instead of keeping it clickable. On hover over the disabled button, show a tooltip explaining that the link is not supported, so we can remove extra helper/info text below the input.
