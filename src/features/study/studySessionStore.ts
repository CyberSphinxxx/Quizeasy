import { create } from 'zustand';
import { repositories } from '@/data/repositories';
import type {
  AttemptResult,
  SessionPlanItem,
  StudyAttempt,
  StudyOptions,
  StudySession,
} from '@/domain/schemas/study';
import { nowIso } from '@/lib/utils';

export interface StartSessionInput {
  setId: string;
  options: StudyOptions;
  plan: readonly SessionPlanItem[];
  excluded?: { questionId: string; reason: string }[];
  originSessionId?: string;
}

export interface RecordAttemptInput {
  result: AttemptResult;
  response?: string;
  selectedChoice?: string;
}

interface StudySessionState {
  session: StudySession | undefined;
  plan: SessionPlanItem[];
  attempts: StudyAttempt[];
  index: number;
  revealed: boolean;
  answered: boolean;
  loading: boolean;
  start: (input: StartSessionInput) => Promise<StudySession>;
  resume: (session: StudySession) => Promise<void>;
  reveal: () => void;
  record: (input: RecordAttemptInput) => Promise<void>;
  goTo: (index: number) => void;
  next: () => void;
  previous: () => void;
  finish: () => Promise<void>;
  clear: () => void;
}

function clampIndex(index: number, length: number): number {
  if (length === 0) return 0;
  return Math.min(Math.max(index, 0), length - 1);
}

/**
 * The active study session.
 *
 * Only UI-facing state lives here: the session, its plan, and its attempts are
 * all persisted through the repository layer, so a reload can resume exactly
 * where the user left off.
 */
export const useStudySession = create<StudySessionState>()((set, get) => ({
  session: undefined,
  plan: [],
  attempts: [],
  index: 0,
  revealed: false,
  answered: false,
  loading: false,

  start: async (input) => {
    set({ loading: true });
    // Anything left open from an earlier session would otherwise linger as
    // "not finished" forever.
    await repositories.sessions.completeActiveForSet(input.setId, nowIso());
    const session = await repositories.sessions.create({
      setId: input.setId,
      mode: input.options.mode,
      options: input.options,
      plan: [...input.plan],
      ...(input.excluded && input.excluded.length > 0
        ? { excluded: input.excluded }
        : {}),
      ...(input.originSessionId
        ? { originSessionId: input.originSessionId }
        : {}),
    });
    await repositories.sets.touchStudied(input.setId, nowIso());
    set({
      session,
      plan: session.plan ?? [...input.plan],
      attempts: [],
      index: 0,
      revealed: false,
      answered: false,
      loading: false,
    });
    return session;
  },

  resume: async (session) => {
    set({ loading: true });
    const attempts = await repositories.attempts.listBySession(session.id);
    const plan = session.plan ?? [];
    set({
      session,
      plan,
      attempts: attempts.items,
      index: clampIndex(attempts.items.length, plan.length),
      revealed: false,
      answered: false,
      loading: false,
    });
  },

  reveal: () => set({ revealed: true }),

  record: async (input) => {
    const { session, plan, index, attempts } = get();
    const item = plan[index];
    if (!session || !item) return;

    const attempt = await repositories.attempts.record({
      sessionId: session.id,
      questionId: item.questionId,
      presentationMode: item.presentationMode,
      result: input.result,
      ...(input.response !== undefined ? { response: input.response } : {}),
      ...(input.selectedChoice !== undefined
        ? { selectedChoice: input.selectedChoice }
        : {}),
    });

    set({ attempts: [...attempts, attempt], answered: true });
  },

  goTo: (index) =>
    set((state) => ({
      index: clampIndex(index, state.plan.length),
      revealed: false,
      answered: false,
    })),

  next: () =>
    set((state) => ({
      index: clampIndex(state.index + 1, state.plan.length),
      revealed: false,
      answered: false,
    })),

  previous: () =>
    set((state) => ({
      index: clampIndex(state.index - 1, state.plan.length),
      revealed: false,
      answered: false,
    })),

  finish: async () => {
    const { session } = get();
    if (!session) return;
    await repositories.sessions.complete(session.id, nowIso());
  },

  clear: () =>
    set({
      session: undefined,
      plan: [],
      attempts: [],
      index: 0,
      revealed: false,
      answered: false,
      loading: false,
    }),
}));

/** The attempt recorded for a given planned item, if any. */
export function findAttempt(
  attempts: readonly StudyAttempt[],
  item: SessionPlanItem | undefined,
): StudyAttempt | undefined {
  if (!item) return undefined;
  return attempts.find((attempt) => attempt.questionId === item.questionId);
}
