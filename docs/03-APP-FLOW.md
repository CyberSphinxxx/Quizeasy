# App Flow and Information Architecture

## Primary navigation

Recommended mobile navigation:

- Home / Library
- Import
- Study
- Guide
- Settings

On desktop, use a left sidebar or equivalent.

Avoid overcrowding the primary navigation.

## First launch

```text
Welcome
  ↓
Library empty state
  ├─ Paste questions
  ├─ Create manually
  └─ See AI guide
```

Best primary CTA:

> Paste questions

## Import flow

```text
Import
  ↓
Paste text
  ↓
Parse automatically
  ↓
Import preview
  ├─ Valid items
  ├─ Warnings
  └─ Invalid items
  ↓
User fixes/excludes issues
  ↓
Choose title/details
  ↓
Save set
  ↓
Set detail
  ↓
Start studying
```

The user should never lose the original pasted text unexpectedly.

## Library flow

```text
Library
  ↓
Select set
  ↓
Set detail
  ├─ Study
  ├─ Edit questions
  ├─ Import more
  ├─ Export
  ├─ Duplicate
  └─ Delete
```

## Study flow

```text
Set detail
  ↓
Study
  ↓
Choose mode
  ↓
Configure
  ↓
Session
  ↓
Results
  ├─ Retry mistakes
  ├─ Review answers
  ├─ Study again
  └─ Return to set
```

## Flashcard flow

```text
Prompt
  ↓
Reveal
  ↓
Known / Missed
  ↓
Next
```

Optional keyboard:

- Space: reveal
- 1 or left action: missed
- 2 or right action: known
- Arrow keys: navigate when appropriate

## Multiple-choice flow

### Study mode

```text
Question
  ↓
Choose answer
  ↓
Immediate correctness + explanation
  ↓
Next
```

### Test mode

```text
Question
  ↓
Choose answer
  ↓
Next
  ↓
Results after final question
```

## Identification flow

```text
Question
  ↓
Type answer
  ↓
Submit
  ↓
Feedback
```

In test mode, feedback may be delayed.

## Mixed mode

Mixed mode chooses among eligible modes.

Do not force identification for questions whose answer structure makes free-response inappropriate.

## Edit question flow

Fields:

- Question
- Correct answer
- Accepted answers
- Wrong choices
- Explanation
- Tags

Advanced fields can be collapsed to keep the form simple.

## Delete flow

For a question:

- provide undo where practical

For an entire set:

- explicit confirmation

## Backup flow

```text
Settings
  ↓
Data
  ├─ Export all
  ├─ Restore backup
  └─ Clear all data
```

Clear-all requires strong confirmation.

## AI guide flow

```text
Guide
  ↓
Choose prompt
  ├─ Simple Q&A
  └─ MCQ-ready
  ↓
Copy
  ↓
Use preferred AI externally
  ↓
Paste result into Quizeasy
```

Do not imply that external AI output is guaranteed accurate.
