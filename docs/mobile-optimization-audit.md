# Mobile Optimization Audit (MEAL + Shared App Shell)

## Scope audited
- Shared app shell and reusable primitives that impact most pages:
  - `src/app/layout.tsx`
  - `src/components/page-header.tsx`
  - `src/components/ui/card.tsx`
  - `src/components/ui/table.tsx`
- High-traffic MEAL surfaces are covered by these shared components (hub pages, data pages, form wrappers, report cards).

## Findings
1. **Page headers were desktop-first**
   - Large fixed icon/title sizing and single-line breadcrumb flow could crowd narrow screens.
2. **Cards had desktop padding defaults**
   - `p-6` spacing everywhere reduced visible content density on phones.
3. **Tabular pages needed stronger mobile affordances**
   - Horizontal scrolling existed but lacked explicit touch-pan behavior and denser typography for small screens.

## System-wide fixes implemented
1. **Responsive `PageHeader`**
   - Stack-first layout on mobile, wraps breadcrumbs, reduced icon/title/body sizing for small screens.
2. **Responsive `Card` primitive**
   - Default padding reduced on mobile (`p-4`) and scales up at `sm`.
   - Card titles now use a smaller mobile base size with `sm` upscaling.
3. **Responsive `Table` primitive**
   - Added `overflow-x-auto` + `touch-pan-x` for clearer horizontal swiping.
   - Added safe minimum table width (`min-w-[640px]`) to prevent crushed columns.
   - Reduced mobile cell/header spacing and typography for readability.

## Expected impact
- Better readability and interaction density across the majority of pages without one-off rewrites.
- More predictable behavior for all table-heavy data screens on phones.
- Reduced header clipping and breadcrumb overflow in nested sections.

## Remaining follow-up (optional phase 2)
- Per-route fine-tuning for any outlier forms with unusually large field groups.
- Visual QA sweep at common breakpoints: 360px, 390px, 768px.
