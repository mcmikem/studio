# UI/UX Full Audit (Mobile-First)

## Scope
This audit focuses on mobile-first usability, accessibility, and interaction quality across navigation, layout, dense data views, and recently rebuilt forms.

## Audit Method
- Code review of core layout and nav primitives.
- Responsive pattern review of table/data-heavy sections.
- Mobile interaction review of header/nav controls.
- Validation UX review of form architecture.

## Executive Summary
The app has a strong component system and responsive intent, but the current UX is still **desktop-led in several critical journeys**. The top priorities are:
1. Improve mobile readability and tappability in global navigation.
2. Convert desktop table workflows into mobile task cards by default.
3. Strengthen accessibility semantics (aria labels, dialog semantics, focus/escape handling).
4. Standardize form spacing, sectioning, and sticky mobile submit bars.

---

## Findings (Priority-Ordered)

### P0 — Mobile nav text and interaction affordances are too small
- The bottom nav uses `text-[9px]` (and action tooltip `text-[8px]`), which is below recommended comfortable mobile readability and likely below accessibility expectations for many users.
- Action center and “More” controls are icon-heavy with minimal explicit accessible naming.

Evidence:
- Bottom nav labels at `text-[9px]`. (`HQ`, `Impact`, `Stars`, `More`).
- Tooltip label at `text-[8px]`.
- Toggle/action buttons do not include explicit `aria-label` in the component.

References: `src/components/mobile-nav.tsx` lines 59-67, 80-83, 85-92.【F:src/components/mobile-nav.tsx†L59-L67】【F:src/components/mobile-nav.tsx†L80-L83】【F:src/components/mobile-nav.tsx†L85-L92】

**Recommendation**
- Raise nav text to at least 11–12px equivalent and reduce all-caps density.
- Add `aria-label` and `aria-expanded` on action menu trigger.
- Add `aria-label` on “More” button.

---

### P0 — Action menu overlay is a visual modal, but not an accessible dialog
- The action menu overlay is implemented as an absolutely-positioned div and click-outside behavior only.
- There is no focus trap, no escape-key close behavior, and no explicit dialog semantics.

Reference: action overlay container and click behavior in `mobile-nav.tsx`.【F:src/components/mobile-nav.tsx†L34-L53】

**Recommendation**
- Replace custom overlay with existing dialog/sheet primitive from your UI system.
- Add keyboard support (`Esc`), focus trapping, and initial focus on first action.

---

### P0 — Layout uses fixed bottom spacing compensation that can break by viewport/device
- Global main container applies `mb-20 md:mb-0` to clear bottom nav space.
- Fixed margin approach can under/over-compensate depending on keyboard, safe area, and nav height changes.

Reference: `src/app/layout.tsx` main container spacing strategy.【F:src/app/layout.tsx†L43-L47】

**Recommendation**
- Move to a CSS variable-driven safe-area spacing strategy tied to actual nav height.
- Consider using `padding-bottom: calc(env(safe-area-inset-bottom) + var(--mobile-nav-height))` when mobile nav is mounted.

---

### P1 — Header control density is high for mobile; low discoverability and high mis-tap risk
- The header packs search + optional view-as + quick-add + notifications + user avatar in a tight horizontal row.
- On small widths this creates reduced spacing and icon-only interaction without labels.

Reference: header action cluster in `AppHeader`.【F:src/components/header.tsx†L167-L185】

**Recommendation**
- On mobile, collapse secondary actions into one “More actions” sheet.
- Keep only search + profile visible in top row.
- Preserve quick-add in bottom action center, not duplicated in header.

---

### P1 — Data tables remain primary UX in multiple workflows; mobile card alternatives are inconsistent
- Table primitives are horizontally scrollable but still table-first.
- Some screens provide mobile cards + desktop table split (good), others remain table-heavy.

References:
- Table primitive scroll container (`overflow-auto`).【F:src/components/ui/table.tsx†L9-L15】
- Generic `DataTable` is table-first rendering pattern.【F:src/components/ui/data-table.tsx†L39-L90】
- Example of good split pattern (mobile card + desktop table): school partnerships list.【F:src/components/management/partnerships/school-list.tsx†L131-L140】

**Recommendation**
- Standardize “mobile cards first, desktop table second” for all operational lists (expenses, approvals, records).
- Reserve horizontal table scrolling only for admin/analyst desktop contexts.

---

### P1 — Incomplete operations still visible in production UI
- There are still “coming soon” actions in active menus.

Reference: school partnership delete action placeholder.
【F:src/components/management/partnerships/school-list.tsx†L120-L122】

**Recommendation**
- Hide unavailable actions behind flags or disable with contextual explanation.
- Avoid destructive-option placeholders in production menus.

---

### P2 — Form UX needs one shared mobile pattern system
Recent form work is functionally solid, but mobile consistency can be improved by standardizing:
- section headers,
- field grouping,
- sticky submit/footer behavior,
- inline progress indicators,
- validation scroll-to-first-error.

References (recent rebuilt forms):
- OFA player, team, equipment, scorecard forms.
- GreenSchools tree survey.
- Omuto Cup volunteer and tournament forms.
【F:src/components/forms/ofa/player-registration-form.tsx†L128-L239】【F:src/components/forms/ofa/team-registration-form.tsx†L115-L225】【F:src/components/forms/ofa/equipment-impact-form.tsx†L73-L107】【F:src/components/forms/ofa/quarterly-scorecard-form.tsx†L90-L138】【F:src/components/forms/greenschools/tree-survey-form.tsx†L79-L133】【F:src/components/forms/talents/omuto-cup/volunteer-registration-form.tsx†L63-L99】【F:src/components/forms/talents/omuto-cup/tournament-registration-form.tsx†L69-L117】

**Recommendation**
- Define a reusable `MobileFormScaffold` with:
  - sticky CTA,
  - auto-safe-area bottom padding,
  - section accordions for long forms,
  - standardized error summary banner.

---

## Mobile-First Implementation Plan

### Phase 1 (1 sprint)
- Nav accessibility and readability fixes (P0).
- Replace custom action overlay with accessible dialog/sheet (P0).
- Layout safe-area spacing cleanup (P0).

### Phase 2 (1–2 sprints)
- Convert top 5 data-heavy pages to mobile card layouts first.
- Introduce standardized mobile action bars for list items.

### Phase 3 (1 sprint)
- Shared mobile form scaffold rollout to all long forms.
- Validation summary and keyboard/accessibility polish.

---

## Mobile QA Checklist (minimum)
- iOS Safari + Android Chrome:
  - touch target min 44x44,
  - no clipped CTA above keyboard,
  - no accidental bottom-nav overlaps,
  - no horizontal page scroll,
  - all dialogs close with Esc/backdrop and trap focus,
  - all icon-only buttons have accessible names.

