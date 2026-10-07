# STATUS

Keep this concise and current.

## Current phase

**MVP complete — release candidate (v1.0.0, data schema v1).**
All Definition of Done sections in `docs/13-DEFINITION-OF-DONE.md` are satisfied.
See the follow-up list at the end of `TASKS.md` for non-blocking polish.

## Completed

**Foundation** — React 19 + TypeScript 6 + Vite 8 app, Tailwind CSS v4, strict
TS (`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`), ESLint 10 +
Prettier, Vitest + Testing Library, Playwright, PWA service worker, and the
`verify` / `verify:full` quality gates.

**Domain and storage** — Zod schemas for set, question, study session, attempt,
preferences, and transfer files; versioned Dexie database with per-row validation
on read; repository boundary (`withStorage`, `collectValidRows`, `NotFoundError`,
`ValidationError`); preferences persistence; cascade delete; ID remapping on
import/restore.

**Import** — `parseQuizText` supporting labelled (`Q:`/`A:`/`W:`/`E:`/`T:` and
aliases, case-insensitive, Markdown-decorated, bulleted, numbered), numbered-pair,
and pipe formats; source-position tracking; valid/warning/invalid
classification; inline editing and exclusion; limits; recovery of valid items
after a malformed one.

**Library and set management** — library with search, recent studies, and a
teaching empty state; create/rename/duplicate/delete set; set detail with mode
eligibility; question editor with add/edit/delete/reorder/search and undo on
delete; per-set export; import into a set.

**Study modes** — flashcards, multiple choice, identification, and mixed quiz;
single/multiple session options (mode, question limit, shuffle questions, shuffle
choices, study vs. test feedback, tag filter); results with score, per-mode
totals, missed-question review, and retry-mistakes; session persistence with
resume after reload.

**AI guide** — copyable simple and MCQ-ready prompts, external-AI workflow,
no-API-key statement, and an accuracy caveat.

**Backup/restore** — per-set `.quizeasy.json` export, whole-library backup and
merge-based restore, invalid-file rejection that leaves local data untouched,
and a "clear all local data" flow with a typed confirmation phrase.

**Verified example artifacts** — the shipped `examples/sample-import.txt` and
`examples/sample-set.quizeasy.json` are exercised by tests (parse → import →
re-import merges instead of overwriting → export round trip → backup → restore),
so the README instructions cannot silently rot.

**UX** — responsive desktop sidebar + mobile bottom navigation, dark mode with a
pre-paint theme script, keyboard shortcuts in study sessions, focus-trapped
dialogs, toasts, loading/error/empty states, and confirmation for destructive
actions.

**Repository docs** — `README.md`, `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`,
`CODE_OF_CONDUCT.md`, `AGENTS.md`, issue and PR templates, and a GitHub Actions
workflow.

## In progress

- None.

## Next

Optional, non-blocking (see `TASKS.md` → "Follow-up polish"):

- Reduce the main bundle chunk below Vite's 500 kB warning.
- Silence the `react-refresh` warnings for `React.lazy()` in the route module.
- Design real app icons.

## Known issues

Non-blocking. No known data-loss, crash, or correctness bug.

1. **Vite chunk-size warning.** The main chunk is 531.15 kB (166.63 kB gzip).
   Routes are already lazily imported; the remainder is React + router + Dexie +
   Zod + icons in one vendor chunk. Build succeeds.
2. **11 ESLint warnings** (`react-refresh/only-export-components`) in
   `src/app/routes.tsx`. The rule does not recognize `React.lazy()` page
   declarations as components. Lint reports **0 errors**; warning-only.
3. **CI workflow is unverified.** `.github/workflows/ci.yml` is written and its
   YAML parses, but it has never executed on GitHub. All of its steps were run
   locally by hand.
4. **App icons are generated placeholder artwork**
   (`scripts/generate-icons.mjs` writes simple PNGs with no image dependency).
   Replace with designed icons before a public release.
5. **The original planning bundle `Quizeasy-AI-Agent-Loop/` is still in the
   repo.** `docs/`, `examples/`, and `schemas/` were copied to the root; the
   bundle is kept as source material and is excluded from lint. Delete it before
   publishing if it is not wanted.
6. **Test coverage is by behavior, not measured.** There is no coverage
   threshold configured; 149 unit/integration tests plus 13 E2E tests cover the
   parser, domain logic, repositories, services, and the main flows.

## Architectural decisions

- **Hash routing** (`createHashRouter`). The static build works from any host,
  subfolder, or `file://` with no rewrite rules — the right trade-off for a
  local-first app that must run offline from anywhere.
- **Lazy route imports** so the first paint stays small; `AppShell` wraps the
  `<Outlet />` in `<Suspense>`.
- **Dexie/IndexedDB is the single source of truth.** UI state and persisted
  domain data stay separate; components never touch Dexie directly.
- **Validation at every boundary** — parser output, file imports, and database
  reads. Corrupted rows are skipped and counted, never allowed to crash a screen.
- **Zod v4 API** (`{ error: … }`, `z.enum(TUPLE)`, `.default()`). `schemaVersion`
  and the question fields `acceptedAnswers` / `wrongChoices` / `tags` have
  defaults so older and hand-written exports still import.
