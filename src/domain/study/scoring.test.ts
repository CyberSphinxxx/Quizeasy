import { describe, expect, it } from 'vitest';
import { classifyResult, summarizeSession } from './scoring';
import { makeAttempt, makePlanItem } from '@/test/factories';

const plan = [
  makePlanItem({ questionId: 'q1', presentationMode: 'flashcard' }),
  makePlanItem({ questionId: 'q2', presentationMode: 'multiple-choice' }),
  makePlanItem({ questionId: 'q3', presentationMode: 'identification' }),
  makePlanItem({ questionId: 'q4', presentationMode: 'flashcard' }),
];

describe('classifyResult', () => {
  it('treats known and correct as correct', () => {
    expect(classifyResult('known')).toBe('correct');
    expect(classifyResult('correct')).toBe('correct');
  });

  it('treats missed and incorrect as incorrect', () => {
    expect(classifyResult('missed')).toBe('incorrect');
    expect(classifyResult('incorrect')).toBe('incorrect');
  });

  it('treats skipped and unanswered as skipped', () => {
    expect(classifyResult('skipped')).toBe('skipped');
    expect(classifyResult(undefined)).toBe('skipped');
  });
});

describe('summarizeSession', () => {
  it('counts correct, incorrect, and unanswered items', () => {
    const summary = summarizeSession(plan, [
      makeAttempt({ questionId: 'q1', result: 'known' }),
      makeAttempt({ questionId: 'q2', result: 'incorrect' }),
      makeAttempt({ questionId: 'q3', result: 'correct' }),
    ]);

    expect(summary.totalItems).toBe(4);
    expect(summary.correct).toBe(2);
    expect(summary.incorrect).toBe(1);
    expect(summary.skipped).toBe(1);
    expect(summary.percentage).toBe(50);
    expect(summary.missedQuestionIds).toEqual(['q2', 'q4']);
  });

  it('handles a session where everything was skipped', () => {
    const summary = summarizeSession(plan, []);
    expect(summary.percentage).toBe(0);
    expect(summary.skipped).toBe(4);
    expect(summary.missedQuestionIds).toHaveLength(4);
  });

  it('handles a perfect session with no mistakes to retry', () => {
    const summary = summarizeSession(plan, [
      makeAttempt({ questionId: 'q1', result: 'known' }),
      makeAttempt({ questionId: 'q2', result: 'correct' }),
      makeAttempt({ questionId: 'q3', result: 'correct' }),
      makeAttempt({ questionId: 'q4', result: 'known' }),
    ]);
    expect(summary.percentage).toBe(100);
    expect(summary.missedQuestionIds).toEqual([]);
    expect(summary.missedItems).toEqual([]);
  });

  it('counts a deliberate skip attempt', () => {
    const summary = summarizeSession(plan, [
      makeAttempt({ questionId: 'q1', result: 'skipped' }),
    ]);
    expect(summary.answered).toBe(1);
    expect(summary.skipped).toBe(4);
  });

  it('uses the latest attempt when a question was answered twice', () => {
    const summary = summarizeSession(plan, [
      makeAttempt({
        questionId: 'q1',
        result: 'incorrect',
        answeredAt: '2026-01-01T00:00:00.000Z',
      }),
      makeAttempt({
        questionId: 'q1',
        result: 'known',
        answeredAt: '2026-01-01T00:01:00.000Z',
      }),
    ]);
    expect(summary.correct).toBe(1);
    expect(summary.incorrect).toBe(0);
  });

  it('breaks the score down by presentation mode', () => {
    const summary = summarizeSession(plan, [
      makeAttempt({
        questionId: 'q1',
        presentationMode: 'flashcard',
        result: 'known',
      }),
      makeAttempt({
        questionId: 'q2',
        presentationMode: 'multiple-choice',
        result: 'incorrect',
      }),
    ]);
    expect(summary.byMode.flashcard).toEqual({ total: 2, correct: 1 });
    expect(summary.byMode['multiple-choice']).toEqual({ total: 1, correct: 0 });
    expect(summary.byMode.identification).toEqual({ total: 1, correct: 0 });
  });

  it('handles an empty plan', () => {
    const summary = summarizeSession([], []);
    expect(summary.totalItems).toBe(0);
    expect(summary.percentage).toBe(0);
  });
});
