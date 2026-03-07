# Agent Rules

These rules are mandatory for all future work in this repo unless you override them.
Last sync: 2026-03-07 (Task 3/9 + dev-baseline composer alignment restore)

1. Use Tailwind CSS.
2. Write clean code.
3. In every step, remind the user to test so nothing breaks.
4. In every step, update all docs under `agent/` so context and learning stay current.
5. In every step, do not forget localization texts for `tr`, `en`, `es`, and other active app languages.
6. Do not start implementing tasks without user permission.
7. Before coding, explain what will be done.
8. Only code after explicit user permission.
9. After every file change, provide meaningful `git add` and `git commit -m` suggestions.
10. Keep `agent/` docs repo-specific: `costume/agent` is only for costume. For `guardian` or `communication`, create separate `agent/` folders inside those repos with their own context files.
# Costume Agent Rules

- Use Tailwind CSS for UI work.
- Write clean, maintainable code with minimal side effects.
- Before coding, explain the next implementation step and wait for permission.
- Remind to test after each meaningful change so nothing breaks.
- Update all files under `costume/agent/` during each task iteration.
- Keep user-facing i18n text synchronized for `en`, `tr`, `es`, and `ar`.
- Do not execute git branch/switch/add/commit commands from the assistant. Always provide those commands to the user to run manually.
- Do not add `agent/` files to `.gitignore`.
