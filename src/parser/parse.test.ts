import { describe, expect, it } from 'vitest';
import { parseQuizText } from './parse';
import { itemStatus } from './types';
import { PARSER_LIMITS } from './limits';

const CANONICAL = `Q: What does CPU stand for?
A: Central Processing Unit
W: Central Program Unit
W: Computer Processing Utility
W: Core Processing Utility
E: The CPU executes instructions.
T: hardware, computer`;

describe('parseQuizText — canonical and simple formats', () => {
  it('parses the simple Q/A form', () => {
    const result = parseQuizText(`Q: What is RAM?
A: Random Access Memory

Q: What is ROM?
A: Read Only Memory`);

    expect(result.errors).toEqual([]);
    expect(result.detectedFormat).toBe('labelled');
    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.prompt).toBe('What is RAM?');
    expect(result.items[0]?.answer).toBe('Random Access Memory');
    expect(result.items[0]?.confidence).toBe('high');
    expect(result.items[1]?.answer).toBe('Read Only Memory');
  });

  it('parses the rich Q/A/W/E/T form', () => {
    const result = parseQuizText(CANONICAL);
    const item = result.items[0];

    expect(result.errors).toEqual([]);
    expect(item?.prompt).toBe('What does CPU stand for?');
    expect(item?.answer).toBe('Central Processing Unit');
    expect(item?.wrongChoices).toEqual([
      'Central Program Unit',
      'Computer Processing Utility',
      'Core Processing Utility',
    ]);
    expect(item?.explanation).toBe('The CPU executes instructions.');
    expect(item?.tags).toEqual(['hardware', 'computer']);
    expect(result.warnings).toEqual([]);
  });

  it('parses multiple A lines as accepted answer variants', () => {
    const result = parseQuizText(`Q: Who wrote Hamlet?
A: William Shakespeare
A: Shakespeare`);

    expect(result.items[0]?.answer).toBe('William Shakespeare');
    expect(result.items[0]?.acceptedAnswers).toEqual(['Shakespeare']);
    expect(result.errors).toEqual([]);
  });

  it('does not require blank lines between labelled entries', () => {
    const result = parseQuizText(`Q: One?
A: 1
Q: Two?
A: 2
Q: Three?
A: 3`);

    expect(result.items).toHaveLength(3);
    expect(result.items.map((item) => item.answer)).toEqual(['1', '2', '3']);
  });

  it('tolerates extra blank lines', () => {
    const result = parseQuizText(`


Q: One?



A: 1


`);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.answer).toBe('1');
  });
});

describe('parseQuizText — label variants', () => {
  it('accepts lowercase labels', () => {
    const result = parseQuizText('q: lower?\na: case\nw: other');
    expect(result.items[0]?.prompt).toBe('lower?');
    expect(result.items[0]?.wrongChoices).toEqual(['other']);
  });

  it('accepts Question: and Answer: with bold Markdown labels', () => {
    const result = parseQuizText(`**Question:** What is HTML?
**Answer:** HyperText Markup Language`);
    expect(result.detectedFormat).toBe('labelled');
    expect(result.items[0]?.prompt).toBe('What is HTML?');
    expect(result.items[0]?.answer).toBe('HyperText Markup Language');
  });

  it('accepts bullet-style labels', () => {
    const result = parseQuizText(`- Q: Bulleted?
- A: Yes`);
    expect(result.items[0]?.prompt).toBe('Bulleted?');
    expect(result.items[0]?.answer).toBe('Yes');
  });

  it('accepts numbering before explicit labels', () => {
    const result = parseQuizText(`1. Q: Numbered label?
2. A: Works`);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.prompt).toBe('Numbered label?');
    expect(result.items[0]?.answer).toBe('Works');
  });

  it('accepts the extended aliases for each field', () => {
    const result = parseQuizText(`Question: Alias test
Answer: First
Wrong: Second
Explanation: Because
Tags: alpha, beta`);

    expect(result.items[0]?.prompt).toBe('Alias test');
    expect(result.items[0]?.answer).toBe('First');
    expect(result.items[0]?.wrongChoices).toEqual(['Second']);
    expect(result.items[0]?.explanation).toBe('Because');
    expect(result.items[0]?.tags).toEqual(['alpha', 'beta']);
  });

  it('does not treat ordinary prose as labels', () => {
    const result = parseQuizText(`Explain the role of the CPU in a computer.
Answers can vary depending on the source.`);
    expect(result.detectedFormat).toBe('unknown');
    expect(result.items).toHaveLength(0);
    expect(result.errors[0]?.code).toBe('unrecognized-format');
  });
});

