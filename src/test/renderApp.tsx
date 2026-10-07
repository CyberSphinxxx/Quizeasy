import { render, type RenderResult } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '@/app/routes';
import { AppProviders } from '@/app/providers/AppProviders';
import { database } from '@/data/db/database';
import { repositories } from '@/data/repositories';
import type { QuestionDraft } from '@/domain/schemas/question';

/** Empties every table so each test starts from a clean local library. */
export async function resetDatabase(): Promise<void> {
  await database.sets.clear();
  await database.questions.clear();
  await database.sessions.clear();
  await database.attempts.clear();
  await database.preferences.clear();
}

/** Renders the real route tree at a path, providers included. */
export function renderApp(
  path = '/',
): RenderResult & { router: ReturnType<typeof createMemoryRouter> } {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const result = render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { ...result, router };
}

/** Creates a set with questions directly through the repository layer. */
export async function seedSet(
  title: string,
  drafts: QuestionDraft[],
): Promise<{ setId: string }> {
  const set = await repositories.sets.create({ title });
  if (drafts.length > 0) {
    await repositories.questions.createMany(set.id, drafts);
  }
  return { setId: set.id };
}

export function draft(
  prompt: string,
  answer: string,
  extra: Partial<QuestionDraft> = {},
): QuestionDraft {
  return {
    prompt,
    answer,
    acceptedAnswers: extra.acceptedAnswers ?? [],
    wrongChoices: extra.wrongChoices ?? [],
    tags: extra.tags ?? [],
    ...(extra.explanation ? { explanation: extra.explanation } : {}),
  };
}
