# Master AI Agent Loop

## Objective

Autonomously build Quizeasy from an empty or partially implemented repository into a release-ready MVP.

The agent must continue iterating through planning, implementation, testing, debugging, UX refinement, and documentation until the Definition of Done is satisfied.

This is not a "generate a starter project" task.

## Required loop

### Step 1 — Orient

At the beginning of each run:

- Inspect the repository.
- Read `AGENTS.md`.
- Read `TASKS.md`.
- Read `STATUS.md`.
- Read the relevant product/technical/design specs.
- Detect existing implementation before creating duplicate systems.

### Step 2 — Plan locally

Choose a small coherent milestone.

Good milestone:

> Import plain Q/A text, preview parsed items, fix invalid rows, save a set, and verify persistence.

Bad milestone:

> Build all frontend screens.

A milestone should be testable.

### Step 3 — Implement vertical slices

Each slice should include:

- domain logic
- storage integration if needed
- UI
- validation
- error handling
- tests
- responsive behavior

Do not postpone all testing until the end.

### Step 4 — Verify

Run the narrowest tests first, then broader checks.

Example:

```bash
npm run test -- parser
npm run test
npm run typecheck
npm run lint
npm run build
```

For UI-critical flows, run Playwright.

### Step 5 — Diagnose failures

If verification fails:

1. Read the actual failure.
2. Identify root cause.
3. Fix the root cause.
4. Rerun the failed check.
5. Rerun affected broader checks.
6. Continue.

Do not merely report failed tests and stop.

### Step 6 — Track state

After each milestone:

- update `TASKS.md`
- update `STATUS.md`
- record significant assumptions
- record unresolved known issues

### Step 7 — Continue

Move to the next highest-priority incomplete requirement.

Do not wait for the user to say "continue" unless there is an external blocker that cannot reasonably be resolved.

## External blockers

A real external blocker includes:

- a missing credential required for a user-requested external service
- a required proprietary file that is not present
- unavailable network resource where no reasonable local substitute exists

Not blockers:

- package configuration difficulty
- failing tests
- CSS issues
- parser bugs
- TypeScript errors
- unclear small design details
- choosing between two reasonable libraries

For non-blocking ambiguity, choose a sensible default and document it.

## Completion gate

Do not declare completion until:

- all MVP functional requirements are implemented
- required automated tests pass
- production build passes
- core flows have E2E coverage
- responsive/mobile behavior is checked
- accessibility basics are addressed
- import/export round trip works
- local persistence works across reload
- offline app shell works
- documentation is sufficient for a new contributor
- `docs/13-DEFINITION-OF-DONE.md` is fully satisfied

## Prioritization order

1. Data integrity
2. Parser correctness
3. Core study flow
4. Persistence
5. Import/export
6. UX clarity
7. Accessibility
8. PWA/offline behavior
9. Polish
10. Future-facing extension points

## Do not overbuild

MVP does not require:

- user accounts
- backend database
- subscriptions
- cloud sync
- social features
- built-in PDF parsing
- built-in AI generation
- payments
- admin panel

Architect for them where reasonable, but do not let future features delay the MVP.
