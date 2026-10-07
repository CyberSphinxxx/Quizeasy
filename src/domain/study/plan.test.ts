import { describe, expect, it } from 'vitest';
import { buildRetryPlan, generateSessionPlan } from './plan';
import { makeOptions, makeQuestion, makeQuestionBank } from '@/test/factories';
import { answerKey } from '@/domain/quiz/normalize';

describe('generateSessionPlan', () => {
  it('includes every question for flashcards', () => {
    const questions = makeQuestionBank(5);
    const plan = generateSessionPlan({
      questions,
      options: makeOptions({ mode: 'flashcard' }),
      seed: 'seed',
    });
    expect(plan.items).toHaveLength(5);
    expect(plan.excluded).toEqual([]);
    expect(
      plan.items.every((item) => item.presentationMode === 'flashcard'),
    ).toBe(true);
  });

  it('is deterministic for the same seed and input', () => {
    const questions = makeQuestionBank(10);
    const options = makeOptions({ mode: 'flashcard', shuffleQuestions: true });
    const first = generateSessionPlan({ questions, options, seed: 'abc' });
    const second = generateSessionPlan({ questions, options, seed: 'abc' });
    expect(first.items.map((item) => item.questionId)).toEqual(
      second.items.map((item) => item.questionId),
    );
  });

  it('produces a different order for a different seed', () => {
    const questions = makeQuestionBank(20);
    const options = makeOptions({ mode: 'flashcard', shuffleQuestions: true });
    const first = generateSessionPlan({ questions, options, seed: 'one' });
    const second = generateSessionPlan({ questions, options, seed: 'two' });
    expect(first.items.map((item) => item.questionId)).not.toEqual(
      second.items.map((item) => item.questionId),
    );
  });

  it('applies the question limit after shuffling', () => {
    const questions = makeQuestionBank(10);
    const plan = generateSessionPlan({
      questions,
      options: makeOptions({ questionLimit: 4, shuffleQuestions: true }),
      seed: 'limit',
    });
    expect(plan.items).toHaveLength(4);
  });

  it('caps the limit at the number of available questions', () => {
    const questions = makeQuestionBank(3);
    const plan = generateSessionPlan({
      questions,
      options: makeOptions({ questionLimit: 50, shuffleQuestions: false }),
      seed: 'limit',
    });
    expect(plan.items).toHaveLength(3);
  });

  it('keeps the set order when shuffling is off', () => {
    const questions = makeQuestionBank(4);
    const plan = generateSessionPlan({
      questions,
      options: makeOptions({ questionLimit: 2, shuffleQuestions: false }),
      seed: 'order',
    });
    expect(plan.items.map((item) => item.questionId)).toEqual(['q-1', 'q-2']);
  });

  it('filters by tags', () => {
    const questions = [
      makeQuestion({ id: 'q1', tags: ['memory'] }),
      makeQuestion({ id: 'q2', tags: ['hardware'] }),
      makeQuestion({ id: 'q3', tags: ['memory'] }),
    ];
    const plan = generateSessionPlan({
      questions,
      options: makeOptions({ tags: ['memory'] }),
      seed: 'tags',
    });
    expect(plan.items.map((item) => item.questionId)).toEqual(['q1', 'q3']);
  });

  it('builds multiple-choice items with choices and a correct index', () => {
    const questions = makeQuestionBank(5);
    const plan = generateSessionPlan({
      questions,
      pool: questions,
      options: makeOptions({ mode: 'multiple-choice', shuffleChoices: true }),
      seed: 'mcq',
    });

    expect(plan.items).toHaveLength(5);
    for (const item of plan.items) {
      expect(item.choices).toHaveLength(4);
      expect(item.correctChoiceIndex).toBeGreaterThanOrEqual(0);
      const choices = item.choices ?? [];
      const correct = choices[item.correctChoiceIndex ?? 0];
      expect(correct).toBeTruthy();
      const keys = choices.map(answerKey);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('excludes multiple-choice questions without enough distractors', () => {
    const questions = [
      makeQuestion({ id: 'q1', prompt: 'Only?', answer: 'Answer' }),
    ];
    const plan = generateSessionPlan({
      questions,
      pool: questions,
      options: makeOptions({ mode: 'multiple-choice' }),
      seed: 'mcq-na',
    });

    expect(plan.items).toHaveLength(0);
    expect(plan.excluded).toHaveLength(1);
    expect(plan.excluded[0]?.reason).toMatch(/distractor|wrong choice/i);
  });

  it('excludes identification questions with very long answers', () => {
    const questions = [
      makeQuestion({
        id: 'q1',
        prompt: 'Define everything',
        answer: 'word '.repeat(40),
      }),
      makeQuestion({ id: 'q2', prompt: 'Short?', answer: 'Yes' }),
    ];
    const plan = generateSessionPlan({
      questions,
      options: makeOptions({ mode: 'identification' }),
      seed: 'id',
    });

    expect(plan.items.map((item) => item.questionId)).toEqual(['q2']);
    expect(plan.excluded[0]?.reason).toMatch(/hard to type/i);
  });

  it('balances mixed mode across eligible modes', () => {
    const questions = makeQuestionBank(6);
    const plan = generateSessionPlan({
      questions,
      pool: questions,
      options: makeOptions({ mode: 'mixed' }),
      seed: 'mixed',
    });

    const counts = { flashcard: 0, 'multiple-choice': 0, identification: 0 };
    for (const item of plan.items) {
      counts[item.presentationMode] += 1;
    }
    expect(plan.items).toHaveLength(6);
    expect(counts.flashcard).toBe(2);
    expect(counts['multiple-choice']).toBe(2);
    expect(counts.identification).toBe(2);
  });

  it('falls back to a flashcard when a mixed mode question cannot build choices', () => {
    const questions = [
      makeQuestion({ id: 'q1', prompt: 'P1', answer: 'A' }),
      makeQuestion({ id: 'q2', prompt: 'P2', answer: 'B' }),
    ];
    const plan = generateSessionPlan({
      questions,
      pool: questions,
      options: makeOptions({ mode: 'mixed' }),
      seed: 'mixed-fallback',
    });
    // With only two questions and two answers, multiple choice is impossible
    // but every question still appears in a supported mode.
    expect(plan.items).toHaveLength(2);
    expect(
      plan.items.every((item) => item.presentationMode !== 'multiple-choice'),
    ).toBe(true);
  });

  it('handles an empty set without crashing', () => {
    const plan = generateSessionPlan({
      questions: [],
      options: makeOptions(),
      seed: 'empty',
    });
    expect(plan.items).toEqual([]);
    expect(plan.excluded).toEqual([]);
  });
});

describe('buildRetryPlan', () => {
  it('reuses the original presentation for missed questions', () => {
    const questions = makeQuestionBank(3);
    const options = makeOptions({
      mode: 'multiple-choice',
      shuffleChoices: false,
    });
    const original = generateSessionPlan({
      questions,
      pool: questions,
      options,
      seed: 'retry',
    });

    const retry = buildRetryPlan({
      originItems: original.items,
      missedQuestionIds: ['q-2'],
      availableQuestionIds: questions.map((question) => question.id),
      options: { ...options, mode: 'mixed' },
      seed: 'retry-2',
    });

    expect(retry.items).toHaveLength(1);
    expect(retry.items[0]?.questionId).toBe('q-2');
    expect(retry.items[0]?.choices).toEqual(original.items[1]?.choices);
    expect(retry.items[0]?.correctChoiceIndex).toBe(
      original.items[1]?.correctChoiceIndex,
    );
  });

  it('drops questions that were deleted since the session', () => {
    const questions = makeQuestionBank(3);
    const original = generateSessionPlan({
      questions,
      options: makeOptions(),
      seed: 'deleted',
    });
    const retry = buildRetryPlan({
      originItems: original.items,
      missedQuestionIds: ['q-1', 'q-3'],
      availableQuestionIds: ['q-3'],
      options: makeOptions(),
      seed: 'deleted-2',
    });
    expect(retry.items.map((item) => item.questionId)).toEqual(['q-3']);
  });

  it('returns nothing when there were no mistakes', () => {
    const questions = makeQuestionBank(2);
    const original = generateSessionPlan({
      questions,
      options: makeOptions(),
      seed: 'none',
    });
    const retry = buildRetryPlan({
      originItems: original.items,
      missedQuestionIds: [],
      availableQuestionIds: questions.map((question) => question.id),
      options: makeOptions(),
      seed: 'none-2',
    });
    expect(retry.items).toEqual([]);
  });
});
