import type {
  Question,
  QuestionDraft,
  QuestionSource,
} from '@/domain/schemas/question';
import type { QuizSet, QuizSetDraft } from '@/domain/schemas/set';
import type {
  StudyAttempt,
  StudyMode,
  StudyOptions,
  StudySession,
} from '@/domain/schemas/study';
import type { Preferences } from '@/domain/schemas/preferences';
import type { SessionPlanItem, ExcludedQuestion } from '@/domain/schemas/study';

/** Result of a read that tolerates corrupted rows. */
export interface ListResult<T> {
  items: T[];
  /** Rows that failed schema validation and were skipped. */
  skipped: number;
}

export interface SetWithStats {
  set: QuizSet;
  questionCount: number;
  sessionCount: number;
}

export interface StudySessionInput {
  setId: string;
  mode: StudyMode;
  options: StudyOptions;
  plan: SessionPlanItem[];
  excluded?: ExcludedQuestion[];
  originSessionId?: string;
}

export interface StudyAttemptInput {
  sessionId: string;
  questionId: string;
  presentationMode: StudyAttempt['presentationMode'];
  result: StudyAttempt['result'];
  response?: string;
  selectedChoice?: string;
}

export interface DatabaseCounts {
  sets: number;
  questions: number;
  sessions: number;
  attempts: number;
}

export interface SetRepository {
  list(): Promise<ListResult<QuizSet>>;
  listWithStats(): Promise<ListResult<SetWithStats>>;
  get(id: string): Promise<QuizSet | undefined>;
  create(draft: QuizSetDraft): Promise<QuizSet>;
  /** Creates a set with an explicit id (used by imports). */
  createWithId(set: QuizSet): Promise<QuizSet>;
  update(id: string, patch: QuizSetDraft): Promise<QuizSet>;
  rename(id: string, title: string): Promise<QuizSet>;
  duplicate(id: string): Promise<QuizSet>;
  remove(id: string): Promise<void>;
  touchStudied(id: string, at: string): Promise<void>;
  counts(): Promise<DatabaseCounts>;
  clearAll(): Promise<void>;
}

export interface QuestionRepository {
  listBySet(setId: string): Promise<ListResult<Question>>;
  listAll(): Promise<ListResult<Question>>;
  get(id: string): Promise<Question | undefined>;
  create(
    setId: string,
    draft: QuestionDraft,
    source?: QuestionSource,
  ): Promise<Question>;
  createMany(
    setId: string,
    drafts: readonly QuestionDraft[],
    source?: QuestionSource,
  ): Promise<Question[]>;
  addExisting(questions: readonly Question[]): Promise<void>;
  update(id: string, draft: QuestionDraft): Promise<Question>;
  remove(id: string): Promise<void>;
  removeMany(ids: readonly string[]): Promise<void>;
  countBySet(setId: string): Promise<number>;
  /** Moves a question one position up or down inside its set. */
  move(setId: string, questionId: string, direction: -1 | 1): Promise<boolean>;
  /** Every stored question ID, used to detect import collisions. */
  allIds(): Promise<Set<string>>;
}

export interface SessionRepository {
  get(id: string): Promise<StudySession | undefined>;
  listBySet(setId: string, limit?: number): Promise<ListResult<StudySession>>;
  listAll(): Promise<ListResult<StudySession>>;
  listRecent(limit: number): Promise<ListResult<StudySession>>;
  latestCompletedForSet(setId: string): Promise<StudySession | undefined>;
  findActiveForSet(setId: string): Promise<StudySession | undefined>;
  create(input: StudySessionInput): Promise<StudySession>;
  addExisting(sessions: readonly StudySession[]): Promise<void>;
  complete(id: string, completedAt: string): Promise<void>;
  /** Closes sessions that were left open when a new one starts. */
  completeActiveForSet(setId: string, completedAt: string): Promise<number>;
  remove(id: string): Promise<void>;
}

export interface AttemptRepository {
  listBySession(sessionId: string): Promise<ListResult<StudyAttempt>>;
  listAll(): Promise<ListResult<StudyAttempt>>;
  record(input: StudyAttemptInput): Promise<StudyAttempt>;
  addExisting(attempts: readonly StudyAttempt[]): Promise<void>;
  removeBySession(sessionId: string): Promise<void>;
}

export interface PreferencesRepository {
  get(): Promise<Preferences>;
  save(preferences: Preferences): Promise<Preferences>;
  update(patch: Partial<Omit<Preferences, 'id'>>): Promise<Preferences>;
}

export interface RepositoryBundle {
  sets: SetRepository;
  questions: QuestionRepository;
  sessions: SessionRepository;
  attempts: AttemptRepository;
  preferences: PreferencesRepository;
}
