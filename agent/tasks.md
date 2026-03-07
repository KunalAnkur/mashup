# Tasks

Primary backlog lives in [tasks/notion-backlog.md](./tasks/notion-backlog.md).

## Current Step

- Date: 2026-03-07
- Active task: Task 3 + Task 9 (chat message delay and sender own-message delay)
- Status: In progress (Task 1 and Task 2 completed)
- Sub-update: Added optimistic message rendering and server-event reconciliation for chat sends.
- Sub-update: Fixed multiline chat composer width shrink by enforcing `flex-1 min-w-0 w-full` input area and `flex-shrink-0` actions area.
- Sub-update: Fixed composer wrap instability by making action buttons absolute and reserving right padding in input/textarea.
- Sub-update: Reduced reserved right padding to bring text visually closer to composer action buttons.
- Sub-update: Reverted absolute composer actions and restored balanced flex layout; added long-word wrapping (`break-all`) for textarea stability.
- Sub-update: Restored compact composer height and centered icon/text alignment while keeping long-word wrapping.
- Localization note: No new UI text in this step (`tr/en/es` unchanged).

Rules for execution:

1. Do not start any task without your permission.
2. Before coding, explain the planned implementation.
3. After each change, provide meaningful `git add` and `git commit -m` suggestions.