describe('parseQuizText — multiline content', () => {
  it('joins indented continuation lines into the question', () => {
    const result = parseQuizText(`Q: Which option best describes:
   the role of the CPU?
A: It executes instructions.`);

    expect(result.items[0]?.prompt).toBe(
      'Which option best describes: the role of the CPU?',
    );
    expect(result.items[0]?.answer).toBe('It executes instructions.');
  });

  it('joins continuation lines into the answer', () => {
    const result = parseQuizText(`Q: What are the two main parts?
A: The control unit
and the arithmetic logic unit`);

    expect(result.items[0]?.answer).toBe(
      'The control unit and the arithmetic logic unit',
    );
  });

  it('keeps paragraph breaks inside a field', () => {
    const result = parseQuizText(`Q: Explain caching.
A: First line of the answer.

Second paragraph of the answer.`);

    expect(result.items[0]?.answer).toBe(
      'First line of the answer.\nSecond paragraph of the answer.',
    );
  });

  it('appends continuation text to the most recent wrong choice', () => {
    const result = parseQuizText(`Q: Pick one
A: Right
W: Wrong choice
that keeps going`);
    expect(result.items[0]?.wrongChoices).toEqual([
      'Wrong choice that keeps going',
    ]);
  });
});

describe('parseQuizText — alternative formats', () => {
  it('parses numbered pairs', () => {
    const result = parseQuizText(`1. What is RAM?
Random Access Memory

2. What is CPU?
Central Processing Unit`);

    expect(result.detectedFormat).toBe('numbered-pair');
    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.prompt).toBe('What is RAM?');
    expect(result.items[0]?.answer).toBe('Random Access Memory');
    expect(result.items[1]?.answer).toBe('Central Processing Unit');
    expect(result.items[0]?.confidence).toBe('medium');
    expect(result.errors).toEqual([]);
  });

  it('parses numbered pairs with ) and (1) markers', () => {
    const result = parseQuizText(`1) First?
One
(2) Second?
Two`);
    expect(result.items.map((item) => item.answer)).toEqual(['One', 'Two']);
  });

  it('warns about ambiguous numbered pairs', () => {
    const result = parseQuizText(`1. What is RAM?
What is ROM?`);
    expect(itemStatus(result.items[0]?.issues ?? [])).toBe('warning');
    expect(result.warnings.map((issue) => issue.code)).toContain(
      'ambiguous-numbered-pair',
    );
  });

  it('parses pipe-delimited lines', () => {
    const result = parseQuizText(`What is GPU? | Graphics Processing Unit
What is BIOS? | Basic Input Output System`);

    expect(result.detectedFormat).toBe('pipe');
    expect(result.items).toHaveLength(2);
    expect(result.items[1]?.answer).toBe('Basic Input Output System');
  });

  it('treats extra pipe fields as wrong choices', () => {
    const result = parseQuizText('What is 2 + 2? | 4 | 5 | 6');
    expect(result.items[0]?.answer).toBe('4');
    expect(result.items[0]?.wrongChoices).toEqual(['5', '6']);
  });

  it('ignores pipe lines with a missing side and warns', () => {
    const result = parseQuizText(`| only answer
What is 1 + 1? | 2`);
    expect(result.items).toHaveLength(1);
    expect(result.warnings.map((issue) => issue.code)).toContain(
      'skipped-line',
    );
  });
});

