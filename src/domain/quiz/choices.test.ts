import { describe, expect, it } from 'vitest';
import { buildChoices, checkChoiceAvailability } from './choices';
import { makeQuestion } from '@/test/factories';
import { createRng } from '@/lib/rng';
import { answerKey } from './normalize';

const rng = () => createRng('test-seed');

describe('buildChoices', () => {
  it('uses explicit wrong choices first', () => {
    const question = makeQuestion({
      answer: 'Central Processing Unit',
      wrongChoices: [
        'Central Program Unit',
        'Computer Processing Utility',
        'Core Processing Utility',
      ],
    });
    const result = buildChoices(question, [question], {
      rng: rng(),
      shuffle: false,
    });

    expect(result.status).toBe('ok');
    expect(result.explicitDistractors).toBe(3);
    expect(result.poolDistractors).toBe(0);
    expect(result.choices).toHaveLength(4);
    expect(result.choices[result.correctIndex]).toBe('Central Processing Unit');
  });

  it('falls back to answers from other questions in the set', () => {
    const question = makeQuestion({
      id: 'q1',
      prompt: 'What is RAM?',
      answer: 'Random Access Memory',
    });
    const pool = [
      question,
      makeQuestion({ id: 'q2', answer: 'Read Only Memory', tags: ['memory'] }),
      makeQuestion({ id: 'q3', answer: 'Central Processing Unit' }),
      makeQuestion({ id: 'q4', answer: 'Graphics Processing Unit' }),
    ];

    const result = buildChoices(question, pool, { rng: rng(), shuffle: false });

    expect(result.status).toBe('ok');
    expect(result.poolDistractors).toBe(3);
    expect(result.choices[0]).toBe('Random Access Memory');
    expect(result.choices).toHaveLength(4);
  });

  it('prefers distractors from questions with matching tags', () => {
    const question = makeQuestion({
      id: 'q1',
      answer: 'Random Access Memory',
      tags: ['memory'],
    });
    const pool = [
      question,
      makeQuestion({
        id: 'q2',
        answer: 'Far away answer',
        tags: ['networking'],
      }),
      makeQuestion({ id: 'q3', answer: 'Near answer', tags: ['memory'] }),
    ];
    const result = buildChoices(question, pool, { rng: rng(), shuffle: false });
    expect(result.choices[1]).toBe('Near answer');
  });

  it('never repeats the correct answer', () => {
    const question = makeQuestion({
      answer: 'Central Processing Unit',
      wrongChoices: ['central processing unit', 'Central Processing Unit.'],
    });
    const result = buildChoices(question, [question], {
      rng: rng(),
      shuffle: false,
      minDistractors: 0,
    });

    const keys = result.choices.map(answerKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(
      keys.filter((key) => key === answerKey('Central Processing Unit')),
    ).toHaveLength(1);
  });

  it('never repeats the correct answer when other questions share the answer', () => {
    const question = makeQuestion({ id: 'q1', answer: '4' });
    const pool = [
      question,
      makeQuestion({ id: 'q2', prompt: 'Two plus two?', answer: '4' }),
      makeQuestion({ id: 'q3', answer: '5' }),
      makeQuestion({ id: 'q4', answer: '6' }),
    ];
    const result = buildChoices(question, pool, { rng: rng(), shuffle: false });
    expect(
      result.choices.filter((choice) => answerKey(choice) === '4'),
    ).toHaveLength(1);
  });

  it('excludes accepted answers from the distractors', () => {
    const question = makeQuestion({
      answer: 'William Shakespeare',
      acceptedAnswers: ['Shakespeare'],
    });
    const pool = [
      question,
      makeQuestion({ id: 'q2', answer: 'Shakespeare' }),
      makeQuestion({ id: 'q3', answer: 'Charles Dickens' }),
      makeQuestion({ id: 'q4', answer: 'Jane Austen' }),
    ];
    const result = buildChoices(question, pool, { rng: rng(), shuffle: false });
    expect(result.status).toBe('ok');
    expect(result.choices.map(answerKey)).not.toContain('shakespeare');
    expect(result.choices.map(answerKey)).toContain('charles dickens');
  });

  it('deduplicates case-insensitive duplicate distractors', () => {
    const question = makeQuestion({
      answer: 'Right',
      wrongChoices: ['Same', 'same', 'SAME', 'Different'],
    });
    const result = buildChoices(question, [question], {
      rng: rng(),
      shuffle: false,
    });
    expect(result.choices).toHaveLength(3);
    expect(result.choices.slice(1)).toEqual(['Same', 'Different']);
  });

  it('reports insufficient distractors instead of inventing them', () => {
    const question = makeQuestion({ answer: 'Only answer', wrongChoices: [] });
    const result = buildChoices(question, [question], {
      rng: rng(),
      shuffle: false,
    });

    expect(result.status).toBe('insufficient');
    expect(result.choices).toHaveLength(0);
    expect(result.reason).toMatch(/No wrong choices/);
  });

  it('reports insufficient distractors when only one is available', () => {
    const question = makeQuestion({ answer: 'A', wrongChoices: ['B'] });
    const result = buildChoices(question, [question], {
      rng: rng(),
      shuffle: false,
    });
    expect(result.status).toBe('insufficient');
    expect(result.reason).toMatch(/Only 1 wrong choice/);
  });

  it('reduces the choice count when fewer distractors exist', () => {
    const question = makeQuestion({ answer: 'A', wrongChoices: ['B', 'C'] });
    const result = buildChoices(question, [question], {
      rng: rng(),
      shuffle: false,
    });
    expect(result.status).toBe('ok');
    expect(result.choices).toHaveLength(3);
    expect(result.reduced).toBe(true);
  });

  it('ignores very long answers from the pool as distractors', () => {
    const question = makeQuestion({ id: 'q1', answer: 'Short' });
    const pool = [
      question,
      makeQuestion({ id: 'q2', answer: 'x'.repeat(200) }),
      makeQuestion({ id: 'q3', answer: 'Also short' }),
      makeQuestion({ id: 'q4', answer: 'Another short' }),
    ];
    const result = buildChoices(question, pool, { rng: rng(), shuffle: false });
    expect(result.choices.some((choice) => choice.length > 100)).toBe(false);
  });

  it('is deterministic for the same seed', () => {
    const question = makeQuestion({
      answer: 'Right',
      wrongChoices: ['One', 'Two', 'Three', 'Four'],
    });
    const first = buildChoices(question, [question], {
      rng: createRng('abc'),
      shuffle: true,
    });
    const second = buildChoices(question, [question], {
      rng: createRng('abc'),
      shuffle: true,
    });
    expect(first.choices).toEqual(second.choices);
    expect(first.correctIndex).toBe(second.correctIndex);
  });

  it('keeps the correct index aligned after shuffling', () => {
    const question = makeQuestion({
      answer: 'Right',
      wrongChoices: ['One', 'Two', 'Three'],
    });
    for (let seedIndex = 0; seedIndex < 20; seedIndex += 1) {
      const result = buildChoices(question, [question], {
        rng: createRng(`seed-${seedIndex}`),
        shuffle: true,
      });
      expect(result.choices[result.correctIndex]).toBe('Right');
      expect(new Set(result.choices).size).toBe(result.choices.length);
    }
  });
});

describe('checkChoiceAvailability', () => {
  it('accepts a question with three explicit distractors', () => {
    const question = makeQuestion({ wrongChoices: ['a', 'b', 'c'] });
    expect(checkChoiceAvailability(question, [question]).ok).toBe(true);
  });

  it('accepts a question with pool fallback distractors', () => {
    const question = makeQuestion({ id: 'q1', answer: 'A' });
    const pool = [
      question,
      makeQuestion({ id: 'q2', answer: 'B' }),
      makeQuestion({ id: 'q3', answer: 'C' }),
    ];
    expect(checkChoiceAvailability(question, pool).ok).toBe(true);
  });

  it('rejects a question with no available distractors', () => {
    const question = makeQuestion({ id: 'q1', answer: 'A' });
    const availability = checkChoiceAvailability(question, [question]);
    expect(availability.ok).toBe(false);
    expect(availability.reason).toBeTruthy();
  });
});
