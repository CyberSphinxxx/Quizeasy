# Testing and QA Requirements

## Philosophy

The most important Quizeasy risks are:

1. silently importing questions incorrectly
2. losing user data
3. scoring incorrectly
4. generating invalid multiple-choice options
5. breaking the study flow on mobile

Tests should target these risks.

## Unit tests

### Parser

Highest priority.

Test every parser format and malformed variant.

### Answer normalization

Test:

- whitespace
- casing
- unicode
- accepted answers
- punctuation-sensitive cases

### MCQ choice generation

Test:

- explicit distractors
- duplicate removal
- correct answer uniqueness
- insufficient distractors
- fallback answer pool
- shuffle stability when seeded

### Study engine

Test:

- limits
- shuffle
- eligibility
- scoring
- retry mistakes
- mixed mode

### Validation

Test:

- set imports
- backup imports
- schema versions
- malformed data

## Repository tests

Test:

- create set
- update set
- delete set cascade
- add question
- update question
- remove question
- persistence across DB reopen
- migration behavior where possible

Use IndexedDB test tooling appropriate to the environment.

## Component/integration tests

Prioritize:

- import preview
- inline correction
- study configuration
- answer feedback
- results
- destructive confirmation

## E2E tests

Required critical paths:

### E2E 1 — First-time import to flashcards

1. open empty app
2. choose paste/import
3. paste sample Q/A
4. preview
5. save
6. start flashcards
7. complete cards
8. see result

### E2E 2 — Malformed import recovery

1. paste mixed valid/invalid data
2. see warning/error
3. fix invalid item
4. save
5. confirm expected count

### E2E 3 — Multiple choice

1. import MCQ-ready data
2. start MCQ
3. answer questions
4. verify correct score

### E2E 4 — Identification

1. start identification
2. submit normalized accepted answer
3. verify correctness
4. finish and see result

### E2E 5 — Persistence

1. create/import set
2. reload
3. confirm set remains

### E2E 6 — Export/import round trip

1. export set
2. delete or use fresh storage
3. import set file
4. verify content

## Responsive QA

At minimum test representative widths:

- narrow mobile
- large mobile
- tablet
- desktop

Ensure:

- no clipped primary button
- no horizontal scrolling caused by layout
- dialogs fit
- long question text wraps
- bottom navigation does not cover content

## Accessibility QA

Check:

- keyboard-only import
- keyboard-only study session
- visible focus
- form labels
- dialog focus
- errors associated with fields
- contrast
- icons have accessible labels where needed

Automated accessibility tools are useful but do not replace manual keyboard checks.

## Performance QA

Generate test data:

- 100 questions
- 500 questions
- 2,000 questions

Measure obvious UI degradation.

Avoid rendering all 2,000 editable forms at once.

## Manual smoke checklist

- fresh app
- import
- edit
- study each mode
- results
- retry mistakes
- export
- restore
- dark mode
- offline reload/app shell
- mobile viewport

## Verification command

Create:

```bash
npm run verify
```

that runs, at minimum:

- lint
- typecheck
- unit/integration tests
- build

E2E may be separate if runtime makes it too expensive, but must still be run before release.