describe('parseQuizText — markdown cleanup', () => {
  it('removes a surrounding code fence', () => {
    const result = parseQuizText('```\nQ: Fenced?\nA: Yes\n```');
    expect(result.items[0]?.prompt).toBe('Fenced?');
    expect(result.items[0]?.answer).toBe('Yes');
  });

  it('removes an unclosed code fence and warns', () => {
    const result = parseQuizText('```text\nQ: Fenced?\nA: Yes');
    expect(result.items[0]?.answer).toBe('Yes');
    expect(result.warnings.map((issue) => issue.code)).toContain(
      'unclosed-code-fence',
    );
  });

  it('strips markdown heading and backtick decoration around labels', () => {
    const result = parseQuizText('## Q: Heading?\n`A: Answer`');
    expect(result.items[0]?.prompt).toBe('Heading?');
    expect(result.items[0]?.answer).toBe('Answer');
  });
});

describe('parseQuizText — malformed input recovery', () => {
  it('reports a missing answer but keeps the other items', () => {
    const result = parseQuizText(`Q: First?
A: One

Q: Second?

Q: Third?
A: Three`);

    expect(result.items).toHaveLength(3);
    expect(itemStatus(result.items[0]?.issues ?? [])).toBe('valid');
    expect(itemStatus(result.items[1]?.issues ?? [])).toBe('invalid');
    expect(result.items[1]?.issues[0]?.code).toBe('missing-answer');
    expect(itemStatus(result.items[2]?.issues ?? [])).toBe('valid');
    expect(result.errors).toHaveLength(1);
  });

  it('reports a missing question', () => {
    const result = parseQuizText('A: Orphan answer');
    expect(result.items[0]?.issues[0]?.code).toBe('missing-question');
    expect(result.items[0]?.lineStart).toBe(1);
  });

  it('reports empty question and answer text', () => {
    const result = parseQuizText('Q:\nA:');
    expect(result.errors.map((issue) => issue.code).sort()).toEqual([
      'empty-answer',
      'empty-question',
    ]);
  });

  it('recovers valid items around a malformed item', () => {
    const result = parseQuizText(`Q: Good one?
A: Yes

Q: Broken one?

Q: Good two?
A: Also yes`);

    expect(result.items).toHaveLength(3);
    const validItems = result.items.filter(
      (item) => itemStatus(item.issues) === 'valid',
    );
    expect(validItems).toHaveLength(2);
  });

  it('returns a clear error for unstructured text', () => {
    const result = parseQuizText('just some notes about biology');
    expect(result.errors[0]?.code).toBe('unrecognized-format');
    expect(result.errors[0]?.message).toMatch(/Q:/);
  });

  it('never invents answers', () => {
    const result = parseQuizText('Q: What is 2 + 2?');
    expect(result.items[0]?.answer).toBe('');
    expect(result.errors[0]?.code).toBe('missing-answer');
  });
});

describe('parseQuizText — warnings', () => {
  it('warns about duplicate wrong choices and removes them', () => {
    const result = parseQuizText(`Q: Duplicate choices?
A: Right
W: Same
W: same
W: other`);
    expect(result.items[0]?.wrongChoices).toEqual(['Same', 'other']);
    expect(result.warnings.map((issue) => issue.code)).toContain(
      'duplicate-wrong-choice',
    );
  });

  it('warns when a wrong choice equals the answer', () => {
    const result = parseQuizText(`Q: Distractor equals answer?
A: Correct
W: correct`);
    expect(result.warnings.map((issue) => issue.code)).toContain(
      'wrong-choice-equals-answer',
    );
  });

  it('warns when there are not enough wrong choices for multiple choice', () => {
    const result = parseQuizText(`Q: Only one distractor?
A: Right
W: Wrong`);
    expect(result.warnings.map((issue) => issue.code)).toContain(
      'insufficient-choices',
    );
  });

  it('warns about likely duplicate questions', () => {
    const result = parseQuizText(`Q: What is RAM?
A: Random Access Memory
Q: what is ram
A: Random access memory.`);
    expect(result.warnings.map((issue) => issue.code)).toContain(
      'duplicate-question',
    );
    expect(result.items).toHaveLength(2);
  });

  it('warns about duplicate tags', () => {
    const result = parseQuizText('Q: Tags?\nA: Yes\nT: memory, memory, cpu');
    expect(result.items[0]?.tags).toEqual(['memory', 'cpu']);
    expect(result.warnings.map((issue) => issue.code)).toContain(
      'duplicate-tag',
    );
  });

  it('warns about very long fields', () => {
    const longQuestion = `Q: ${'a'.repeat(PARSER_LIMITS.suspiciousFieldChars + 10)}?\nA: Short`;
    const result = parseQuizText(longQuestion);
    expect(result.warnings.map((issue) => issue.code)).toContain('long-field');
  });
});

