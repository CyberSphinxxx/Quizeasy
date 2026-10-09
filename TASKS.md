# TASKS

Use checkboxes. Keep this file updated during implementation.

## Phase 0 — Foundation

- [x] Create React + TypeScript + Vite app
- [x] Configure Tailwind
- [x] Configure routing
- [x] Configure strict TypeScript
- [x] Configure ESLint/Prettier
- [x] Configure Vitest + React Testing Library
- [x] Configure Playwright
- [x] Configure PWA/offline shell
- [x] Add `npm run verify`

## Phase 1 — Domain and storage

- [x] Define canonical schemas
- [x] Add Zod validation
- [x] Add Dexie database
- [x] Implement set repository
- [x] Implement question repository
- [x] Implement progress/session persistence
- [x] Add migration/versioning strategy
- [x] Unit-test repositories

## Phase 2 — Import

- [x] Implement line normalization
- [x] Implement Q/A parser
- [x] Implement extended Q/A/W/E/T parser
- [x] Implement numbered-pair parser
- [x] Implement pipe-delimited parser
- [x] Detect malformed entries
- [x] Implement confidence/warning system
- [x] Build import preview
- [x] Build inline correction flow
- [x] Add parser test matrix

## Phase 3 — Library and set management

- [x] Library screen
- [x] Empty state
- [x] Create set manually
- [x] Set details
- [x] Question list
- [x] Add/edit/delete question
- [x] Search/filter questions
- [x] Duplicate set
- [x] Delete set
- [x] Import/export set
- [x] Backup/restore all data

## Phase 4 — Study modes

- [x] Study configuration screen
- [x] Flashcards
- [x] Multiple choice
- [x] Identification
- [x] Mixed quiz
- [x] Shuffle
- [x] Question limits
- [x] Retry mistakes
- [x] Results screen
- [x] Review mistakes
- [x] Session persistence

## Phase 5 — AI guide

- [x] AI guide page
- [x] Generic conversion prompt
- [x] MCQ-rich conversion prompt
- [x] Copy prompt action
- [x] External AI guidance
- [x] BYOK future placeholder in settings

## Phase 6 — UX polish

- [x] Mobile navigation
- [x] Desktop navigation
- [x] Responsive layouts
- [x] Dark mode
- [x] Keyboard support
- [x] Accessibility pass
- [x] Loading/error/empty states
- [x] Toast/feedback system
- [x] Undo or confirmation for destructive actions

## Phase 7 — Release readiness

- [x] Unit tests pass
- [x] Integration tests pass
- [x] E2E tests pass
- [x] Lint passes
- [x] Typecheck passes
- [x] Build passes
- [x] Offline/PWA smoke test
- [x] Export/import round-trip test
- [x] README complete
- [x] LICENSE included
- [x] CONTRIBUTING included
- [x] SECURITY included
- [x] Vercel deployment ready (vercel.json, SPA rewrites, caching/security headers, .vercel gitignore)
- [x] Definition of Done fully checked

## Deferred (explicitly out of scope for 1.0.0)

Not required by the MVP specification. Tracked here so nothing looks forgotten.

- [ ] Built-in AI providers / bring-your-own-key (architecture sketched in `docs/11-FUTURE-AI-INTEGRATION.md`; the Settings screen labels the area "not enabled yet")
- [ ] Spaced-repetition scheduling and study streaks
- [ ] CSV and Markdown-table import
- [ ] Native PDF/OCR extraction
- [ ] Account sync, collaboration, shared marketplace
- [ ] Payments

## Paper Ledger redesign

- [x] One theme file: tokens for color, radius, type and the two allowed motions
- [x] Self-hosted Fraunces / Inter / JetBrains Mono (latin subsets), offline-precached
- [x] Primitives: button, card, input, segmented control, toggle, chip, progress bar, keycap
- [x] Shell: 232px sidebar, `G`-chord nav shortcuts + keycap hints, bottom tab bar, one privacy line
- [x] Every screen restyled: Settings, Library, Study index/setup/session, AI guide, Import, Results, set detail/editor, dialogs, toasts, empty and error states
- [x] Zero hard-coded palette colors, shadows, gradients or blur left in `src`
- [x] PWA manifest and `theme-color` moved onto the paper palette

## Follow-up polish (non-blocking, no functional impact)

- [ ] Add a mastery indicator to library set cards. `SetWithStats` exposes only question and session counts, so a real percentage needs `src/data` work (excluded from the redesign).
- [ ] Give Guide and Settings `G`-chord keycaps if they should be reachable from the keyboard too (only `G L`, `G I`, `G S` exist today, matching the hints shown).
- [ ] Raise or silence the Vite 500 kB chunk-size warning (main chunk is 531 kB / 167 kB gzip)
- [ ] Silence the 11 `react-refresh/only-export-components` warnings in `src/app/routes.tsx` (the rule does not recognize `React.lazy()` declarations)
- [ ] Design proper app icons to replace the generated placeholder artwork
- [ ] Run `.github/workflows/ci.yml` once on GitHub to confirm the workflow
