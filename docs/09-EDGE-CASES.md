# Edge Cases

## Import

- Pasted content has no recognizable structure.
- One question has no answer.
- One malformed question sits between valid questions.
- User pastes 5,000 questions.
- Very long question text.
- Very long explanation.
- Duplicate questions.
- Duplicate answer choices.
- Wrong choice equals correct answer.
- Same answer belongs to many questions.
- Markdown formatting from AI.
- Code fences.
- Bullet points.
- Numbering resets.
- Mixed Q/A and numbered formats.
- CRLF and LF line endings.
- Unicode and emoji.
- Non-English text.
- HTML-like text should display as text, not execute.
- User closes/navigates during unsaved import.

## Library

- No sets.
- Hundreds of sets.
- Duplicate set titles.
- Empty set.
- Deleted set currently referenced by route.
- Corrupted stored item.
- IndexedDB unavailable.
- Storage quota exceeded.

## Flashcards

- One-card set.
- Empty answer.
- Very long prompt.
- Rapid repeated clicking.
- Browser back during session.
- Reload mid-session.

## Multiple choice

- only correct answer exists
- one explicit wrong answer
- duplicate distractors
- fallback answers identical after normalization
- correct answer accidentally appears in fallback
- all questions share same answer
- insufficient eligible questions
- fewer requested questions than available
- more requested questions than eligible
- choice text extremely long

The app must not create fake nonsense distractors silently.

## Identification

- different capitalization
- extra whitespace
- multiline answers
- multiple accepted answers
- punctuation matters
- answer is a number
- answer contains symbols
- accidental trailing period

Matching should be forgiving but not dangerously permissive.

## Mixed mode

- some questions only support flashcard
- some support MCQ
- some support identification
- mode distribution becomes unbalanced
- very small set

## Results

- user skips everything
- session interrupted
- retry mistakes when there were no mistakes
- retry mistakes after source question was edited/deleted

## Export/import

- unsupported schema version
- invalid JSON
- correct JSON but wrong Quizeasy format
- duplicate imported IDs
- import into existing library with colliding IDs
- backup file huge
- browser cancels file picker

Prefer remapping colliding IDs rather than overwriting unrelated local data.

## PWA

- first visit offline
- update available while studying
- stale cached shell
- storage cleared by browser
- private/incognito limitations

## Future AI

- invalid API key
- rate limit
- model unavailable
- malformed model output
- provider changes API
- AI produces inaccurate answer
- user pastes secret into prompt

These are future concerns, not MVP blockers.
