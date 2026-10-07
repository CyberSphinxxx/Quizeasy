# Future AI Integration Architecture

## MVP stance

Quizeasy does not need built-in AI to be useful.

MVP workflow:

```text
Study material
  ↓
User's preferred external AI
  ↓
Quizeasy-formatted text
  ↓
Paste into Quizeasy
```

This keeps:

- hosting simple
- cost near zero
- privacy clearer
- the app provider-neutral

## AI Guide prompts

Provide at least:

### Simple Q&A prompt

Produces:

```text
Q:
A:
```

### Rich/MCQ-ready prompt

Produces:

```text
Q:
A:
W:
W:
W:
E:
T:
```

Require AI to output only the requested format where practical.

## Future provider interface

Conceptually:

```ts
interface AIProvider {
  id: string;
  name: string;
  generateQuestions(
    input: GenerateQuestionsInput,
  ): Promise<GeneratedQuestion[]>;
  generateDistractors?(input: GenerateDistractorsInput): Promise<string[]>;
  explainAnswer?(input: ExplainAnswerInput): Promise<string>;
}
```

Potential adapters:

- OpenAI
- Gemini
- Anthropic
- OpenRouter
- custom OpenAI-compatible endpoint

## BYOK

Future settings might allow:

```text
Provider
API Key
Model
Base URL (custom provider only)
```

## Important browser limitation

API keys stored or used in a browser client cannot be considered perfectly secret from the device/user/browser environment.

Do not present browser storage as secure secret storage.

Possible strategies:

1. session-only key
2. local persistent key with explicit warning
3. optional self-hosted proxy
4. future desktop shell such as Tauri with OS credential storage

## Provider abstraction

Core study/import code must not depend directly on an AI vendor SDK.

AI should be additive.

If AI is disabled, every existing Quizeasy feature should still work.

## Structured output

Prefer provider outputs validated against Quizeasy schemas.

Never persist raw provider output as trusted data without validation.

## Failure behavior

If AI fails:

- preserve user input
- show actionable error
- allow retry
- never delete manually entered content

## Cost control

Future BYOK can expose:

- estimated item count
- user-selected model
- optional maximum questions
- optional token/size warning

## Privacy

Before sending content to an external model, clearly state that content will be sent to the selected provider.

Never silently send local study material to AI.
