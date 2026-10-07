## What changed

<!-- One or two sentences about the user-visible behavior change. -->

## Why

<!-- The problem this solves. Link issues with "Closes #123" where relevant. -->

## How it was verified

<!-- List the exact commands you ran and their result. -->

- [ ] `npm run verify` passes (lint + typecheck + unit/integration tests + build)
- [ ] `npm run verify:full` passes when the change touches import, storage, study modes, or the app shell

## Checklist

- [ ] Tests added or updated for the new behavior
- [ ] Parser/study logic changes include a test-matrix case
- [ ] No `TODO` placeholders, mocked buttons, or screens left unconnected to storage
- [ ] Persisted-schema changes are additive with `.default()`s, or come with a Dexie migration and a `STATUS.md` note
- [ ] No secrets, real study material, or generated build output committed
- [ ] Accessibility considered (keyboard, labels, visible focus, not color-only)
- [ ] Responsive behavior checked on a narrow viewport

## Screenshots

<!-- Optional. For UI changes, include before/after. Do not include private study material. -->