describe('parseQuizText — line endings, unicode, and limits', () => {
  it('handles Windows line endings', () => {
    const result = parseQuizText('Q: CRLF?\r\nA: Yes\r\n');
    expect(result.items[0]?.prompt).toBe('CRLF?');
    expect(result.items[0]?.answer).toBe('Yes');
  });

  it('handles mixed line endings', () => {
    const result = parseQuizText('Q: Mixed?\r\nA: Yes\nQ: Again?\rA: Sure');
    expect(result.items).toHaveLength(2);
    expect(result.items[1]?.answer).toBe('Sure');
  });

  it('keeps emoji and unicode text intact', () => {
    const result = parseQuizText('Q: What is 🧠?\nA: Brain — 脳');
    expect(result.items[0]?.prompt).toBe('What is 🧠?');
    expect(result.items[0]?.answer).toBe('Brain — 脳');
  });

  it('parses non-English text', () => {
    const result = parseQuizText(
      'Q: ¿Qué es una célula?\nA: La unidad básica de la vida',
    );
    expect(result.items[0]?.answer).toBe('La unidad básica de la vida');
  });

  it('records the source line range for each item', () => {
    const result = parseQuizText('Q: One?\nA: 1\n\nQ: Two?\nA: 2');
    expect(result.items[0]?.lineStart).toBe(1);
    expect(result.items[0]?.lineEnd).toBe(2);
    expect(result.items[1]?.lineStart).toBe(4);
  });

  it('rejects pastes over the size limit', () => {
    const result = parseQuizText('a'.repeat(PARSER_LIMITS.maxSourceChars + 1));
    expect(result.errors[0]?.code).toBe('source-too-large');
    expect(result.truncated).toBe(true);
  });

  it('stops after the item limit instead of hanging', () => {
    const lines: string[] = [];
    for (let index = 0; index < PARSER_LIMITS.maxItems + 40; index += 1) {
      lines.push(`Q: Question ${index}?`, `A: Answer ${index}`);
    }
    const result = parseQuizText(lines.join('\n'));
    expect(result.items).toHaveLength(PARSER_LIMITS.maxItems);
    expect(result.truncated).toBe(true);
    expect(result.errors.map((issue) => issue.code)).toContain(
      'too-many-items',
    );
  });

  it('handles a large input without losing items', () => {
    const lines: string[] = [];
    for (let index = 0; index < 2000; index += 1) {
      lines.push(`Q: Question ${index}?`, `A: Answer ${index}`, '');
    }
    const startedAt = Date.now();
    const result = parseQuizText(lines.join('\n'));
    const elapsed = Date.now() - startedAt;
    expect(result.items).toHaveLength(2000);
    expect(elapsed).toBeLessThan(2000);
  });

  it('does not execute HTML-like text', () => {
    const result = parseQuizText(
      'Q: <script>alert(1)</script>?\nA: <img src=x>',
    );
    expect(result.items[0]?.prompt).toBe('<script>alert(1)</script>?');
    expect(result.items[0]?.answer).toBe('<img src=x>');
  });
});
