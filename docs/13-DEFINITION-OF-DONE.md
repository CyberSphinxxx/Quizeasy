# Definition of Done

Quizeasy MVP is complete only when all sections below are true.

## Core value proposition

A new user can paste formatted Q&A and begin studying without an account.

## Import

- Canonical Q/A format works.
- Rich Q/A/W/E/T format works.
- At least the supported alternative formats in the parser spec work.
- Preview shows valid/warning/invalid items.
- Invalid items can be corrected or excluded.
- Parser does not silently invent missing content.
- Valid items after malformed items can still be recovered when safe.

## Persistence

- Sets persist across reload.
- Questions persist across reload.
- Preferences persist as intended.
- Data is validated at import boundaries.
- Database schema is versioned.

## Library

- Users can create, view, edit, duplicate, delete, import, and export sets.
- Empty and error states are understandable.

## Study

- Flashcards are functional.
- Multiple choice is functional.
- Identification is functional.
- Mixed mode is functional.
- Session options work.
- Results are accurate.
- Retry mistakes works.

## MCQ integrity

- Correct answer never appears twice.
- Duplicate choices are eliminated.
- Insufficient distractors are handled explicitly.
- Non-AI MVP never invents fake distractors.

## Identification integrity

- Case/whitespace normalization works.
- Accepted answer variants work.
- Matching does not become so permissive that clearly wrong answers pass.

## AI guide

- User can copy prompts.
- Workflow explains how to use an external AI.
- No API key is required.
- AI accuracy caveat is shown appropriately.

## Backup

- Single set export/import works.
- Full backup/restore works.
- Invalid file does not wipe local data.

## Responsive

- Core flows work on narrow mobile and desktop.
- No critical action is hidden below an inaccessible container.
- No unintended horizontal overflow in core screens.

## Accessibility

- Primary flows can be operated by keyboard.
- Focus is visible.
- Form fields have labels.
- Dialogs have reasonable focus behavior.
- Correct/incorrect state is not color-only.

## Offline/PWA

- PWA metadata is present.
- App shell is usable offline after a successful initial load.
- Local sets remain accessible offline.

## Verification

All required commands pass.

At minimum:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Critical Playwright E2E flows also pass.

## Documentation

A new developer can clone, install, run, test, and build Quizeasy from the README.

## No fake completion

The following do not count as done:

- TODO placeholders
- mocked buttons with no action
- screens not connected to persistence
- skipped release-blocking tests
- declaring success while build/typecheck fails
