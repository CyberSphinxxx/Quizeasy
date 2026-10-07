# User-Facing AI Guide Prompts

These prompts are content candidates for the Quizeasy Guide page.

## Prompt A — Simple Q&A

```text
Convert the study material I provide into a clean Quizeasy question-and-answer set.

Return ONLY the questions in this exact format:

Q: [question]
A: [correct answer]

Q: [question]
A: [correct answer]

Requirements:
- Cover the most important ideas in the material.
- Keep each question clear and specific.
- Keep answers concise but complete.
- Do not create duplicate questions.
- Preserve important terminology.
- Do not add introductions, conclusions, Markdown tables, or commentary.
- If the source does not contain enough information to answer something confidently, do not invent an answer.
```

## Prompt B — MCQ-ready

```text
Convert the study material I provide into a Quizeasy question set.

Return ONLY the questions in this exact format:

Q: [question]
A: [correct answer]
W: [plausible wrong answer]
W: [plausible wrong answer]
W: [plausible wrong answer]
E: [short explanation]
T: [comma-separated tags]

Requirements:
- Cover the most important ideas from the source.
- Make every question unambiguous.
- Keep the correct answer concise.
- Wrong answers must be plausible but clearly incorrect according to the source.
- Never repeat the correct answer as a wrong answer.
- Do not duplicate questions.
- Explanations should be short and useful for studying.
- Tags should describe the topic, not difficulty.
- Do not add question numbers.
- Do not add Markdown tables.
- Do not add commentary before or after the set.
- Do not invent facts that are not supported by the provided material.
```

## Guide warning

Suggested UI note:

> AI can make mistakes. Review important facts before relying on generated questions for an exam.
