import { SCHEMA_VERSION } from '@/domain/constants';
import { createQuestion } from '@/domain/schemas/question';
import type { Question, QuestionDraft } from '@/domain/schemas/question';
import { createQuizSet } from '@/domain/schemas/set';
import type { QuizSet } from '@/domain/schemas/set';
import type {
  SessionPlanItem,
  StudyAttempt,
  StudyOptions,
} from '@/domain/schemas/study';

export const FIXED_NOW = '2026-01-01T00:00:00.000Z';

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

export function makeSet(overrides: Partial<QuizSet> = {}): QuizSet {
  const set = createQuizSet({
    id: overrides.id ?? nextId('set'),
    title: overrides.title ?? 'Test set',
    description: overrides.description,
    tags: overrides.tags,
    now: FIXED_NOW,
  });
  return { ...set, ...overrides, schemaVersion: SCHEMA_VERSION };
}

export function makeDraft(
  overrides: Partial<QuestionDraft> = {},
): QuestionDraft {
  return {
    prompt: overrides.prompt ?? 'What is 2 + 2?',
    answer: overrides.answer ?? '4',
    acceptedAnswers: overrides.acceptedAnswers ?? [],
    wrongChoices: overrides.wrongChoices ?? [],
    explanation: overrides.explanation,
    tags: overrides.tags ?? [],
  };
}

export function makeQuestion(
  overrides: Partial<Question> & { setId?: string } = {},
): Question {
  const draft: QuestionDraft = {
    prompt: overrides.prompt ?? 'What is 2 + 2?',
    answer: overrides.answer ?? '4',
    acceptedAnswers: overrides.acceptedAnswers ?? [],
    wrongChoices: overrides.wrongChoices ?? [],
    explanation: overrides.explanation,
    tags: overrides.tags ?? [],
  };
  const question = createQuestion({
    id: overrides.id ?? nextId('q'),
    setId: overrides.setId ?? 'set-1',
    draft,
    now: overrides.createdAt ?? FIXED_NOW,
  });
  return { ...question, ...overrides };
}

/** Builds `count` questions with unique prompts and answers. */
export function makeQuestionBank(count: number, setId = 'set-1'): Question[] {
  return Array.from({ length: count }, (_value, index) =>
    makeQuestion({
      id: `q-${index + 1}`,
      setId,
      prompt: `Question ${index + 1}?`,
      answer: `Answer ${index + 1}`,
    }),
  );
}

export function makeOptions(
  overrides: Partial<StudyOptions> = {},
): StudyOptions {
  return {
    mode: 'flashcard',
    questionLimit: 'all',
    shuffleQuestions: false,
    shuffleChoices: false,
    feedback: 'immediate',
    ...overrides,
  };
}

export function makePlanItem(
  overrides: Partial<SessionPlanItem> & { questionId: string },
): SessionPlanItem {
  return {
    presentationMode: 'flashcard',
    ...overrides,
  };
}

export function makeAttempt(
  overrides: Partial<StudyAttempt> & {
    questionId: string;
    result: StudyAttempt['result'];
  },
): StudyAttempt {
  return {
    id: nextId('attempt'),
    sessionId: overrides.sessionId ?? 'session-1',
    presentationMode: overrides.presentationMode ?? 'flashcard',
    answeredAt: overrides.answeredAt ?? FIXED_NOW,
    ...overrides,
  };
}
