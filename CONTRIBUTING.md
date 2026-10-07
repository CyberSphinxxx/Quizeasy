# Contributing to Quizeasy

Thanks for helping. Quizeasy is a local-first, backend-free app, so almost
everything can be developed and tested on your own machine without any accounts
or API keys.

## Getting started

```bash
git clone https://github.com/CyberSphinxxx/Quizeasy.git
cd Quizeasy
npm install
npm run dev
```

Before opening a pull request, install the Playwright browser once:

```bash
npm run test:e2e:install
```

## Quality gates

Every pull request must pass:

```bash
npm run verify       # lint + typecheck + unit/integration tests + build
npm run verify:full  # verify + Playwright E2E
```

CI runs the same commands. `npm run verify` is the minimum bar; run
`verify:full` when your change touches import, storage, study modes, or the app
shell.

Requirements for a change to be accepted:

- **Lint** clean (`npm run lint`), **typecheck** clean (`npm run typecheck`).
- **Unit/integration tests** pass (`npm run test`).
- **Production build** succeeds (`npm run build`).
- New behavior comes with tests (see below).
- No `TODO` placeholders, no mocked buttons, no screens left unconnected to
  storage.

## Where tests belong

| Area touched                                                | Add tests in                                 |
| ----------------------------------------------------------- | -------------------------------------------- |
| Import parsing, formats, warnings, limits                   | `src/parser/parse.test.ts`                   |
| Choice generation, answer normalization                     | `src/domain/quiz/*.test.ts`                  |
| Session planning, retry, scoring                            | `src/domain/study/*.test.ts`                 |
| Dexie repositories, cascade delete, validation, persistence | `src/data/repositories/repositories.test.ts` |
| A feature screen or a user flow in the browser              | `src/features/**/*.test.tsx`                 |
| A full flow across screens (import → study → results)       | `e2e/*.spec.ts`                              |

Playwright specs run against a production build served on
`127.0.0.1:4173`. Two projects are configured: `chromium-desktop` (ignores
`*.mobile.spec.ts`) and `chromium-mobile` (matches only `*.mobile.spec.ts`).

When adding an E2E spec, remember the app shell renders global navigation before
`<main id="main-content">`. Scope a selector such as a set's "Study" link to
`#main-content`, otherwise it resolves to the sidebar item for a different page.

## Coding conventions

- **Strict TypeScript.** `strict`, `noUncheckedIndexedAccess`, and
  `verbatimModuleSyntax` are enabled. Avoid `any`; avoid non-null assertions.
- **Layer boundaries matter.**
  - Domain logic (schemas, quiz/study rules) lives in `src/domain` and stays
    pure — no React, no Dexie.
  - Parsing is a standalone, side-effect-free module in `src/parser`.
  - All persistence goes through the repository/service layer in
    `src/data` and `src/services`. Components never touch Dexie directly.
  - Validation happens at the boundaries: parser output, file imports, and
    database reads.
  - UI state and persisted domain data stay separate.
- **Components** are small and colocated with their feature. Reusable primitives
  live in `src/components/ui`.
- **Styling** uses Tailwind CSS v4 utility classes plus the shared component
  classes in `src/styles/index.css`. Note that Tailwind v4 cannot `@apply` a
  custom component class, so variants are composed in TypeScript instead.
- **Formatting** is Prettier; run `npm run format` before committing.

## Data schema changes

Persisted data has a `SCHEMA_VERSION` (`src/domain/constants.ts`) and a versioned
Dexie database (`src/data/db/database.ts`).

- Additive, optional fields are fine within the current version: give them a Zod
  `.default()` so old rows and old exports still parse.
- Anything that renames, removes, or changes the meaning of a stored field needs
  an explicit Dexie migration plus a note in `STATUS.md`.
- Never make a breaking export change without documenting it. Exported files
  must keep importing; export/import round trips must stay lossless for
  supported fields.

## Import parser contributions

The parser is the defining feature of the app, and small changes have large
blast radius.

- Add a case to the parser test matrix for every new format or alias.
- Prefer fewer, clearer aliases over many loose ones: accidental parsing of
  ordinary prose is a bug.
- Never invent content. The parser only interprets text the user supplied.
- Malformed entries must be reported, not silently dropped, and later valid
  entries must still be recovered where it is safe to do so.

## Accessibility and UX expectations

- Primary flows must be operable by keyboard, with visible focus.
- Form fields need labels; errors should be announced, not just colored.
- Correct/incorrect state must never be conveyed by color alone.
- Destructive actions need confirmation or undo.
- Empty states should teach the user the next step.
- Mobile layouts are first-class: no horizontal overflow, no primary action
  hidden behind other UI.

## Pull requests

1. Branch from the default branch and keep the change focused.
2. Describe the user-visible behavior change and how you verified it.
3. Include the test names or commands you ran, and mention anything you could
   not run.
4. Do not commit `dist/`, coverage output, Playwright traces, or any local
   environment file.

Issue and pull request templates are provided in `.github/`. Security issues go
through [`SECURITY.md`](SECURITY.md), not the public tracker.

## License

By contributing you agree that your contribution is licensed under the
project's [MIT license](LICENSE).
