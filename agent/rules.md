# Agent Rules

These rules are mandatory for active work in this repo unless the user explicitly overrides them.
Last sync: 2026-03-15 (modal standardization + agent doc audit)

1. Use Tailwind CSS for UI work.
2. Write clean, maintainable code with minimal side effects.
3. Do not start implementing without user permission when the user is asking to go step by step or explicitly wants approval first.
4. Before coding, explain the next implementation step briefly.
5. After each meaningful change, provide relevant test commands and short manual test steps.
6. Keep user-facing i18n text synchronized for `en`, `tr`, `es`, and `ar` when UI copy changes.
7. Before suggesting any `git add` or `git commit` commands, run `git status --short`.
8. Group commit suggestions logically by changed files/purpose, and do not suggest them until the user confirms the change is finished or approved.
9. Do not execute git branch/switch/add/commit commands from the assistant; provide commands for the user to run manually.
10. Update `costume/agent/` docs when context actually changes, but avoid blind churn or duplicate notes across files.
11. `AGENTS.md` is the source of truth for durable repo workflow and UI/system standards; keep this file aligned with it.
12. Keep `agent/` docs repo-specific. Do not reuse them across other repos.
