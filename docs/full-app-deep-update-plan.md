# Full App Deep Update Plan (Platform-Wide)

## Completed in this pass

### P0 reliability fixes
- Unified upload path generation into `src/lib/upload-paths.ts` to prevent path drift across modules.
- Updated beneficiary, OFA player, testimony, and profile uploads to use shared path builders.
- Synchronized both storage rules files (`storage.rules`, `src/storage.rules`) with actual upload paths.
- Hardened AI bootstrap so missing `GEMINI_API_KEY` no longer crashes the app at import time.

## Remaining prioritized backlog

### P0 (next)
- Firestore role-based access rules (replace authenticated-all access).
- Data consistency contract for leaderboard (single source + freshness timestamp).
- Upload error telemetry (rule denied vs file too big vs network).

### P1
- Mobile table-to-card fallbacks for key data pages.
- Per-page responsive QA matrix and screenshot regression tests.
- Standardized loading/error/empty states for all dashboards.

### P2
- Route deduplication for mirrored pages (`record-testimony` variants, expense variants).
- Shared data export jobs (server-generated CSV/XLSX/PDF with pagination).
