# Lessons

Use this file to record mistakes, root causes, and prevention steps.

## Entry Template

- Date:
- Context:
- Error:
- Root cause:
- Prevention checklist:
- Follow-up action:

## 2026-03-07

- Date: 2026-03-07
- Context: Google One Tap login in `costume` app.
- Error: `FedCM get() rejects with NetworkError: Error retrieving a token.`
- Root cause: Google One Tap token request can fail when OAuth JavaScript origins are not configured for the active origin or browser privacy blocks FedCM/cookies.
- Prevention checklist:
  - Validate `NEXT_PUBLIC_GOOGLE_CLIENT_ID` per environment.
  - Ensure all active origins are listed in Google OAuth Authorized JavaScript origins.
  - Test login in normal browser mode before release.
- Follow-up action: Keep auth provider setup and environment checks in pre-release QA.

## 2026-03-07 (Chat Scroll UX)

- Date: 2026-03-07
- Context: Chat tab in right panel re-opened after switching tabs.
- Error: Scroll starts at top and then visibly moves to bottom.
- Root cause: Chat remount + auto-scroll via `scrollIntoView({ behavior: "smooth" })` after render.
- Prevention checklist:
  - Use container-based scroll with `useLayoutEffect` for bottom pin on mount/history render.
  - Auto-scroll only when user is near bottom.
  - Avoid smooth auto-scroll for initialization cases.
  - Do not apply stagger/mount animations to full historical chat lists on tab mount.
- Follow-up action: Apply same scroll pattern to any future chat-like list.

## 2026-03-07 (Typing Username Resolution)

- Date: 2026-03-07
- Context: Chat typing indicator was showing generic `USER` instead of real username.
- Error: Typing label looked like placeholder text, reducing clarity in multi-user rooms.
- Root cause: Typing payload/userName fallback path allowed generic values; UI relied on raw typing event name.
- Prevention checklist:
  - Resolve typing display names from participant data first (`socketId` match), then message history.
  - Prefer `username` over `name` for typing payloads.
  - Keep fallback order deterministic: `username` -> `name` -> email prefix -> `User`.
- Follow-up action: Reuse this resolution pattern for other transient user-presence UI states.
- Validation: Confirmed working by user on 2026-03-07.
