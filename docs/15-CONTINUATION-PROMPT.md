# Continuation / Context-Reset Prompt

Use this when handing the repository to another coding agent or when the current agent loses context.

---

Continue development of Quizeasy from the current repository state.

Do not assume prior chat context.

First:

1. Read `AGENTS.md`.
2. Read `TASKS.md`.
3. Read `STATUS.md`.
4. Read the relevant files in `docs/`.
5. Inspect git diff/status and existing implementation.
6. Run the smallest useful verification command to establish current health.

Then resume the highest-priority incomplete MVP item.

Do not redo completed systems unless verification shows they are broken.

Do not stop at analysis or planning.

Implement, test, debug, update `TASKS.md`/`STATUS.md`, and continue until the Definition of Done is satisfied.

If a normal ambiguity exists, choose a reasonable default and document it.

If tests fail, fix them rather than only reporting them.

Before declaring completion, run full verification and confirm `docs/13-DEFINITION-OF-DONE.md`.
