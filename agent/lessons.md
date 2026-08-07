# Lessons

Use this file to record mistakes, root causes, and prevention steps.

## Entry Template

- Date:
- Context:
- Error:
- Root cause:
- Prevention checklist:
- Follow-up action:

## 2026-03-19 (Localization Audit Coverage)

- Date: 2026-03-19
- Context: App-wide toast and translation cleanup across `en`, `tr`, `es`, and `ar`.
- Error: Locale JSON files matched each other structurally, but the app still had missing translation keys in code, wrong namespaces, and hardcoded English fallbacks in active flows.
- Root cause: Locale-file parity was treated as enough validation, while code-used translation keys and namespace alignment were not audited after copy changes.
- Prevention checklist:
  - Keep locale dictionaries synchronized across all four languages whenever user-facing copy changes.
  - Audit code-used translation keys after localization work; do not rely on JSON parity alone.
  - Fix wrong `useTranslations(...)` namespaces at the call site instead of duplicating strings under the wrong namespace.
  - Replace hardcoded toast strings and touched visible UI copy in the areas being edited.
  - Provide translated fallback copy when runtime/backend messages may be absent.
- Follow-up action: Reuse the same locale-parity + code-usage audit pattern for future i18n work and keep app-wide hardcoded-copy cleanup tracked in backlog.

## 2026-03-19 (Timed Layout Shift on Stream Page)

- Date: 2026-03-19
- Context: `/stream` page content visibly moved upward a few seconds after load.
- Error: The stream page looked stable on first render, then jumped when a delayed helper block disappeared.
- Root cause: An empty desktop-only wrapper with bottom margin was still mounted and auto-removed after a timeout, causing a real layout reflow even though the helper text inside it was commented out.
- Prevention checklist:
  - Do not keep empty placeholder/helper wrappers mounted if they reserve space.
  - Avoid auto-dismissing blocks that change page geometry after mount.
  - If helper content must fade, keep height stable or animate content opacity only.
  - After onboarding/auth/stream page changes, idle on the page for several seconds to catch delayed reflow issues.
- Follow-up action: Apply the same stability check to other entry pages that use delayed effects, helper banners, or auto-hide UI.

## 2026-03-19 (Git Command Ownership)

- Date: 2026-03-19
- Context: Repo workflow in `costume`.
- Error: Assistant executed `git add`, `git commit`, and `git push`, but the user wants to keep those actions in their own hands.
- Root cause: Repo-specific git ownership preference was not recorded clearly enough in the durable workflow rules.
- Prevention checklist:
  - Never run `git add`, `git commit`, or `git push` in this repo.
  - Always provide the exact git commands for the user to run manually.
  - Keep any git help scoped to status checks, diff inspection, and command suggestions unless the user explicitly asks for another git action.
- Follow-up action: Keep this preference enforced in `AGENTS.md` and `agent/rules.md` for future turns.

## 2026-03-19 (Class Token Drift During UI Cleanup)

- Date: 2026-03-19
- Context: Home-page visual cleanup while `components/UI/classTokens.ts` is being actively unified.
- Error: It is easy to make one local UI change by reintroducing inline near-duplicate classes, which slowly drifts the app away from the shared token system and creates CSS duplication.
- Root cause: Fast visual tweaks were being made at the consumer level without first checking whether the shared token file already covered the surface/control style or should be extended.
- Prevention checklist:
  - Check `components/UI/classTokens.ts` before creating repeated UI class strings in feature components.
  - Reuse or extend shared tokens instead of recreating near-matching surfaces inline.
  - Keep token edits cautious so a local fix does not unintentionally change the broader design system.
  - Prefer removing redundant borders/rings/shadows from consumers before inventing new token variants.
  - Keep `classTokens.ts` and the relevant agent docs updated on each redesign step, not as an end-of-pass cleanup.
- Follow-up action: Treat `classTokens.ts` as the first-stop source of truth during future UI polish and class unification passes.

## 2026-03-19 (Single-Input Entry Focus)

- Date: 2026-03-19
- Context: Entry-page UX refinement on home/join flows.
- Error: When a page has only one obvious primary input, making the user click into it first adds unnecessary friction.
- Root cause: Input focus behavior was left neutral even on simple single-input entry screens where immediate typing is the main next action.
- Prevention checklist:
  - On entry pages with one clear primary input, autofocus it on open.
  - Skip autofocus when there are multiple competing inputs or when auto-focus would feel jumpy/disruptive.
  - Verify the actual rendered component tree before applying the change; old/unused entry components may no longer drive the live page.
  - After adding autofocus, verify typing works immediately and no unwanted layout jump or scroll jump is introduced.
- Follow-up action: Reuse this rule for future single-input onboarding/auth/join flows.

## 2026-03-19 (Unused Or Parallel Component Paths)

- Date: 2026-03-19
- Context: `/sync` autofocus work.
- Error: `components/Onboard/UrlSelection.tsx` looked like the right place to edit, but the live `/sync` route was actually rendering `components/Modals/UrlModalComponents/UrlInputSection.tsx` and `components/Modals/UrlModalComponents/UrlInputField.tsx`.
- Root cause: Older or parallel component paths remained in the repo, and the live rendered route tree was not confirmed first.
- Prevention checklist:
  - Trace the live route/component tree before editing a screen.
  - If an unused or parallel component path is discovered, record it here immediately.
  - Treat these findings as future-risk notes until the dead path is cleaned up or clearly marked.
  - Keep future redesign steps focused on actually rendered component paths.
- Follow-up action: Add newly discovered unused/non-rendered component paths to `agent/lessons.md` every time they show up during implementation.

## 2026-03-19 (Entry-Page Width Drift From Wrapper Layers)

