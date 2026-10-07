# Data and Persistence Schema

## Design principle

One canonical question representation powers all study modes.

## QuizSet

```ts
interface QuizSet {
  id: string;
  schemaVersion: number;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  lastStudiedAt?: string;
  tags?: string[];
}
```

## Question

```ts
interface Question {
  id: string;
  setId: string;
  prompt: string;
  answer: string;
  acceptedAnswers: string[];
  wrongChoices: string[];
  explanation?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  source?: {
    type: 'manual' | 'paste-import' | 'file-import' | 'future-ai';
    importedAt?: string;
  };
}
```

## StudySession

```ts
interface StudySession {
  id: string;
  setId: string;
  mode: 'flashcard' | 'multiple-choice' | 'identification' | 'mixed';
  startedAt: string;
  completedAt?: string;
  options: StudyOptions;
  itemIds: string[];
}
```

## StudyAttempt

```ts
interface StudyAttempt {
  id: string;
  sessionId: string;
  questionId: string;
  presentationMode: 'flashcard' | 'multiple-choice' | 'identification';
  response?: string;
  selectedChoice?: string;
  result: 'correct' | 'incorrect' | 'skipped' | 'known' | 'missed';
  answeredAt: string;
}
```

## Preferences

```ts
interface Preferences {
  theme: 'system' | 'light' | 'dark';
  reducedMotion?: boolean;
  defaultShuffleQuestions?: boolean;
  defaultShuffleChoices?: boolean;
}
```

## IndexedDB tables

Recommended:

- `sets`
- `questions`
- `sessions`
- `attempts`
- `preferences`

Indexes should support:

- questions by `setId`
- sessions by `setId`
- sessions by date
- attempts by `sessionId`

## IDs

Use stable unique IDs such as UUIDs.

Do not derive IDs solely from question text.

## Dates

Persist ISO 8601 strings at external/schema boundaries.

## Export schema

Single set export:

```json
{
  "format": "quizeasy-set",
  "schemaVersion": 1,
  "exportedAt": "2026-10-07T00:00:00.000Z",
  "set": {},
  "questions": []
}
```

Full backup:

```json
{
  "format": "quizeasy-backup",
  "schemaVersion": 1,
  "exportedAt": "2026-10-07T00:00:00.000Z",
  "sets": [],
  "questions": [],
  "sessions": [],
  "attempts": [],
  "preferences": {}
}
```

## Validation

All imported JSON must be parsed and validated before writes.

Reject or migrate unsupported versions deliberately.

## Data integrity

Deleting a set should also remove or intentionally retain associated:

- questions
- sessions
- attempts

Choose one documented cascade policy. Recommended MVP behavior: cascade-delete associated study data when a set is deleted after confirmation.

## Duplicate imports

Do not silently deduplicate based only on prompt text.

Possible future option:

> Detect likely duplicates

But MVP should preserve user intent unless the exact same imported object ID collides.

## Future compatibility

Reserve clean extension points for:

- question type metadata
- attachments
- images
- shared/public IDs
- sync metadata
- AI provenance

Do not implement them yet unless required.
