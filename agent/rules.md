# Agent Rules

These rules are mandatory for active work in this repo unless the user explicitly overrides them.
Last sync: 2026-03-19 (doc refresh + i18n + layout stability)

1. Use Tailwind CSS for UI work.
2. Write clean, maintainable code with minimal side effects.
3. If the user wants step-by-step work or explicit approval first, explain the next implementation step briefly before coding.
4. After each meaningful change, provide relevant test commands and short manual test steps.
5. Keep user-facing i18n text synchronized for `en`, `tr`, `es`, and `ar` whenever copy changes.
6. Do not leave hardcoded toast text or touched UI copy in modified areas when a translation path should exist.
7. After localization work, verify both locale-file parity and code-used translation keys.
8. Avoid time-based layout shifts from disappearing wrappers, helpers, or placeholders, especially on onboarding/auth/stream pages.
9. On entry pages with one clear primary input, focus that input on open when it improves immediate typing flow.
10. For home/onboarding/auth entry screens, prefer calm low-chrome surfaces and reduce border-heavy cards, stacked gradients, floating decoration, and heavy shadows.
11. Prefer structural layout utilities (`flex`, `grid`, `items-*`, `justify-*`, `gap-*`) over ad hoc spacing fixes.
12. Treat `components/UI/classTokens.ts` as the shared UI style source of truth; reuse or extend tokens there before adding repeated inline class strings.
13. During class unification work, avoid local near-duplicate CSS and make token changes cautiously so one tweak does not unintentionally drift the app-wide design language.
14. During redesign work, update `components/UI/classTokens.ts` and the relevant agent docs step by step instead of postponing those syncs.
15. When you discover an unused, parallel, or no-longer-rendered component path, record it in `agent/lessons.md`.
16. Treat the home header as the source of truth for entry-page headers and reuse one shared header shell/parts system across home, sync, and stream routes.
17. For top-level sibling entry pages such as `/sync` and `/stream`, default to the home-style brand/logo in the shared header and skip back navigation unless the flow truly needs it.
18. Before suggesting any `git add` or `git commit` commands, run `git status --short`.
19. Group commit suggestions logically by changed files/purpose, and do not suggest them until the user confirms the work is finished or approved.
20. Never execute `git add`, `git commit`, or `git push`; always give those commands for the user to run manually.
21. Do not execute git branch/switch commands unless the user explicitly asks for that git action.
22. If the user explicitly asks to undo or move git work, use non-destructive commands that preserve changes whenever possible.
23. Update `AGENTS.md` first when durable repo rules change, then sync `agent/` docs without duplicating policy text unnecessarily.
24. Keep `README.md` and `agent/` docs Movmash-specific; do not leave generic framework boilerplate or cross-repo guidance in them.
25. Keep the repo docs in sync continuously when durable context changes; do not defer doc updates to the end of the branch.
26. For shared entry headers, fix optical edge alignment in the shared token/component layer instead of nudging individual route wrappers.
27. For pixel-stable entry-page top spacing, keep active entry routes on one shared header positioning mode and one shared body offset token.
28. Keep shared entry headers on one fixed-height row; if a subpage needs a centered title, overlay it inside that row instead of switching to a second layout structure.
29. When entry pages share the same backdrop or section-heading pattern, move that structure into shared UI primitives instead of duplicating it per route.
30. During redesign, preserve approved page structure/order/placement unless the user explicitly wants structural change; improve surfaces, colors, spacing, and typography first.
31. On split entry pages, do not add large outer left/right section backgrounds when inner cards/fields already carry the visual surface.
32. During redesign, preserve the approved sizing/proportional rhythm too; do not change column widths, section heights, or component size hierarchy unless the user asks for it.
33. On split entry pages, keep both columns on the same title-to-bottom rhythm using shared flex-height contracts, not ad hoc padding/margin balancing.
34. Remove redundant empty-state helper tips when the placeholder content already explains the flow.
35. On approved entry-page layouts, make minimal redesign passes by simplifying typography, font weight, borders, and shadows before changing wrappers or structure.
36. If a section heading is already clear through spacing and type, avoid decorative accent rails and keep it closer to the shared header title scale.
37. If the user says "Movmash theme color", use the panel active-tab gradient as the default brand accent unless they ask for another palette.
