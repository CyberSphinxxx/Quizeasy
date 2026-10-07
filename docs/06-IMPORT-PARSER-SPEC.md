# Import Parser Specification

## Goal

The parser is a defining Quizeasy feature.

It should be forgiving enough for normal student text while remaining predictable and safe.

## Output

```ts
interface ParseResult {
  items: ParsedQuestion[];
  warnings: ParseIssue[];
  errors: ParseIssue[];
  detectedFormat: string;
  sourceText: string;
}
```

Each parsed item should preserve enough source location information for preview/error highlighting.

## Canonical explicit format

```text
Q: What does CPU stand for?
A: Central Processing Unit
W: Central Program Unit
W: Computer Processing Utility
W: Core Processing Utility
E: The CPU executes instructions and processes data.
T: hardware, computer
```

Rules:

- `Q:` starts a question.
- `A:` is the correct answer.
- `W:` adds a wrong choice.
- `E:` adds explanation.
- `T:` adds comma-separated tags.
- Q and A are required.
- Additional supported aliases may be accepted case-insensitively.

## Simple format

```text
Q: What is RAM?
A: Random Access Memory

Q: What is ROM?
A: Read Only Memory
```

## Numbered pair format

```text
1. What is RAM?
Random Access Memory

2. What is CPU?
Central Processing Unit
```

This format is inherently more ambiguous. Parser should attach lower confidence if detection is uncertain.

## Label format

```text
Question: What is HTML?
Answer: HyperText Markup Language
```

Allow reasonable variants:

- Question
- Q
- Answer
- A
- Wrong
- Choice
- Explanation
- Tags

Avoid accepting so many aliases that ordinary prose is accidentally parsed.

## Pipe format

```text
What is GPU? | Graphics Processing Unit
```

Only parse lines with exactly or safely interpretable delimiters.

## Blank lines

Treat blank lines as optional separators.

Do not require blank lines between entries when explicit `Q:` labels are present.

## Multiline content

Support multiline question/answer text where possible.

Example:

```text
Q: Which option best describes:
   the role of the CPU?
A: It executes instructions.
```

Continuation lines should belong to the most recent active field until a recognized field marker begins.

## Markdown cleanup

Safely normalize common AI output:

```text
**Q:** ...
**A:** ...
```

Also tolerate:

```text
- Q:
- A:
```

Do not strip meaningful content unnecessarily.

## Code fences

If the entire paste is inside Markdown fences, remove only the outer fence.

## Numbering

Normalize leading numbering before explicit labels:

```text
1. Q: ...
2. Q: ...
```

## Validation

Per item:

### Error

- missing question
- missing answer
- empty question
- empty answer

### Warning

- duplicate wrong choice
- wrong choice equals answer
- duplicate tags
- suspiciously long field
- likely duplicate question
- insufficient MCQ choices
- ambiguous numbered-pair parse

Warnings should not necessarily block import.

## Import preview

Every item should have a status:

- valid
- warning
- invalid

Users can edit items before saving.

## Parser confidence

Optional useful field:

```ts
confidence: 'high' | 'medium' | 'low';
```

Explicit Q/A format should be high confidence.

## Never invent content

The parser does not generate answers or distractors.

It only interprets pasted text.

## Limits

Add reasonable limits to avoid browser abuse, for example:

- maximum paste size
- maximum questions per import
- maximum field length

Choose generous student-friendly limits and show clear errors.

## Test matrix

Must include:

- canonical Q/A
- Q/A/W/E/T
- lowercase labels
- bold Markdown labels
- numbered pairs
- pipe format
- missing answer
- missing question
- extra blank lines
- no blank lines
- multiline question
- multiline answer
- duplicate distractors
- distractor same as answer
- code fences
- Windows line endings
- mixed line endings
- emoji/unicode
- non-English text
- very long input
- malformed item between valid items

Parser must recover valid later items where safe rather than aborting the entire import.
