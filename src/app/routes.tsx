import { lazy } from 'react';
import { createHashRouter, type RouteObject } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';

// Pages are split into their own chunks so the first paint stays fast.
const LibraryPage = lazy(() =>
  import('@/features/library/LibraryPage').then((module) => ({
    default: module.LibraryPage,
  })),
);
const ImportPage = lazy(() =>
  import('@/features/import/ImportPage').then((module) => ({
    default: module.ImportPage,
  })),
);
const SetDetailPage = lazy(() =>
  import('@/features/sets/SetDetailPage').then((module) => ({
    default: module.SetDetailPage,
  })),
);
const SetEditorPage = lazy(() =>
  import('@/features/sets/SetEditorPage').then((module) => ({
    default: module.SetEditorPage,
  })),
);
const StudyIndexPage = lazy(() =>
  import('@/features/study/StudyIndexPage').then((module) => ({
    default: module.StudyIndexPage,
  })),
);
const StudySetupPage = lazy(() =>
  import('@/features/study/StudySetupPage').then((module) => ({
    default: module.StudySetupPage,
  })),
);
const SessionPage = lazy(() =>
  import('@/features/study/SessionPage').then((module) => ({
    default: module.SessionPage,
  })),
);
const ResultsPage = lazy(() =>
  import('@/features/results/ResultsPage').then((module) => ({
    default: module.ResultsPage,
  })),
);
const AiGuidePage = lazy(() =>
  import('@/features/ai-guide/AiGuidePage').then((module) => ({
    default: module.AiGuidePage,
  })),
);
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  })),
);
const NotFoundPage = lazy(() =>
  import('@/features/shared/NotFoundPage').then((module) => ({
    default: module.NotFoundPage,
  })),
);

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <LibraryPage /> },
      { path: 'import', element: <ImportPage /> },
      { path: 'study', element: <StudyIndexPage /> },
      { path: 'sets/:setId', element: <SetDetailPage /> },
      { path: 'sets/:setId/edit', element: <SetEditorPage /> },
      { path: 'sets/:setId/study', element: <StudySetupPage /> },
      { path: 'sets/:setId/study/session', element: <SessionPage /> },
      { path: 'sets/:setId/results/:sessionId', element: <ResultsPage /> },
      { path: 'guide', element: <AiGuidePage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

/**
 * Hash routing keeps the built app working from any static host or folder
 * (including file://) with no server rewrite rules, which fits a local-first
 * app that must run offline.
 */
export function createAppRouter() {
  return createHashRouter(routes);
}
