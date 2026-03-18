# Movmash Costume

Frontend workspace for the Movmash watch-party app.

`costume` contains the user-facing experience for:

- stream-from-device flows
- screen-share room creation
- sync-by-URL flows
- room chat, reactions, and panel UI
- auth and guest entry
- localized UI in `en`, `tr`, `es`, and `ar`

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Redux Toolkit / RTK Query
- Custom client i18n via `i18n/messages/*.json`

## Commands

```bash
pnpm install
pnpm dev
pnpm exec eslint <path>
pnpm exec tsc --noEmit
```

Use focused lint/smoke checks on touched files and screens. If `tsc` reports unrelated pre-existing issues, note that clearly instead of folding them into the change you just made.

## Important Paths

- `app/`
  App Router pages and layouts.
- `components/`
  UI, panels, onboarding flows, modals, and player surfaces.
- `context/`
  Auth, socket, room, file, and media context providers.
- `hooks/`
  Stream/sync/chat/helpers and shared UI behavior hooks.
- `i18n/messages/`
  Locale dictionaries for `en`, `tr`, `es`, and `ar`.
- `agent/`
  Repo-specific execution rules, lessons, active workstream notes, and backlog.

## Repo Guardrails

- Keep user-facing copy synchronized across `en`, `tr`, `es`, and `ar`.
- Do not leave hardcoded toast text or touched UI copy in components when a translation path exists.
- After localization work, verify both locale-file parity and code-used translation keys.
- Avoid timed layout shifts on onboarding/stream pages. Do not auto-remove empty wrappers that change page height after mount.
- Prefer shared modal primitives, class tokens, and layout utilities over ad hoc duplication.

## Doc Map

- `AGENTS.md`
  Source of truth for durable Movmash workflow rules and UI/system standards.
- `agent/rules.md`
  Concise execution mirror of the active rules.
- `agent/tasks.md`
  Current workstream, recent durable context, and verification reminders.
- `agent/lessons.md`
  Mistakes, root causes, and prevention notes.
- `agent/tasks/notion-backlog.md`
  Product/backlog list, not an execution log.
