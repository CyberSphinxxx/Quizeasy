# Implementation Plan

Build in vertical slices.

## Phase 0 — Repository foundation

Deliver:

- React + TypeScript + Vite
- routing
- Tailwind
- lint
- format
- strict typecheck
- unit test setup
- E2E setup
- PWA base
- `npm run verify`

Exit gate:

- starter UI renders
- verification pipeline runs

## Phase 1 — Domain models and storage

Deliver:

- Zod schemas
- Dexie DB
- repository layer
- CRUD for sets/questions
- schema versioning
- repository tests

Exit gate:

- create a set
- persist questions
- reload page
- data remains

## Phase 2 — Parser engine

Deliver:

- normalization
- explicit format parser
- extended fields
- numbered-pair parser
- pipe parser
- issue reporting
- confidence
- parser tests

Exit gate:

- parser test matrix passes

## Phase 3 — Import experience

Deliver:

- paste screen
- live/manual parse action
- preview
- valid/warning/invalid states
- inline edit
- exclude item
- set title
- save

Exit gate:

- paste sample data and save successfully
- malformed input is understandable and recoverable

## Phase 4 — Library and editing

Deliver:

- library
- empty state
- set cards
- search
- set detail
- question editor
- delete/duplicate
- export set
- import set file
- backup all / restore all

Exit gate:

- complete CRUD works
- JSON export/import round trip preserves data

## Phase 5 — Study engine

Implement pure session-generation/scoring logic before UI.

Deliver:

- study options
- question selection
- shuffle
- eligibility
- scoring
- attempts
- result summary

Exit gate:

- deterministic unit tests pass

## Phase 6 — Flashcards

Deliver:

- flashcard session
- reveal
- known/missed
- progress
- results
- retry missed

Exit gate:

- full flow works desktop/mobile

## Phase 7 — Multiple choice

Deliver:

- explicit distractors
- compatible-answer fallback
- shuffle
- study/test feedback modes
- explanation
- ineligible handling

Exit gate:

- never produces invalid duplicate choice sets
- answer cannot appear twice
- result scoring correct

## Phase 8 — Identification

Deliver:

- free-response
- normalization
- accepted answers
- feedback
- result scoring

Exit gate:

- matching tests pass

## Phase 9 — Mixed mode

Deliver:

- select eligible mode per question
- avoid incompatible presentations
- score consistently

## Phase 10 — AI guide

Deliver:

- simple prompt
- MCQ-ready prompt
- copy buttons
- explanation
- external AI workflow
- accuracy disclaimer

No integrated AI required.

## Phase 11 — UX/accessibility

Deliver:

- mobile navigation
- desktop navigation
- dark mode
- reduced motion
- keyboard UX
- focus states
- empty/error/loading states
- confirmations
- accessible dialogs/forms

## Phase 12 — PWA and offline

Deliver:

- manifest
- service worker
- icons/placeholders
- installability
- offline shell smoke test

## Phase 13 — Release hardening

Deliver:

- regression fixes
- E2E core flows
- performance check with large set
- README
- LICENSE
- CONTRIBUTING
- SECURITY
- changelog or initial release notes

## Dependency rule

Do not build UI that depends on nonexistent domain/storage behavior without first defining the contract.

## Anti-patterns to avoid

- giant `App.tsx`
- all domain state in Zustand
- components calling Dexie directly everywhere
- duplicated question representation per study mode
- importing malformed JSON without validation
- mock-only screens with no functioning workflow
- TODO placeholders counted as completed features
