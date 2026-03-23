# Full App Deep Update Plan (Platform-Wide)

## Completed in this pass

### P0 reliability fixes
- Unified upload path generation into `src/lib/upload-paths.ts` to prevent path drift across modules.
- Updated beneficiary, OFA player, testimony, and profile uploads to use shared path builders.
- Synchronized both storage rules files (`storage.rules`, `src/storage.rules`) with actual upload paths.
- Hardened AI bootstrap so missing `GEMINI_API_KEY` no longer crashes the app at import time.
- Fixed `firestore.rules` structure: moved all per-collection rules inside `match /databases/{database}/documents` block so role-based access rules are actually enforced. Removed duplicate `events` and `resources` rules. Synced `src/firestore.rules` with main rules file.
- Added data consistency contract for leaderboard: freshness timestamp, error state handling, source count tracking via `PerformanceResult` and `PerformanceDataFreshness` types in `performance.ts`.
- Created centralized upload error telemetry (`src/lib/upload-errors.ts`) classifying errors as `rule_denied`, `file_too_large`, `file_invalid_type`, `network`, `quota_exceeded`, `billing_required`, `upload_canceled`, or `unknown`. Integrated into `firebase/storage.ts` and `lib/gcs-upload.ts`.
- Mobile nav accessibility: added focus trapping in action overlay, `aria-expanded`/`aria-haspopup` attributes, `aria-hidden` on decorative icons, `aria-current="page"` on active links, `sr-only` label for quick actions button. Raised toggle pill text from `text-[9px]` to `text-[10px]`.
- Layout safe-area spacing: replaced fixed `pb-32 md:pb-6` with CSS `calc(var(--mobile-nav-height) + env(safe-area-inset-bottom))`. Added `--mobile-nav-height` CSS variable and `pb-safe` utility class. Added `safe-bottom` spacing to tailwind config.

### P1 improvements
- DataTable enhanced with branded empty states (search icon, title, description, optional action button/link) for both desktop and mobile views. Added `emptyTitle`, `emptyDescription`, `emptyAction` props.
- FormShell upgraded to full MobileFormScaffold with new components: `FormSection` (collapsible sections), `FormErrorSummary` (error banner), `FormStickyFooter` (sticky bottom CTA with safe-area padding).

### P2 improvements
- Route deduplication: `/meal/record-testimony` now redirects to `/record-testimony?from=meal`. Main page reads `from` query param to set correct back navigation.
- Export utility: cleaned up `src/lib/export.ts`, removed duplicate PDF rendering code into shared `renderPdfTable` helper, added `exportPaginatedToCSV` and `exportPaginatedToPDF` for paginated data exports with progress callbacks.

## Remaining prioritized backlog

### P0 (next)
- None remaining in this plan.

### P1
- Per-page responsive QA matrix and screenshot regression tests.
- Convert top 5 data-heavy pages to mobile card layouts first (partially addressed via DataTable improvements).

### P2
- Shared data export jobs — server-side CSV/XLSX/PDF generation with pagination (partially addressed via client-side paginated export).