- **ID collisions are remapped, never overwritten.** Backup restore **merges**;
  it never wipes.
- **Deleting a set cascades** to its questions, sessions, and attempts. This is
  the documented policy and is covered by a repository test.
- **Deterministic sessions.** A seed makes planning, shuffling, and resumption
  reproducible, which is what lets a reload resume the same questions and choices.
- **Multiple choice never invents distractors.** Priority: explicit `W:` choices
  → answers from other questions in the set (ranked by tag overlap, then by
  shorter length, then set order) → ineligible. Minimum 2 real distractors are
  required; fewer gives an explicit "add W: lines" message. The correct answer
  and its accepted variants are never reused as choices.
- **Identification normalization** — NFKC, lowercase, whitespace collapsed, and a
  two-pass strip of surrounding quotes / trailing periods. Internal punctuation
  stays significant so near-misses still fail.
- **Bulk inserts step `createdAt` by 1 ms per row** so ordering is stable; the
  editor's move action swaps timestamps.
- **`sessionRepository.completeActiveForSet`** closes a stale open session when a
  new one starts, so a set never accumulates unfinished sessions.
- **Tailwind v4 cannot `@apply` a custom component class**, so button variants
  compose classes in TypeScript instead of `@apply btn`.
- **Shared empty-array constants** (`src/lib/empties.ts`) keep memo dependencies
  referentially stable.
- **PWA uses `registerType: 'prompt'`** with `clientsClaim`/`skipWaiting` off, so
  an update never interrupts an active study session. A consequence is that the
  freshly activated worker only controls the page after the next navigation.

## Assumptions

Recorded implementation decisions where the specification left a choice open.

1. **License: MIT.** `docs/10-OPEN-SOURCE-REPO.md` says the owner must choose the
   license intentionally. MIT is declared in `package.json` and `LICENSE` as a
   sensible permissive default. **The maintainer should confirm or replace it**
   before a public release; those two files are the only places to change.
2. **Title suggestion.** When the user has not typed a set title, the importer
   pre-fills it from the first parsed prompt.
3. **Second `A:` line = accepted variant.** A repeated answer label on the same
   question becomes an accepted alternative rather than replacing the answer.
4. **Multiple choice minimum is 2 distractors (3 choices).** Fewer than the
   4-choice target is allowed when at least 2 real distractors exist, and the
   session says so explicitly. Below 2, the question is ineligible rather than
   padded with invented answers.
5. **Identification is limited to short answers** (≤ 80 characters and ≤ 8
   words). Long answers are reported as ineligible with a suggestion to use
   flashcards or multiple choice instead.
6. **Tag matching for pool distractors is preference, not a filter** — questions
   sharing tags contribute more plausible distractors first, then length, then
   set order.
7. **Parser limits:** 500,000 characters per paste, 2,000 questions per import,
   4,000 characters per field, with a 600-character "suspiciously long" warning.
8. **Preferences default to shuffle questions and shuffle choices on**, feedback
   immediate, theme system.
9. **Set export filename** is `<sanitized set title>.quizeasy.json`; the
   whole-library backup is `quizeasy-backup.json`.
10. **Hash-routed deep links** look like `…/#/sets/<id>/study`.
11. **`engines.node` is `>=20.19.0`** (Vite 8 requirement); development and
    verification were performed on Node 24.19.0.

## Verification

Last run: Windows, Node v24.19.0, npm 11.17.0.

| Command                | Result                                                        |
| ---------------------- | ------------------------------------------------------------- |
| `npm run lint`         | **Pass** — 0 errors, 11 warnings (`react-refresh`, see above) |
| `npm run typecheck`    | **Pass** — `tsc --noEmit`, no output                          |     | `npm run test` | **Pass** — 149 tests in 11 files (~9 s) |
| `npm run build`        | **Pass** — 836 ms; PWA precaches 50 entries (738.79 KiB)      |
| `npm run format:check` | **Pass** — all files formatted                                |
| `npm run verify`       | **Pass** — lint + typecheck + test + build                    |
| `npm run test:e2e`     | **Pass** — 13/13 (10 `chromium-desktop`, 3 `chromium-mobile`) |

Unit/integration coverage: parser matrix (formats, line endings, unicode,
limits, recovery after malformed entries), choice generation, answer
normalization, session planning and retry, scoring, repositories (cascade
delete, reopen persistence, corrupted-row skipping, preferences fallback),
shipped example artifacts, and the import/editor/study/dialog screens.

E2E coverage: first-visit import → study → 100% results, malformed-import repair,
reload persistence, offline app shell after the first visit, set export/import
round trip, invalid backup does not wipe data, multiple-choice integrity,
identification normalization, mixed mode, delayed (test-mode) feedback, mobile
layout/overflow and navigation, dark mode.

Manual smoke test (dev server, Chromium): imported 4 questions, saved, completed
a flashcard session to results (100% plus retry-mistakes), ran a multiple-choice
session, and passed identification with messy casing and a trailing period. The
console contained only Vite and React DevTools messages.
