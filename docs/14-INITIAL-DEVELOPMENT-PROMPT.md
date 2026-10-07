# Initial Development Prompt

Copy everything below into your coding agent.

---

You are the primary autonomous coding agent for **Quizeasy**, an open-source local-first quiz maker and study app.

Your task is to build the complete Quizeasy MVP in this repository.

## First action

Before changing code:

1. Inspect the entire repository.
2. Read `AGENTS.md`.
3. Read `TASKS.md`.
4. Read `STATUS.md`.
5. Read every file in `docs/`, especially:
   - `00-MASTER-AGENT-LOOP.md`
   - `01-PRODUCT-REQUIREMENTS.md`
   - `02-TECHNICAL-REQUIREMENTS.md`
   - `03-APP-FLOW.md`
   - `04-DESIGN-BRIEF.md`
   - `05-DATA-SCHEMA.md`
   - `06-IMPORT-PARSER-SPEC.md`
   - `07-IMPLEMENTATION-PLAN.md`
   - `08-TESTING-QA.md`
   - `09-EDGE-CASES.md`
   - `13-DEFINITION-OF-DONE.md`
6. If `AGENTS.md`, `TASKS.md`, or `STATUS.md` do not exist yet, initialize them from their `.template.md` equivalents.

## Product direction

Quizeasy must let a user paste already formatted Q&A, automatically parse it into a canonical question bank, save it locally, and study the same data as:

- flashcards
- multiple choice
- identification
- mixed quiz

The MVP must be account-free and backend-free.

Use a local-first architecture with IndexedDB.

The app must remain useful without AI.

The AI Guide should only help the user copy prompts and use an external AI such as ChatGPT, Gemini, Claude, or another provider. Built-in AI is a future feature.

## Recommended stack

Use:

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Zustand
- Dexie
- Zod
- Vitest
- React Testing Library
- Playwright
- PWA support

Use stable current package versions.

You may make a small substitution only when there is a clear technical reason. Record it in `STATUS.md`.

## Mandatory architecture

- One canonical question representation.
- Study modes consume canonical questions instead of maintaining duplicated question stores.
- Parser logic must be independent from UI.
- Storage must have a repository/service boundary.
- Runtime validation must protect imports.
- Strict TypeScript.
- No backend dependency for MVP.
- No embedded secrets.
- No AI vendor coupling in core domain logic.

## Development behavior

Do not stop after:

- planning
- scaffolding
- making mockups
- finishing only one page
- encountering a normal test/build/type error

Work through the implementation plan autonomously.

For ordinary ambiguities, choose a sensible default and document it rather than asking me.

After each coherent milestone:

1. add/update tests
2. run relevant verification
3. fix failures
4. update `TASKS.md`
5. update `STATUS.md`
6. continue to the next incomplete requirement

If tests fail, diagnose and fix them before proceeding.

Do not claim completion while required checks fail.

## Priority order

1. project foundation
2. domain schema + persistence
3. parser engine
4. paste/import preview
5. library and editor
6. study engine
7. flashcards
8. multiple choice
9. identification
10. mixed mode
11. results/retry mistakes
12. import/export/backup
13. AI guide
14. responsive/accessibility polish
15. PWA/offline
16. documentation/release hardening

## Parser

The parser is a flagship feature.

At minimum support:

```text
Q: What does CPU stand for?
A: Central Processing Unit
```

and:

```text
Q: What does CPU stand for?
A: Central Processing Unit
W: Central Program Unit
W: Computer Processing Utility
W: Core Processing Utility
E: The CPU executes instructions.
T: hardware, computer
```

Also implement the alternative formats specified in `docs/06-IMPORT-PARSER-SPEC.md`.

Never invent missing answers or fake distractors.

## Multiple choice

Use this distractor priority:

1. explicit `wrongChoices`
2. compatible answers from other questions
3. if insufficient, mark/reduce eligibility rather than inventing nonsense

The correct answer must never appear twice.

## Verification

Create a convenient verification script.

Before declaring MVP complete, ensure these pass:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Run Playwright critical flows as well.

Prefer:

```bash
npm run verify
```

for the normal local quality gate.

## Completion condition

Continue working until `docs/13-DEFINITION-OF-DONE.md` is fully satisfied.

When you believe the MVP is complete:

1. run final full verification
2. inspect for remaining TODOs/placeholders
3. perform a responsive/mobile review
4. verify export/import round trip
5. verify persistence across reload
6. verify offline/PWA shell
7. update `TASKS.md`
8. update `STATUS.md`
9. provide a concise final implementation report including:
   - features completed
   - architecture
   - test results
   - build result
   - any non-blocking known limitations
   - exact commands to run the app

Begin now. Do not merely describe the plan. Inspect the repository and start implementation.
