# AGENTS.md — Quizeasy

This file contains mandatory instructions for coding agents working on Quizeasy.

## Mission

Build Quizeasy into a polished, tested, open-source local-first quiz maker.

Do not stop after planning, scaffolding, or implementing only the happy path. Continue through implementation, verification, bug fixing, UX refinement, and documentation until the Definition of Done is satisfied.

## Source of truth

Read these before making architectural changes:

- `docs/01-PRODUCT-REQUIREMENTS.md`
- `docs/02-TECHNICAL-REQUIREMENTS.md`
- `docs/03-APP-FLOW.md`
- `docs/04-DESIGN-BRIEF.md`
- `docs/05-DATA-SCHEMA.md`
- `docs/06-IMPORT-PARSER-SPEC.md`
- `docs/08-TESTING-QA.md`
- `docs/13-DEFINITION-OF-DONE.md`

If two documents conflict, prioritize:

1. Product requirements
2. Technical requirements
3. Data schema / parser specification
4. Design brief
5. Implementation plan

## Autonomous execution rules

- Do not ask for confirmation for normal implementation decisions.
- Choose reasonable defaults when a detail is unspecified.
- Record important assumptions in `STATUS.md`.
- Do not repeatedly ask the user what to do next.
- Do not stop after reporting a problem if it is reasonably fixable.
- When a test fails, diagnose it, fix it, rerun it, and continue.
- When a lint/typecheck/build error occurs, resolve it before moving on.
- Never claim completion while required checks fail.
- Prefer complete vertical slices over many half-finished screens.

## Development loop

Repeat:

1. Inspect current repository state.
2. Read `TASKS.md` and `STATUS.md`.
3. Select the highest-priority incomplete item.
4. Implement the smallest coherent vertical slice.
5. Add or update tests.
6. Run targeted verification.
7. Fix failures.
8. Run broader verification.
9. Update `TASKS.md` and `STATUS.md`.
10. Continue with the next incomplete item.

Stop only when all Definition of Done requirements are satisfied or a genuine external blocker prevents progress.

## Quality gates

Before declaring complete, run the project's equivalent of:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

Prefer a single:

```bash
npm run verify
```

that runs all required checks.

## Architecture rules

- Strict TypeScript.
- Avoid `any` unless unavoidable and documented.
- Domain logic must not live directly inside UI components.
- Parsing must be a standalone tested module.
- Study modes must consume canonical question data.
- Storage access must go through a repository/service layer.
- Schema validation must occur at import boundaries.
- IndexedDB is the source of truth for local persisted data.
- UI state and persisted domain data must remain conceptually separate.
- The app must work without a backend.
- No AI API is required for the MVP.
- Never expose secrets in the client bundle.
- Future AI support must use provider interfaces.

## UX rules

- Primary actions must be obvious.
- Avoid unnecessary modal chains.
- Import must show a preview before committing.
- Parsing errors should explain how to fix them.
- Destructive operations need confirmation or undo.
- Mobile layouts must remain first-class.
- Keyboard navigation and basic accessibility are required.
- Empty states must teach the user what to do next.

## Repository hygiene

- Do not commit generated build output unless required.
- Keep environment files out of version control.
- Include `.env.example` only if needed.
- Maintain a useful README.
- Use small modules with clear names.
- Prefer semantic folder organization over giant utility files.
