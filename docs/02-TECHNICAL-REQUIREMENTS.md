# Technical Requirements

## Application architecture

Use a client-side React application.

Recommended stack:

- React
- TypeScript with strict mode
- Vite
- React Router
- Tailwind CSS
- Zustand for lightweight application/UI state
- Dexie for IndexedDB
- Zod for runtime validation
- Vitest
- React Testing Library
- Playwright
- PWA plugin/service worker

Use stable current releases at implementation time.

## Architectural boundaries

Suggested source structure:

```text
src/
  app/
  components/
  features/
    library/
    import/
    sets/
    study/
    results/
    ai-guide/
    settings/
  domain/
    schemas/
    quiz/
    study/
  data/
    db/
    repositories/
    migrations/
  parser/
  services/
  hooks/
  lib/
  styles/
  test/
```

Do not force this exact structure if a cleaner equivalent is already present.

## Domain separation

### Domain

Pure concepts and logic:

- question eligibility
- answer normalization
- scoring
- study session generation
- MCQ distractor selection
- validation

### Parser

Pure import processing:

- normalize text
- detect format
- parse entries
- return warnings/errors
- no UI dependencies
- no IndexedDB dependencies

### Data layer

Repository abstraction for:

- sets
- questions
- sessions
- results
- preferences

### UI

Consumes domain/repository services.

UI components should not directly perform low-level IndexedDB operations.

## Persistence

Use IndexedDB through Dexie.

Database must be versioned.

At minimum, persist:

- quiz sets
- questions
- study session summaries/results
- settings/preferences

## PWA

Requirements:

- installable manifest
- application icons/placeholders
- cached app shell
- graceful offline behavior
- no assumption of always-online connectivity

Do not aggressively cache external pages or AI websites.

## TypeScript

- `strict: true`
- avoid `any`
- type parser outputs
- type repository boundaries
- infer types from Zod where appropriate

## Validation

Validate external/imported data using Zod before persistence.

Never trust imported `.quizeasy.json` files.

## Error handling

Provide user-safe errors for:

- malformed imports
- unsupported schema version
- invalid backup file
- quota/storage failures
- corrupted local data
- insufficient MCQ distractors

Log developer detail only where appropriate.

## Export formats

### Single set

Extension recommendation:

```text
.quizeasy.json
```

### Full backup

```text
quizeasy-backup.json
```

JSON should include schema version.

## Migrations

Design persisted schemas so future versions can migrate.

Example:

```ts
schemaVersion: 1;
```

Do not silently discard unknown fields from user imports unless documented.

## Study engine

Study session generation should be deterministic when given:

- source set
- options
- RNG/seed abstraction where testing needs determinism

The engine should decide eligibility for each mode.

## Multiple-choice distractors

Priority:

1. explicit wrong choices on the question
2. compatible answers from other questions in the set
3. if fewer than required plausible choices exist, reduce choice count when acceptable or mark question ineligible

Never invent random nonsense in the non-AI MVP.

## Identification matching

Default comparison:

- trim outer whitespace
- collapse repeated whitespace
- case-insensitive

Do not automatically strip meaningful punctuation in ways that cause false positives.

Support `acceptedAnswers`.

## Security

- no hardcoded API keys
- no eval
- sanitize or render user text safely
- avoid dangerouslySetInnerHTML unless sanitized
- validate file imports
- enforce reasonable import size limits
- do not trust filenames

## Performance

Target:

- smooth use with at least 2,000 questions in a set
- avoid rendering thousands of editor rows simultaneously
- use pagination or virtualization if needed
- parse imports without freezing the UI on normal student-sized sets

## Browser target

Support current evergreen desktop/mobile browsers.

## No backend dependency

The production app must remain useful when deployed as static assets.