- Date: 2026-03-19
- Context: Aligning `/`, `/sync`, `/stream`, and `/stream/screen` to the same entry-page shell.
- Error: The shared pages technically used the same `max-w-6xl` shell, but they still looked wider or differently aligned than home.
- Root cause: Shared `PageHeader` spacing drifted wider than the home top bar (`sm:mx-6` vs home's `sm:left/right-5`), and some entry pages still kept extra outer flex-centering wrappers that made the real stage feel inconsistent.
- Prevention checklist:
  - Match `PageHeader` edge spacing to the home header ratio, not only to the content inset token.
  - Reuse the home header shell/brand/control structure instead of maintaining a second wrapper with its own spacing rules.
  - Treat `appEntryPageShellClass` as the owner of page width; remove redundant outer centering wrappers when they do not add behavior.
  - Compare new shared entry-page wrappers directly against the home route before assuming equal `max-w-*` values are visually equivalent.
  - Keep the shared shell, header spacing, and content inset responsibilities separate so drift is easier to spot.
- Follow-up action: Reuse the same home-vs-shared-shell comparison whenever entry-page wrappers are refactored.

## 2026-03-19 (Entry Header Wrapper Drift)

- Date: 2026-03-19
- Context: Home, `/sync`, and `/stream` entry-header alignment cleanup.
- Error: Even after sharing tokens, the header still drifted because home and subpages were assembled through different wrapper components with their own composition choices.
- Root cause: The visual reference header was not being used directly by the live routes; wrapper layers reintroduced spacing and sizing differences.
- Prevention checklist:
  - Mount one shared entry-header component directly in the live entry routes.
  - Keep wrapper components as thin compatibility shims only, or remove them when safe.
  - Fix header alignment in the shared component first, not by patching each route separately.
  - Compare left edge, right edge, and control sizing against the home route after every header change.
- Follow-up action: Reuse `EntryPageHeader` directly for future entry pages before introducing any new per-route header wrapper.

## 2026-03-19 (Back Button Optical Inset)

- Date: 2026-03-19
- Context: Shared entry-header alignment across home, `/sync`, and `/stream`.
- Error: The subpage back arrow still looked too padded from the left edge compared with the home logo start.
- Root cause: The back button kept a healthy touch target, but the visible icon sat centered inside that box and looked inset.
- Prevention checklist:
  - Preserve the touch target, but tune optical alignment in the shared back-button token.
  - Compare the visible icon edge with the home brand edge, not only the wrapper bounds.
  - Keep this adjustment in the shared header token/component instead of per-route margin hacks.
  - Re-check the result on both mobile and desktop breakpoints.
  - If the icon still looks inset, anchor the button content with shared left padding instead of relying only on negative outer margin.
- Follow-up action: Reuse the shared back-button token for future entry pages that add left-side navigation.

## 2026-03-19 (Mixed Header Positioning Drift)

- Date: 2026-03-19
- Context: Tiny top-gap mismatch between home and `/sync` despite matching shell tokens.
- Error: The header still looked slightly lower on subpages even after row-height cleanup.
- Root cause: Home used a fixed-position header presentation while active subpages were still mounting the shared header in normal flow, so the page-top rhythm was not actually identical.
- Prevention checklist:
  - Keep active entry routes on the same header positioning mode.
  - Use one shared body-offset token under the shared fixed header.
  - Do not assume matching `top-*` and `mt-*` utilities are visually identical across route layouts.
  - Verify page-switch transitions between home and subpages when refining header spacing.
- Follow-up action: Reuse the fixed-header + shared-offset pattern for future entry pages that need home-level top alignment.

## 2026-03-19 (Header Layout Mode Drift)

- Date: 2026-03-19
- Context: Tiny perceived top-gap and alignment drift between the home header and subpage entry headers.
- Error: Even with one shared shell, the header still felt a touch different when subpages switched to a separate centered-grid layout for titles.
- Root cause: The shared header component still had two internal layout modes, so title-bearing pages were not truly using the same row geometry as home.
- Prevention checklist:
  - Keep one shared fixed-height header row for all entry pages.
  - If a page needs a centered title, render it as a non-interactive overlay inside that same row.
  - Give header text triggers/titles explicit `leading-none` and fixed control heights so font metrics cannot subtly stretch the bar.
  - Compare home, `/sync`, and `/stream` while logged in and logged out after any header refactor.
- Follow-up action: Reuse the single-row + title-overlay pattern for future entry-page headers instead of branching back into grid-vs-flex variants.

## 2026-03-19 (Entry Page Atmosphere Duplication)

- Date: 2026-03-19
- Context: Redesigning `/sync` to match the updated home page.
- Error: `/sync` was still carrying a separate emoji-heavy backdrop and ad hoc section-heading markup even though the desired visual language already existed on the home route.
- Root cause: Entry-page atmosphere and section-heading structure were being rebuilt per route instead of extracted once and reused.
- Prevention checklist:
  - When two entry pages should feel like the same family, extract the backdrop into one shared primitive.
  - Do the same for repeated section-heading structure instead of duplicating bars/heading markup.
  - Keep the new primitive neutral enough that future entry pages can adopt it without route-specific hacks.
  - After extraction, update at least one existing reference page too so the primitive is proven in live use.
- Follow-up action: Reuse shared entry-page backdrop/heading primitives for future `/stream` cleanup instead of cloning the home markup again.

## 2026-03-19 (Structure Drift During Visual Redesign)

- Date: 2026-03-19
- Context: `/sync` redesign.
- Error: The page got cleaner visually, but the redesign also changed the approved layout skeleton, which made the screen feel wrong even though colors/surfaces improved.
- Root cause: Visual cleanup and structure changes were bundled together instead of treating structure as a separate approval boundary.
- Prevention checklist:
  - Preserve the current page order, placement, and responsive layout unless the user explicitly asks for structural change.
  - Use redesign passes to improve colors, spacing, typography, and surfaces first.
  - If a structure change might help, stop and ask before replacing flex/stack flows with new grid/stage arrangements.
  - Keep shared tokens/primitives, but plug them into the existing skeleton before inventing a new one.
- Follow-up action: For future entry-page redesigns, start from “same skeleton, better styling” as the default approach.

## 2026-03-19 (Outer Section Background Overdesign)

- Date: 2026-03-19
- Context: `/sync` split-layout redesign.
- Error: Adding large left/right outer panel backgrounds made the page feel heavier and hid the approved “just boxes and controls” structure.
- Root cause: The redesign tried to define each column with another big surface layer even though the child cards, fields, and list shell already provided enough structure.
- Prevention checklist:
  - On split entry pages, let inner cards/fields carry the surface language before adding any outer panel background.
  - If the user wants the old structure preserved, keep sections visually open and avoid wrapping each side in another container skin.
  - Make equal-height columns through the shared row/column contract, not with fake balancing wrappers.
  - Compare the result against the older approved structure before keeping any new outer surface.
- Follow-up action: Reuse the “open columns, surfaced children” rule for future `/stream` and `/sync` visual passes.

## 2026-03-19 (Open Column, Strong Child Cards)

- Date: 2026-03-19
- Context: Restoring the `/sync` platform section after flattening it too much.
- Error: Removing the outer section background was correct, but the platform boxes also lost the strong approved card character that helped the section read clearly.
- Root cause: “Less outer chrome” was applied too broadly and accidentally flattened the child cards instead of only removing the extra wrapper layer.
- Prevention checklist:
  - Separate outer section openness from child-card styling; those are different decisions.
  - If the previous approved version had strong child boxes, restore that first before inventing a calmer replacement.
  - Compare the current child-card look directly against the committed baseline when the user asks for “like before.”
  - Keep the old card rhythm (grid count, aspect ratio, centering) when that is part of what the user is responding to.
- Follow-up action: For future redesign passes, treat “open column + strong child cards” as a valid combination instead of assuming both must become flatter together.

## 2026-03-19 (Abandoned Primitive Cleanup)

- Date: 2026-03-19
- Context: `/sync` redesign pivoted back toward the approved baseline structure and sizing.
- Error: A new shared section-heading primitive was left in the repo even after the screen switched back to the older heading structure, creating an unused parallel UI path.
- Root cause: The redesign direction changed, but the helper extracted for the abandoned path was not cleaned up immediately.
- Prevention checklist:
  - After restoring a baseline layout or component pattern, search for newly-unused primitives created during the abandoned attempt.
  - Remove dead helpers from `components/UI`, exports, and tokens in the same pass.

## 2026-03-20 (Global Backdrop Ownership)

- Date: 2026-03-20
- Context: User wanted the same dotted/glow Movmash backdrop visible across home, auth, sync, stream, stream/screen, room, and fallback pages from one central edit point.
- Error: The backdrop existed as a shared component, but it was still imported page by page while some routes kept their own solid backgrounds or duplicated ambient blocks, so changing one backdrop source did not actually update the whole app.
- Root cause: Background ownership was split between `app/layout.tsx`, page-level `EntryPageBackdrop` imports, and older local background wrappers/effects.
- Prevention checklist:
  - If one backdrop should control the whole app, mount it once in `app/layout.tsx` or a shared scaffold.
  - Remove page-level duplicate backdrop renders after centralizing it.
  - Make top-level page wrappers transparent so the shared backdrop remains visible.
  - Remove older route-local background systems that visually replace the shared backdrop, especially on auth, stream/screen, room, and fallback routes.
  - When parallel/older component paths still carry solid background fills, either transparent them too or record them as non-live paths so they do not confuse later work.
- Follow-up action: Keep future backdrop changes centralized in layout/scaffold ownership and treat opaque page-level backgrounds as opt-in exceptions, not defaults.

## 2026-03-20 (Backdrop Tone Drift From Base Color)

- Date: 2026-03-20
- Context: After moving the shared Movmash backdrop into `app/layout.tsx`, the app started to feel grayer than the approved pre-centralization version.
- Error: The structure was centralized correctly, but the backdrop vibe changed because the underlying global base darkness no longer matched the old entry-page base.
- Root cause: The shared backdrop component owned the dots/noise/glows, but not the exact solid dark base tone that had previously been supplied by per-page wrappers like `bg-[#09090c]`.
- Prevention checklist:
  - When centralizing a background, preserve both the decorative layers and the exact underlying base color.
  - Let the shared backdrop owner carry its own solid base layer when that base is part of the approved visual identity.
  - Verify the before/after tone visually, not only the structure, after moving background ownership into layout.
  - Treat global body color variables as part of the backdrop system if they sit behind transparent or masked layers.
- Follow-up action: Keep the shared backdrop’s base darkness aligned with the approved `#09090c` tone unless the user explicitly asks for a palette change.

## 2026-03-20 (Screen Share Theme Drift)

- Date: 2026-03-20
- Context: `/stream/screen` still used an older zinc/purple special-case look after `/sync` and `/stream` had already moved to the newer shared cyan/violet/rose Movmash family.
- Error: The page structure was fine, but the screen-share route felt visually detached because its hero, step cards, status cards, toggles, and warnings still relied on page-local color treatment.
- Root cause: The newer theme was applied to `/sync` and `/stream`, but not codified enough in shared tokens for `/stream/screen` to reuse cleanly.
- Prevention checklist:
  - When sibling routes should feel like one product family, add shared surface/status/button tokens in `components/UI/classTokens.ts`.
  - Preserve the page structure; migrate color language first.
  - Avoid leaving route-specific inline gradients behind once a shared theme direction has been approved.
  - Compare hero, helper cards, warning states, and primary CTAs against sibling routes after each color pass.
- Follow-up action: Reuse the new `/stream/screen` tokens for future screen-sharing or live-preview surfaces instead of inventing another local palette.

## 2026-03-20 (Open Intro State On Backdrop-Driven Pages)

- Date: 2026-03-20
- Context: `/stream/screen` initial `Ready to share` state.
- Error: The first CTA block used another full hero surface even though the global backdrop and nearby step cards already defined enough atmosphere, so the screen felt too boxy and the primary action looked buried.
- Root cause: A reusable hero token was applied mechanically to the intro block without checking whether this specific state needed another parent surface.
- Prevention checklist:
  - On backdrop-driven entry pages, verify whether the intro state reads better as an open centered section before adding another full panel surface.
  - If the primary CTA is the point of the screen, center it and constrain its width before adding more chrome.
  - Improve readability through shared support-copy tokens first when the screen feels hard to scan.
  - Keep structure intact; remove surface weight before changing section order or layout.
- Follow-up action: Reuse open intro sections for future entry/splash states when the backdrop already carries the mood.

## 2026-03-20 (Intro Cluster Readability)

- Date: 2026-03-20
- Context: `/stream/screen` top intro block before preview.
- Error: Once the outer hero surface was removed, the stacked icon-above-title treatment still felt less readable than it needed to.
- Root cause: The intro block kept a hero-style stacked composition even though the content was now a simpler product-intro/CTA state.
- Prevention checklist:
  - On open intro sections, compare stacked vs side-by-side icon/copy layouts before keeping the default hero pattern.
  - If the icon is only supportive, keep it beside the title/subcopy so the text reads as one unit.
  - Route that alignment through shared tokens when it becomes part of the new page language.
  - If the intro leads into one main CTA, keep the text cluster and button on the same width guide so the top state feels intentionally composed.
  - If the user still struggles to scan the first state, center the support copy and raise its contrast/size slightly before changing structure.
  - If the icon adds no real meaning after the layout is simplified, remove it completely instead of keeping decorative noise beside the title.
- Follow-up action: Reuse side-by-side intro clusters for future simple entry prompts when they improve scan speed.

## 2026-03-20 (Hide Scrollbar, Keep Scroll)

- Date: 2026-03-20
- Context: `/stream/screen` after the preview state started needing vertical scroll.
- Error: The page needed scrolling, but the visible scrollbar added unnecessary visual noise on a polished entry-style screen.
- Root cause: The scroll container used `overflow-y-auto` without also opting into the existing hidden-scrollbar utility.
- Prevention checklist:
  - If a page still needs wheel/touch scrolling but the scrollbar itself hurts the design, hide the scrollbar instead of removing scroll.
  - Prefer a shared token for hidden-scrollbar usage when the behavior becomes part of the UI language.
  - Verify that the page still scrolls normally after hiding the scrollbar.
  - On centered `max-w-*` entry layouts, test wheel/trackpad scrolling from the empty gutter areas too; if the scroll owner is narrower than the viewport, the page can feel broken even though the content technically scrolls.
  - If gutter-area scrolling still fails with component-level wheel handlers, use a route-scoped `window` wheel listener for that page; it is more reliable for full-viewport wheel capture.
- Follow-up action: Reuse the hidden-scrollbar token on future polished entry/preview screens when the scrollbar chrome is unnecessary.

## 2026-03-20 (Fallback Pages Need Shared Chrome Too)

- Date: 2026-03-20
- Context: `app/not-found.tsx` redesign.
- Error: The fallback page still used a separate animated composition with floating icons, custom header markup, and special-case CTA styling, so it felt detached from the rest of the redesigned app.
- Root cause: Error/fallback routes were left outside the shared entry-page system while work focused on the main user flows.
- Prevention checklist:
  - Route fallback pages through the same shared entry header, shell, and button tokens whenever their behavior is still an entry-style screen.
  - Prefer calm, readable fallback states over custom animation-heavy one-offs once the main app has an approved visual system.
  - Make back-navigation CTAs resilient: if browser history is absent, fall back to home instead of doing nothing.
  - Reuse shared CTA tokens first before inventing custom error-page buttons.
  - If the fallback page already has a strong content title, avoid also centering that same title in the header; keep the normal brand header so the logo remains visible.
  - If the destination is a stable known route like `/`, prefer a prefetched `Link` over a timeout-based JS button handler; the primary CTA should feel instant.
- Follow-up action: Keep future maintenance/error pages aligned with the shared entry-page primitives unless they need genuinely different behavior.

## 2026-03-20 (Page-Specific Locale Namespaces Need Usage Checks Too)

- Date: 2026-03-20
- Context: `app/not-found.tsx` uses a small `notFound` namespace across `en`, `tr`, `es`, and `ar`.
- Error risk: Locale files can look structurally complete while a page still ignores one key, or one locale drifts into stale wording because only the default language was updated.
- Root cause: Page-specific namespaces are easy to treat as "small enough to eyeball," so they often skip the same parity and usage checks used on larger dictionaries.
- Prevention checklist:
  - Update every locale in the same pass when changing a page-scoped namespace like `notFound`.
  - Check the live component usage against the namespace keys, not only locale-file parity.
  - If a namespace already has a key like `title`, either render it or remove it consistently; avoid dormant translated keys.
  - Prefer neutral, reusable fallback copy over joke-heavy text when the page is part of the main shared UI system.
- Follow-up action: Keep `notFound` translations aligned in all locales and continue auditing both dictionary parity and live key usage after future copy changes.

## 2026-03-19 (Empty State Wrapper Drift)

- Date: 2026-03-19
- Context: `/sync` empty-state cleanup.
- Error: The empty state had an extra padded wrapper and inherited shell background that made the right column feel misaligned and heavier than needed.
- Root cause: The empty state was treated like a boxed panel instead of a transparent state sitting inside an already-structured section.
- Prevention checklist:
  - If placeholder rows already communicate the state, avoid adding another parent background wrapper around them.
  - Align split-section content to the section title guide; do not let extra padding shift one column inward.
  - Use conditional shells when filled vs empty states need different surface density.
- Follow-up action: Reuse transparent empty-state containers for future entry pages when child placeholders already define the visual structure.

## 2026-03-19 (Redundant Empty-State Tips)

- Date: 2026-03-19
- Context: `/sync` empty-state refinement.
- Error: Tip text below the placeholder cards added visual clutter without teaching anything the placeholders and surrounding UI did not already make obvious.
- Root cause: Helper copy stayed in place after the empty-state visuals became self-explanatory.
- Prevention checklist:
  - If placeholder cards already preview the result, remove extra tip bullets beneath them.
  - Prefer one clear empty-state visual over stacked visual + helper text + wrapper chrome.
  - Re-check vertical rhythm after removing helper copy so the section still centers cleanly.
- Follow-up action: Reuse transparent empty-state containers for future entry pages when child placeholders already define the visual structure.

## 2026-03-19 (Centered Empty State Imbalance)

- Date: 2026-03-19
- Context: `/sync` empty-state alignment.
- Error: Even after removing helper tips, the empty state still felt too airy because the placeholder rows were vertically centered inside a transparent shell.
- Root cause: Centering works when a state is intentionally spotlighted, but on a split layout it creates fake top and bottom gaps that make columns feel misaligned.
- Prevention checklist:
  - In transparent list shells, top-align placeholder rows by default.
  - Let the shell's `flex-1` create overall section height; do not add visual centering inside it unless the design explicitly wants a hero-style empty state.
  - Compare the section against the opposite column after removing helper copy; centering may look balanced in isolation but wrong in a split view.
- Follow-up action: Use top-aligned empty placeholders as the default for future split entry layouts.

## 2026-03-19 (Minimal Passes On Approved Layouts)

- Date: 2026-03-19
- Context: `/sync` visual cleanup after the user explicitly asked to keep the old structure and size rhythm intact.
- Error: It is easy to keep "improving" a screen by changing wrappers or layout when the actual problem is just visual weight: bold text, loud shadows, extra borders, and heavy surfaces.
- Root cause: Visual cleanup work can drift into layout changes if the pass is not constrained to the token layer first.
- Prevention checklist:
  - On approved layouts, start by simplifying typography, font weight, shadows, and border treatments in shared tokens.
  - Keep card positions, wrappers, and sizing contracts stable unless the user separately asks for layout changes.
  - Reduce chrome in child surfaces before inventing new outer containers.
  - Compare against the approved version by asking "does this feel lighter?" before asking "should this move?"
- Follow-up action: Reuse token-first minimal passes for future `/stream` and entry-page cleanup before attempting any structural redesign.

## 2026-03-19 (Filled List Shell Overdesign)

- Date: 2026-03-19
- Context: `/sync` URL list after cards had already been added.
- Error: Even after the empty state was cleaned up, the filled list still had a parent background shell, which made the right column feel heavier than the left.
- Root cause: The container kept a panel treatment even though the child URL cards already defined the visual structure.
- Prevention checklist:
  - If list items are already surfaced cards, keep the parent list shell visually open unless it needs a real grouping background.
  - Match the visual openness of sibling sections on split layouts; do not let one side keep an extra container skin.
  - Remove parent list backgrounds before flattening the cards themselves.
- Follow-up action: Treat filled list shells the same way as empty states on entry pages: use the item cards as the primary surface.

## 2026-03-19 (Decorative Section Title Rails)

- Date: 2026-03-19
- Context: `/sync` section-title cleanup while matching the calmer shared entry-header language.
- Error: The colorful side rail and oversized section title made the content headings feel louder than the actual page header.
- Root cause: Accent rails were still doing visual hierarchy work that spacing and typography could already handle.
- Prevention checklist:
  - If a section title is already well-separated by spacing, prefer clean type over another colorful marker.
  - Keep entry-page section headings close to the shared header title scale unless the screen truly needs a stronger break.
  - Simplify decorative heading accents before touching layout or wrappers.
- Follow-up action: Reuse the shared minimalist section-title style for future `/stream` and entry-page sections unless a stronger visual divider is explicitly requested.

## 2026-03-19 (Reactive Cards And Oversized Controls On Approved Layouts)

- Date: 2026-03-19
- Context: `/sync` minimal cleanup after the structure and sizing rhythm were already approved.
- Error: Card hover reactions and tall controls kept making the page feel heavier, even after the bigger layout issues were fixed.
- Root cause: Visual polish was still leaving interaction chrome and control scale louder than the calm entry-page direction.
- Prevention checklist:
  - On approved entry-page layouts, keep passive list cards visually still unless hover feedback teaches something important.
  - If a control row already has clear hierarchy, tighten the control height before inventing new styling.
  - Prefer compact control sizing and static surfaces when the goal is a more minimal, premium feel.
- Follow-up action: Reuse shorter control heights and static list-card surfaces for future `/stream` and `/sync` minimal passes unless stronger interaction affordance is explicitly needed.

## 2026-03-19 (Thumbnail Ratio Drift On URL Cards)

- Date: 2026-03-19
- Context: `/sync` URL-card preview cleanup.
- Error: The preview thumbnails started feeling cropped from the top and bottom even though the card layout itself was fine.
- Root cause: The thumbnail frame ratio drifted away from a typical video ratio, so `object-cover` cropped vertically more than expected.
- Prevention checklist:
  - Keep video-preview frames close to a 16:9-friendly ratio on entry-page URL cards.
  - If the thumbnail feels cropped, fix the frame ratio before changing the whole card layout.
  - Route thumbnail sizing through shared tokens so future tweaks stay consistent.
- Follow-up action: Reuse the shared video-friendly thumbnail ratio for future playlist/URL card cleanup when the goal is to reduce crop without restructuring cards.

## 2026-03-19 (Over-Badged Card Indices)

- Date: 2026-03-19
- Context: `/sync` added-URL cards.
- Error: The order number sat inside its own chip, which made a simple ordinal feel heavier than the rest of the card.
- Root cause: A badge treatment was left in place even though the number only needed to quietly communicate order.
- Prevention checklist:
  - If the number is only an ordinal, start with plain tabular text before adding a separate badge surface.
  - Keep tiny secondary markers quieter than the title, thumbnail, and remove action.
  - Extract index styling into a shared token so future card cleanup stays consistent.
- Follow-up action: Reuse quiet text-first numbering for future minimal card passes unless the badge itself carries state or interaction.

## 2026-03-19 (Loose Left Cluster On Minimal Cards)

- Date: 2026-03-19
- Context: `/sync` added-URL card cleanup after the index badge was simplified.
- Error: Even with a quieter number, the card still felt slightly loose because the left padding and number-to-thumbnail gap were too generous.
- Root cause: The card kept the older spacing rhythm from the heavier version after the left marker became more minimal.
- Prevention checklist:
  - When simplifying a card's left marker, re-check the left inset and first gap; quieter elements usually need a tighter cluster.
  - If the start of a row should feel anchored, reduce outer left padding before inventing a new wrapper.
  - Keep spacing adjustments in shared tokens so all cards keep the same rhythm.
- Follow-up action: Reuse tighter left-cluster spacing for future minimal list cards when the start of the row feels too airy.

## 2026-03-19 (Ghost Badge Spacing)

- Date: 2026-03-19
- Context: `/sync` URL-card ordinal cleanup.
- Error: The number looked simplified, but it still felt too far from its neighbors because the old fixed badge box was still there invisibly.
- Root cause: The chip styling was removed before the width/height footprint of the badge container was removed.
- Prevention checklist:
  - After converting a badge into plain text, remove the fixed width/height container too.
  - Re-check the actual occupied width of the marker, not just its color/background.
  - Keep ordinal markers text-sized unless they need to hold multi-digit alignment.
- Follow-up action: Reuse text-first ordinals without fixed chip boxes for future minimal card passes.

## 2026-03-19 (Underfilled Empty Lists)

- Date: 2026-03-19
- Context: `/sync` empty-state placeholder list.
- Error: With only two placeholder rows, the right side still felt too empty and the section looked shorter than intended.
- Root cause: The placeholder count was too low for the amount of vertical space the section reserves.
- Prevention checklist:
  - When an empty state relies on placeholder rows, use enough of them to visually hold the column height.
  - Compare empty-state density against the filled-state rhythm; if the empty version looks hollow, increase placeholder count before adding wrapper chrome.
  - Prefer adding one more placeholder row over reintroducing a parent background panel.
- Follow-up action: Use a fuller placeholder count for future split entry-page empty states when the transparent shell starts to feel too empty.

## 2026-03-19 (Movmash Theme Color Shorthand)

- Date: 2026-03-19
- Context: Matching `/sync` buttons to the panel tab accent.
- Error: The repo had multiple close-but-different pink/purple accents, which made it unclear which one should represent the core Movmash brand color.
- Root cause: The panel active-tab gradient existed as a local panel detail instead of a named shared brand accent.
- Prevention checklist:
  - Treat the panel active-tab gradient as the canonical Movmash theme color unless the user asks for a different palette.
  - Extract that accent into a shared token before reusing it in new buttons or accents.
  - When the user says "use Movmash theme color", default to that shared gradient instead of picking a nearby rose/pink/fuchsia variant.
- Follow-up action: Reuse the shared Movmash theme gradient for future primary actions and accent surfaces when the user asks for the brand color family.


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

## 2026-03-07 (Message Delay and Empty Gap)

- Date: 2026-03-07
- Context: Chat tab message appears late; sender also sees own message with delay.
- Error: Visual gap/latency before message bubble appears.
- Root cause: Message UI waited for network roundtrip (`emitWithAck` + receive event) before rendering, with no optimistic local append.
- Prevention checklist:
  - Render outgoing message optimistically immediately.
  - Reconcile optimistic message with server `id/timestamp` when ack or receive event arrives.
  - Deduplicate incoming messages using both `id` and optimistic match rules.
- Follow-up action: Use the same optimistic + reconciliation pattern for future realtime list interactions.

## 2026-03-07 (Composer Width Shrink on Long Text)

- Date: 2026-03-07
- Context: Chat input/composer in right panel.
- Error: Long multiline text used a narrow typing area instead of full available width.
- Root cause: Composer row lacked a strict width contract between text input and action buttons.
- Prevention checklist:
  - Keep text input wrapper as `flex-1 min-w-0`.
  - Keep textarea/input as `w-full min-w-0`.
  - Keep action icon group as `flex-shrink-0`.
  - Keep wrapping/layout fixes scoped so composer height and centering are not unintentionally changed.
- Follow-up action: Reuse the same flex layout pattern for any input+actions composer UI.

## 2026-03-07 (Composer Spacing Regression)

- Date: 2026-03-07
- Context: Chat composer after width-fix iteration.
- Error: Content looked top-heavy; excessive visual gap between text and action buttons.
- Root cause: Absolute-positioned action buttons with reserved right padding hurt vertical and horizontal balance.
- Prevention checklist:
  - Prefer natural flex layout (`input flex-1` + `actions flex-shrink-0`) before absolute positioning.
  - Tune vertical paddings symmetrically (`py-*` on container and input/textarea).
  - If placeholder baseline feels off, adjust line-height first (`leading-*`) before changing height/padding.
  - For long unbroken words, apply explicit wrap behavior (`break-all`).
- Follow-up action: Keep composer fixes layout-first, then micro-tune spacing.
- Validation: Returned to compact composer height and centered alignment after user feedback.

## 2026-03-07 (Composer Baseline Matching)

- Date: 2026-03-07
- Context: Final visual parity request for chat composer (placeholder + icons).
- Error: Iterative fixes still looked visually off versus known-good dev baseline.
- Root cause: Multiple micro changes drifted away from baseline spacing/alignment classes.
- Prevention checklist:
  - When pixel parity matters, diff against known-good branch and restore exact class structure.
  - Keep only minimal functional delta (`break-all`) after baseline parity is re-established.
- Follow-up action: Use branch-baseline matching earlier for UI parity requests.

## 2026-03-07 (Generic Name Drift)

- Date: 2026-03-07
- Context: Typing/message display name fallback in chat.
- Error: Generic-name filtering logic was duplicated across `useChat` and `ChatTab`, making behavior drift-prone and harder to debug.
- Root cause: Same helper logic (`isGenericName`, email prefix fallback) was copy-pasted in multiple files instead of shared utility.
- Prevention checklist:
  - Keep name-resolution rules in one shared helper.
  - Reuse the same helper in hook and UI layers.
  - Include backward-compatible payload aliases in types when socket payloads can vary (`userName` vs `username`).
- Follow-up action: Reuse `utils/chatName.ts` for any new chat/presence display-name paths.

## 2026-03-07 (TS Narrowing in Name Resolver)

- Date: 2026-03-07
- Context: Shared chat display-name utility.
- Error: TS2322 in `resolveDisplayName` (`string | undefined` returned where `string` required).
- Root cause: `candidate?.trim()` preserves `undefined` in type flow.
- Prevention checklist:
  - Normalize optional strings before return (`(value ?? \"\").trim()`).
  - Keep helper function return contracts strict and explicit.
- Follow-up action: Apply same pattern in other utility resolvers with optional inputs.

## 2026-03-12 (Playlist Minimal UI Direction)

- Date: 2026-03-12
- Context: Playlist tab CTA row and playlist card redesign.
- Error: Earlier playlist iterations felt visually noisy, overly bordered, and "AI-made" instead of calm and modern.
- Root cause: Too many borders, layered badges, and decorative selection treatments created visual fatigue.
- Prevention checklist:
  - Prefer surface contrast, spacing, and depth over border-heavy differentiation.
  - Keep playlist controls and cards in the same minimal visual language.
  - For selected playlist rows, use one strong cue only; do not stack multiple competing indicators.
  - Avoid left-side status clutter when the right-side action badge already communicates state.
- Follow-up action: Reuse this calmer playlist visual language for future panel/list redesigns.

## 2026-03-12 (Playback-Aware Playlist Badge)

- Date: 2026-03-12
- Context: Selected playlist card state icon.
- Error: Showing state from `selected` alone was misleading because a selected video can be paused.
- Root cause: UI selection state and playback state were treated as the same thing.
- Prevention checklist:
  - Keep playback-driven UI bound to real playback state, not only selected item state.
  - Update local Redux playback state immediately on host play/pause as well as on socket sync events.
  - When a playlist badge represents transport state, use `play/pause` semantics instead of generic "selected" affordances.
  - Avoid duplicating the same playback cue on both thumbnail and badge; one clear location is easier to scan.
- Follow-up action: Reuse `room.hostPlayback.playing` for future panel-level playback indicators.
# Costume Lessons

## 2026-03-07 (Pinned Message UI + Sync)

- Pinning should operate on existing messages (message `id`), not free-form text input.
- Character-limit validation belongs to backend; frontend should still guide users and handle errors gracefully.
- Join payload should include the room's current pinned message so newcomers see consistent chat context.
- Keep pinned rendering separate from message list to avoid scroll-behavior regressions.

## 2026-03-07 (Pin Action Visual Placement)

- External action buttons next to bubbles create noisy alignment in dense chat layouts.
- Keeping pin action inside the bubble top-right gives cleaner scanning and better message grouping.
- For minimal UX, show unpinned icon on hover and keep pinned state icon always visible.
- Avoid redundant labels inside pinned banner when pin affordance is already explicit.
- For clean visual hierarchy in chat, prefer icon-only affordances (outline white) over layered badge styles.
- For pinned previews, `username: message` in one block is easier to scan than split-line styling.
- For mixed inline metadata (`username: message`), `overflow-wrap:anywhere` prevents awkward empty trailing space on line 1.
- Fixed-size action buttons (`h/w + self-start`) are more stable than padding-based alignment in multiline rows.
- For polished banner layout, use `justify-between` on the outer row and keep message block `min-w-0` to preserve right-side action alignment.
- A small filled/angled pin icon communicates "pinned state" better than a separate close icon in compact chat banners.
- Prefer structural flex alignment (`justify-between`, `flex-shrink-0`) over padding reservations (`pr-*`) for right-side actions.
- Pinned preview typography should be one step smaller than normal chat bubbles to avoid dominating chat hierarchy.
- High-saturation warning colors can overpower chat UI; prefer muted accent gradients for pinned state.

## 2026-03-08 (Message Bubble Reactions)

- Existing reaction flow was only for floating room reactions, not per-message state.
- Keep floating reactions and message reactions as separate socket flows.
- Do not bind auto-scroll to the full `messages` object when message metadata can change.
- Normalize incoming message shape so older history payloads without `reactions` do not break UI.
- If users want long-press mobile behavior later, add it on top of the current quick-reaction picker instead of replacing the socket contract.
- Do not reserve permanent `pr-*` space for hover-only pin controls; keep the idle bubble layout full-width and move transient actions into a floating overlay.
- For chat bubble readability, keep the timestamp in its expected bottom-right slot and float hover actions above the bubble instead of mixing them into text/time layout.
- Message reaction pickers should open from the bubble's own start edge with a capped width and horizontal overflow handling, otherwise icons can clip off-screen on narrow layouts.
- Message reaction pickers cannot use a fixed upward offset only; they must choose top or bottom placement from the available space inside the scroll container or the first visible messages will clip the picker.
- A reaction picker that overlaps neighboring rows needs row-level stacking control; raising only the picker is not enough if sibling message rows create their own stacking contexts.
- Message reaction chips and reaction edit pickers should not share the same click behavior; use chips for viewing reactor details and keep add/remove/change actions in the dedicated picker to avoid accidental toggles.
- Reaction detail overlays should be anchored to the reaction-chip row itself with high `z-index`; that preserves an overlay feel without pushing chat layout down.
- View-only reaction chips should never depend on the send/join enabled state, and decorative glow layers must be `pointer-events-none` so the chips remain clickable.
- `useChat.tsx` merge conflicts should not be resolved by choosing a whole side; keep the reaction/pin data model and socket handlers from the feature branch, then layer in the latest `dev` typing/message lifecycle changes explicitly.
- `ChatTab.tsx` merge conflicts also need a true merge: keep overlay refs/state from the feature branch and combine them with guarded auto-scroll logic instead of accepting one side wholesale.
- A file can still be broken after all conflict markers are removed; duplicate refs/imports from blind "Accept current change" resolutions must be caught with a local compile check before pushing.
- Chat message rows should not use entry fade animations in a live conversation UI; they read as flicker and feel worse than immediate render.
- Message reaction chips should read as one attached reaction tray, not as separate floating pills, when the goal is WhatsApp-like chat hierarchy.
- Hover actions scan better when they sit beside the bubble body; stacking them above the bubble competes with the message shape and looks disconnected.
- If the chat layout keeps all bubbles left-aligned, the "empty side" for hover actions is the bubble's right edge; pushing actions to the left can hide them behind the avatar/gutter.
- For minimal reaction trays, avoid both an outer badge background and separate inner chip backgrounds at the same time; keep one visual layer only.
- Side hover actions need a placement fallback for wide bubbles; otherwise their absolute offset can increase scroll width and create horizontal scrolling.
- For top-placement hover actions, a slight overlap on the bubble border reads more integrated than leaving the controls fully detached above the message.
- Absolute reaction detail popovers need both vertical placement and horizontal alignment; `top/bottom` alone is not enough for a polished chat layout.
- Reaction detail popovers work better as plain black utility overlays than as styled accent cards; this UI needs low visual noise.
- If message widths vary a lot, reaction detail overlays should open from one stable horizontal anchor; switching between `left` and `right` alignment makes short-message popovers feel jumpy.
- A good reaction-detail popover strategy is hybrid: keep short-message popovers start-anchored, but allow wide-message popovers to center only when there is proven room on both sides.
- If the detail popover is anchored to a full-width wrapper instead of the reaction tray itself, wide-message layouts will feel wrong; keep the wrapper `w-fit`/inline and raise its stacking above hover controls.
- If an absolute popover participates in the scroll container, it can increase scroll width and create horizontal scrolling; use fixed positioning plus viewport clamping for stable chat overlays.
- For fixed chat overlays, do not derive position from a stale placement state; compute placement and coordinates together or the popover can flash in the wrong place for one frame.
- Temporary chat overlays such as reaction pickers/details should dismiss on scroll, not only on outside click; otherwise they remain visually detached from the message they belong to.
- Reaction detail popovers should sit closer to their trigger than the emoji picker does; reusing the same offset for both makes the detail list feel detached.
- When the requirement is "open from the button edge", tray-level anchoring is too coarse; use the clicked chip/button rect as the popup anchor.
- If the requirement is "start from the button edge", avoid adding a second centering rule for wide messages; that fights the intended alignment and causes long-message popovers to drift left.
- If a host-only action is blocked by a rule like a character limit, keep the control visible in a disabled state with the error tooltip; hiding it entirely on long messages reads as a layout bug, not an intentional constraint.
- The stable rule for reaction-detail popovers is trigger-centered, not message-width-based: center the popup on the clicked chip with a small vertical offset, then clamp to the viewport edges. That keeps both short and wide message popovers close to the trigger without special long-message drift rules.
- If the UX rule is "open under the trigger", stop using viewport coordinate math for this popup. Render the reaction-detail list as an absolute child of the clicked reaction-chip wrapper and align it with `left-0` or `right-0`; that keeps long-message placement correct without chasing per-message geometry bugs.
- Once the reaction-detail popup is rendered as an absolute child of the clicked chip wrapper, do not add an extra centering transform for short messages. The wrapper itself is the precise anchor; adding `left-1/2 -translate-x-1/2` over-corrects and shifts the popup right.
- The correct side for a trigger-relative absolute popup should come from available viewport room at click time, not from message alignment. Decide `start` vs `end` from the clicked trigger rect, then let the popup stay absolute to that trigger wrapper.
- For compact hover actions beside chat bubbles, one shared background shell with transparent inner buttons reads cleaner than giving each icon its own full dark pill; separate icon backgrounds exaggerate spacing and create a noisy nested look.
- After collapsing bubble actions into one shared shell, tune spacing explicitly (`gap-1` here) instead of relying on fractional gaps; it keeps the cluster readable without recreating the old separated-pill look.
- For screen-share items in the playlist, do not rely on one generic thumbnail; derive the real `displaySurface` mode from playlist metadata/context and give `tab`, `window`, and `screen` distinct thumbnail compositions so the user instantly recognizes what was shared.
- In very small playlist thumbnails, label clarity matters more than decorative micro-details; if a dot plus translucent sub-layer starts to feel noisy, keep only the colored label pill and text.
- For very small mode labels inside thumbnails, even a subtle translucent label fill can be too much; if the thumbnail already carries the mode visually, plain text is cleaner.

## 2026-03-15 (Unused Modal Cleanup Audit)

- Date: 2026-03-15
- Context: Removing legacy modal files after introducing shared modal flows.
- Error: Old wrapper modals can look "safe to keep" but leave stale imports, state, or commented JSX behind, especially in entry-point screens.
- Root cause: Component-tree migration finished, but dead wrapper files and their support types were not deleted immediately.
- Prevention checklist:
  - Use import search first; do not delete by filename guess alone.
  - Distinguish between dead wrapper files and still-active component folders used by newer pages.
  - After wrapper deletion, audit the component folder again for dead leaf exports/components; the first cleanup pass often only removes the outer shell.
  - After deleting a UI file, remove related state, handlers, comments, and prop types in the entry points.
  - Run a focused smoke test on the screen that previously referenced the removed modal.
- Follow-up action: Apply the same audit pattern whenever a reusable component replaces inline or legacy modal wrappers.
- If plain text becomes too weak, the cleaner fallback is a solid compact label background, not a transparent/glassy one.
- A stronger simplification for tiny media tiles is to move the mode indicator into the thumbnail itself: one clear gradient surface plus a single icon-text row can read cleaner than any separate label block.

## 2026-03-15 (Shared Modal System Direction)

- Date: 2026-03-15
- Context: Room/panel modal cleanup across `Leave`, `Logout`, `Invite`, `Add URL`, and `Feedback`.
- Error: Modal UI drifted over time: duplicated markup, different spacing systems, different close behavior, different action sizing, and repeated gradient strings.
- Root cause: Modal surface/action/header decisions were being made locally in each modal instead of through shared tokens and reusable modal primitives.
- Prevention checklist:
  - Keep modal shell, close button, action buttons, spacing, and shared color tokens centralized.
  - Extract repeated confirm/form modal structures before styling more variants.
  - If two room-flow modals look similar, do not maintain two separate local markup systems.
  - Prefer one token file for frequently reused modal brand colors instead of repeating gradient strings inline.
- Follow-up action: Keep `components/UI/Modal.tsx` and `components/UI/modalTheme.ts` as the modal source of truth and route future modal cleanup through them first.

## 2026-03-15 (Refactor Smoke Test After Extraction)

- Date: 2026-03-15
- Context: `Feedback` modal extraction from `SettingTab` to `components/Modals/FeedbackModal.tsx`.
- Error: `Settings` tab crashed with `ReferenceError: tFeedback is not defined`.
- Root cause: The modal extraction removed a translation hook from `SettingTab` while the tab still referenced `tFeedback` in the feedback card area.
- Prevention checklist:
  - After extracting a component, search the original file for any remaining references to removed hooks/variables/imports.
  - Run lint after the refactor.
  - Smoke test the directly affected screen/tab, not only the extracted component file.
- Follow-up action: Treat runtime smoke testing of the touched view as required after UI extraction/refactors.

## 2026-03-15 (Form Modal Validation UX)

- Date: 2026-03-15
- Context: `Feedback` modal validation and toast layering under overlay.
- Error: Field-validation toast appeared behind the modal overlay and gave poor guidance about which field was wrong.
- Root cause: Field-specific validation was using global toast instead of inline form messaging inside the modal.
- Prevention checklist:
  - Show field-level validation errors next to their fields inside the form modal.
  - Reserve toast for success, login requirements, and general/backend errors.
  - Reveal inline validation only after submit intent when that produces a calmer UX.
- Follow-up action: Apply the same inline-after-submit validation pattern to future form modals unless the UX explicitly needs live validation.

## 2026-03-15 (Agent Doc Drift)

- Date: 2026-03-15
- Context: `AGENTS.md`, `agent/rules.md`, `agent/tasks.md`, and backlog review.
- Error: Durable workflow rules, current-step logs, and product backlog items drifted apart and started contradicting each other.
- Root cause: Different agent docs accumulated updates at different times without a clear source-of-truth model.
- Prevention checklist:
  - Keep `AGENTS.md` as the durable workflow/UI rule source of truth.
  - Keep `agent/rules.md` as a concise mirror, not a competing rule set.
  - Keep `agent/tasks.md` focused on current work and status, not old "current step" snapshots.
  - Keep backlog items separate from execution notes and remove duplicate sections.
- Follow-up action: Audit agent docs when the active workstream changes significantly so stale guidance does not pile up.

## 2026-03-19 (Top-Level Entry Header Mode)

- Date: 2026-03-19
- Context: Aligning the `/sync` and `/stream` headers with home without making them feel like deeper subpages.
- Error: Treating every titled entry page as a “subpage with back button” hid the Movmash brand and added unnecessary back navigation to top-level sibling routes.
- Root cause: The shared entry header only had two practical modes: home brand or subpage back-nav, with no shared option for “centered title plus home brand”.
- Prevention checklist:
  - Keep one shared header component, but let it explicitly support brand-on-subpage mode for top-level sibling routes.
  - Use that mode for routes like `/sync` and `/stream` that are siblings of home, not children that require hierarchical back navigation.
  - Keep deeper follow-up flows, such as `/stream/screen`, on the real back-navigation path unless the user asks otherwise.
  - Apply the brand/back choice through shared header props instead of forking route-specific header wrappers.
- Follow-up action: Reuse the shared brand-on-subpage header mode for future top-level entry routes that need a centered title without losing the home-brand rhythm.

## 2026-03-19 (Stream Redesign Should Stay Visual-Only)

- Date: 2026-03-19
- Context: Refreshing `/stream` after `/sync` while the user explicitly wanted structure preserved.
- Error: `/stream` still carried an older emoji-heavy backdrop and stacked gradient/border overlays even though the approved direction had already moved toward one shared entry backdrop and calmer surfaces.
- Root cause: The route kept legacy visual layers instead of reusing the entry-page primitives and token-first minimal style established on home and `/sync`.
- Prevention checklist:
  - Keep `/stream` on the shared `EntryPageBackdrop` and shared entry header before touching inner component styling.
  - Preserve the existing left divider/right section structure and do visual cleanup through tokens, not wrapper surgery.
  - Remove decorative hover overlays, stacked gradients, and heavy borders before changing size or layout rhythm.
  - Reuse the shared Movmash primary gradient on the final CTA instead of introducing another near-match palette.
- Follow-up action: Continue future `/stream` cleanup through token-first visual passes while leaving the approved screen-share/files skeleton intact.

## 2026-03-19 (Stream Should Match Home Mood Without Nested Panels)

- Date: 2026-03-19
- Context: Refining `/stream` after the first token-based cleanup.
- Error: Even with calmer styling, the page still felt heavier than home because the file area and helper pieces kept stacked panel backgrounds.
- Root cause: The first pass reduced borders and overlays, but it still left panel-inside-panel layering instead of using the more open-column approach already approved on `/sync`.
- Prevention checklist:
  - On `/stream`, remove outer panel backgrounds before tuning child-card color.
  - Keep the structure intact, but let upload cards, file rows, and the screen-share card define the visual surfaces.
  - Reuse the home accent family for the key stream surfaces so the route feels related to home instead of introducing a separate color mood.
  - When the route already shares the same backdrop/header as home, keep inner section color accents in the same family too.
- Follow-up action: Use the open-column + home-accent pattern for future `/stream` color passes unless the user explicitly asks for a heavier card system.

## 2026-03-20 (Stream Right-Column Alignment After Panel Removal)

- Date: 2026-03-20
- Context: Tightening the `/stream` file-selection column after removing its outer panel background.
- Error: The right column still looked slightly off because the old panel padding and list-side scrollbar padding kept the upload/file area inset from the title row and bottom actions.
- Root cause: Visual cleanup removed the visible panel but left behind the spacing contract that panel had been creating.
- Prevention checklist:
  - After removing an outer surface, audit the leftover padding/inset on its children too.
  - On open-column layouts, align the section title row, upload card, list cards, and action buttons to one left/right guide.
  - If a gradient dropzone already reads clearly, remove the extra border instead of stacking both treatments.
- Follow-up action: Reuse this “remove leftover insets after panel removal” check on future stream/sync cleanup passes.

## 2026-03-20 (Stream Buttons Should Join The New Gradient Family)

- Date: 2026-03-20
- Context: Trying the home-style gradient vibe on `/stream`.
- Error: The page started using the new open, home-like color mood, but the buttons still felt disconnected when only one CTA carried the accent and the others stayed flat gray.
- Root cause: Surface cleanup happened before the action-color system was updated, so the controls no longer matched the surrounding gradient treatment.
- Prevention checklist:
  - When the user asks to try a new color vibe, apply it consistently across the page's main button family, not just one CTA.
  - Keep the gradient treatment softer on secondary actions and stronger on the main CTA so hierarchy still reads clearly.
  - If the upload states and action layout already explain the flow, remove redundant helper tip copy instead of keeping both.
- Follow-up action: Reuse the “one gradient family, different intensity by hierarchy” rule for future stream/sync button color passes.

## 2026-03-20 (Do Not Bring Back Stream Helper Text)

- Date: 2026-03-20
- Context: Fine-tuning the left `Screen Share` block on `/stream`.
- Error: Once the stream page had been simplified, the old “Share your screen / enable audio” helper block became unnecessary visual noise under the main action card.
- Root cause: The block belonged to the older, heavier guidance style and no longer matched the cleaner open-column design.
- Prevention checklist:
  - If the main action card is already clear, remove the follow-up helper paragraph instead of stacking another explanatory box under it.
  - When retuning the left stream card colors, do it in the card/icon tokens, not by reintroducing helper content.
  - Keep the left stream column to title + main action by default unless the user explicitly asks for more explanation.
- Follow-up action: Reuse the title + main action only pattern for future minimal `/stream` passes unless a new user problem requires additional helper content.

## 2026-03-20 (Stream Bottom Actions Can Collapse To Two)

- Date: 2026-03-20
- Context: Simplifying the `/stream` footer actions after the page became visually cleaner.
- Error: Keeping a local `Back` action plus separate `Use Sync` and `Start Watching` rows made the footer feel busier than the rest of the page.
- Root cause: The older action cluster survived from a heavier flow even though the top-level entry header already provides enough navigation context.
- Prevention checklist:
  - If `/stream` already has clear page context and a sync alternative, remove the extra local back button before adding more styling.
  - Pair `Use Sync` and `Start Watching` in one row once they are the two real next-step actions.
  - Route the row layout through shared stream tokens instead of hardcoding another one-off footer wrapper.
- Follow-up action: Reuse the two-action bottom row pattern for future `/stream` minimal passes unless another third action becomes truly necessary.

## 2026-03-20 (Stream File Cards Need Density Before More Decoration)

- Date: 2026-03-20
- Context: Refining the `/stream` file list after the larger surface cleanup.
- Error: The cards still felt dull because they were too tall and too flat at the same time, which made the list look heavy without feeling premium.
- Root cause: The first pass simplified the cards, but it kept a relatively large row height and a nearly neutral fill, so the result lost energy without gaining tightness.
- Prevention checklist:
  - On `/stream`, reduce card height and internal gaps before adding stronger color.
  - Once density is improved, tune the card fill with a subtle home-family gradient instead of just raising plain white opacity.
  - Keep thumbnail surfaces richer than the row background so the list still has visual hierarchy at smaller sizes.
- Follow-up action: Reuse the “density first, color second” approach for future stream list-card tuning.

## 2026-03-20 (Selected Stream Card Border Should Be Inset)

- Date: 2026-03-20
- Context: Making the selected file state read cleanly in the `/stream` list.
- Error: The selected border looked weak on the left/right edges and too cramped at the top because the outer ring sat flush against the scroll container.
- Root cause: The list had no breathing room and the selected treatment used an outer ring, which is easier to clip visually in tight scroll areas.
- Prevention checklist:
  - On tight scroll lists, give the container a tiny top/side inset before assuming the selected state itself is wrong.
  - Prefer an inset border/shadow for selected states when the row needs to stay flush and compact.
  - Keep the added breathing room minimal so alignment stays visually unchanged.
- Follow-up action: Reuse the “tiny list inset + inset selected border” pattern for future compact selection lists when outer rings start clipping.

## 2026-03-20 (Stream List Viewport Should Show Three Rows)

- Date: 2026-03-20
- Context: Tuning the visible file stack on the `/stream` right column.
- Error: Showing only about two cards before scrolling made the file area feel cramped and underused even after the card styling improved.
- Root cause: The desktop list viewport height was still tuned for the older, taller row sizing and did not get revisited after the density cleanup.
- Prevention checklist:
  - After tightening list-card height, re-check how many rows are actually visible in the viewport.
  - On `/stream`, prefer a desktop list height that reveals 3 cards before scroll when the column has room.
  - Route the viewport height through a shared token instead of burying it in repeated local utility strings.
- Follow-up action: Reuse the “3 visible rows” target for future stream file-list tuning unless the row height changes again.

## 2026-03-20 (Do Not Replace Stream Upload Artwork With Fillers)

- Date: 2026-03-20
- Context: Making the empty `/stream` file area as tall as the 3-row filled list.
- Error: Adding extra placeholder rows inside the upload box technically filled the height, but it damaged the original centered upload artwork and made the empty state feel busier.
- Root cause: The height problem was solved inside the empty-state component instead of at the shared viewport-height layer around it.
- Prevention checklist:
  - Keep the original centered upload artwork intact when the user already likes that composition.
  - Match empty-state height by adjusting the list viewport, not by stuffing the upload box with extra filler content.
  - If the user asks for “same height, same look,” preserve the artwork first and only change the container contract.
- Follow-up action: Reuse the “keep the upload artwork, change the viewport” rule for future `/stream` empty-state sizing fixes.

## 2026-03-20 (Sync Can Share Stream's Color Family Without Sharing Its Structure)

- Date: 2026-03-20
- Context: Retuning `/sync` after the newer `/stream` color direction felt more cohesive.
- Error: `/sync` still read as a separate visual system because its controls and cards kept a flatter white-on-dark treatment while `/stream` had moved to a softer cyan/violet/pink family.
- Root cause: The structural redesign rules were respected, but the token palette between the two entry pages drifted apart.
- Prevention checklist:
  - Keep `/sync` on its approved layout, but retune shared tokens so buttons, fields, cards, and placeholders can join the newer family.
  - Use the same accent family with different intensity instead of copying every exact stream token 1:1.
  - If platform brand colors must stay, unify them with a shared overlay/gloss layer instead of replacing the platform identities entirely.
- Follow-up action: Reuse “shared palette, preserved structure” as the default path when aligning `/sync` with future entry-page color updates.

## 2026-08-07 (A Socket Drop Is Not The User Leaving The Room)

- Date: 2026-08-07
- Context: Users were being ejected from live rooms (`/stream` and `/sync` alike) every time the `communication` service was redeployed.
- Error: `RoomContext`'s disconnect effect cleared `roomType`, `streamDeliveryMode`, `joinResponse`, and `participants` on *any* disconnect. The client reconnects and rejoins on its own within seconds, but the UI had already collapsed, so a routine ~15s deploy gap looked identical to being kicked out.
- Root cause: Transient loss of transport was treated as terminal loss of session. There was no state distinguishing "recovering" from "gone".
- Prevention checklist:
  - On disconnect, release only the join guards (`isJoined`, `joinAttemptedRef`) so auto-join can re-run. Keep everything the next join ack will overwrite anyway.
  - Reserve teardown for `connectionFailed` — retries actually exhausted — not for `!isConnected`.
  - Never put a value that changes identity on re-render (a `useTranslations` fn, an inline object) in the dependency array of an effect that owns the socket lifecycle; its cleanup disconnects a socket that may be mid-reconnect.
  - Socket.IO does **not** auto-retry a handshake the server's auth middleware rejected (`socket.active === false`). If auth depends on another service, drive that retry manually or clients stay dead until reload.
- Follow-up action: Room state still lives only in `communication`'s process memory, so chat history and host identity are lost across a restart even though the socket now recovers. Persisting `RoomManager`/`ChatHandler` state to Redis is the remaining piece.

## 2026-08-07 (Dead UI: RoomPreparingSplash)

- Date: 2026-08-07
- Context: Auditing which components react to `isJoined` while fixing reconnect behavior.
- Error: `components/Container/RoomPreparingSplash.tsx` is defined and exported but imported nowhere — it is not part of any render path.
- Root cause: Left behind after an earlier room-loading rework.
- Prevention checklist:
  - Do not target `RoomPreparingSplash` when changing room loading/reconnect UI; it will have no effect.
  - Verify real imports before assuming a `Container/` component is on screen.
- Follow-up action: Confirm it is genuinely unwanted, then delete it along with any stale support types.
