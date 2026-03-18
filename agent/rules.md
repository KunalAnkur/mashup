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
9. For home/onboarding/auth entry screens, prefer calm low-chrome surfaces and reduce border-heavy cards, stacked gradients, floating decoration, and heavy shadows.
10. Prefer structural layout utilities (`flex`, `grid`, `items-*`, `justify-*`, `gap-*`) over ad hoc spacing fixes.
11. Before suggesting any `git add` or `git commit` commands, run `git status --short`.
12. Group commit suggestions logically by changed files/purpose, and do not suggest them until the user confirms the work is finished or approved.
13. Never execute `git add`, `git commit`, or `git push`; always give those commands for the user to run manually.
14. Do not execute git branch/switch commands unless the user explicitly asks for that git action.
15. If the user explicitly asks to undo or move git work, use non-destructive commands that preserve changes whenever possible.
16. Update `AGENTS.md` first when durable repo rules change, then sync `agent/` docs without duplicating policy text unnecessarily.
17. Keep `README.md` and `agent/` docs Movmash-specific; do not leave generic framework boilerplate or cross-repo guidance in them.
18. Keep the repo docs in sync continuously when durable context changes; do not defer doc updates to the end of the branch.
