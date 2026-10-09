#!/usr/bin/env node
import { execSync } from 'node:child_process';
import path from 'node:path';

const AUTHOR_NAME = 'CyberSphinxxx';
const AUTHOR_EMAIL = 'johnlemargonzales@gmail.com';
const AUTHOR_STRING = `${AUTHOR_NAME} <${AUTHOR_EMAIL}>`;

const isDryRun = process.argv.includes('--dry-run');

// Standard Git env overrides to prevent any third-party or tool identity leakage
const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: AUTHOR_NAME,
  GIT_AUTHOR_EMAIL: AUTHOR_EMAIL,
  GIT_COMMITTER_NAME: AUTHOR_NAME,
  GIT_COMMITTER_EMAIL: AUTHOR_EMAIL,
};

function run(cmd, env = GIT_ENV) {
  return execSync(cmd, { encoding: 'utf8', env });
}

// Explicit mapping for known project files to guarantee pristine commit messages
const EXACT_MESSAGES = {
  // Config & Root
  'LICENSE': 'chore: add MIT license',
  '.gitignore': 'chore: configure gitignore for dependencies, builds, and local tools',
  '.prettierrc.json': 'chore: configure Prettier code formatting rules',
  'eslint.config.js': 'chore: configure ESLint and typescript-eslint rules',
  'tsconfig.json': 'chore: configure strict TypeScript compiler options and path aliases',
  'vite.config.ts': 'chore: configure Vite build setup, PWA plugins, and test environment',
  'package.json': 'chore: define project dependencies, scripts, and package metadata',
  'package-lock.json': 'chore: lock dependency versions in package-lock',
  'playwright.config.ts': 'test: configure Playwright end-to-end testing suite',
  'vercel.json': 'chore(vercel): configure Vercel deployment, SPA rewrites, and caching headers',
  'index.html': 'feat: create main HTML entrypoint with metadata and PWA manifest link',

  // GitHub & Community
  '.github/workflows/ci.yml': 'ci: configure GitHub Actions continuous integration workflow',
  '.github/ISSUE_TEMPLATE/bug_report.yml': 'chore(github): add bug report issue template',
  '.github/ISSUE_TEMPLATE/config.yml': 'chore(github): configure issue template settings',
  '.github/ISSUE_TEMPLATE/feature_request.yml': 'chore(github): add feature request issue template',
  '.github/ISSUE_TEMPLATE/parser_issue.yml': 'chore(github): add parser issue report template',
  '.github/PULL_REQUEST_TEMPLATE.md': 'chore(github): add pull request template',
  'CODE_OF_CONDUCT.md': 'docs: add Contributor Covenant code of conduct',
  'CONTRIBUTING.md': 'docs: add project contributing guidelines',
  'SECURITY.md': 'docs: establish security policy and vulnerability reporting instructions',
  'AGENTS.md': 'docs: define agent rules, architecture constraints, and quality gates',
  'STATUS.md': 'docs: document project milestone status and verification results',
  'TASKS.md': 'docs: document task breakdown and implementation checklist',
  'README.md': 'docs: add comprehensive project README and getting-started guide',

  // Documentation
  'docs/00-MASTER-AGENT-LOOP.md': 'docs: add master agent loop orchestration specification',
  'docs/01-PRODUCT-REQUIREMENTS.md': 'docs: specify core product requirements and MVP scope',
  'docs/02-TECHNICAL-REQUIREMENTS.md': 'docs: define technical requirements, stack, and architectural constraints',
  'docs/03-APP-FLOW.md': 'docs: document application user flows and page transitions',
  'docs/04-DESIGN-BRIEF.md': 'docs: outline design brief, aesthetic tokens, and component guidelines',
  'docs/05-DATA-SCHEMA.md': 'docs: specify canonical data schemas and persistence models',
  'docs/06-IMPORT-PARSER-SPEC.md': 'docs: specify import parser syntax, rules, and error handling',
  'docs/07-IMPLEMENTATION-PLAN.md': 'docs: document implementation phases and delivery plan',
  'docs/08-TESTING-QA.md': 'docs: establish testing, quality assurance, and coverage strategy',
  'docs/09-EDGE-CASES.md': 'docs: catalog edge cases and defensive handling rules',
  'docs/10-OPEN-SOURCE-REPO.md': 'docs: detail open-source repository structure and guidelines',
  'docs/11-FUTURE-AI-INTEGRATION.md': 'docs: outline future AI integration and BYOK architecture',
  'docs/12-RELEASE-CHECKLIST.md': 'docs: provide pre-release checklist and release criteria',
  'docs/13-DEFINITION-OF-DONE.md': 'docs: establish project definition of done standards',
  'docs/14-INITIAL-DEVELOPMENT-PROMPT.md': 'docs: document initial autonomous agent development prompt',
  'docs/15-CONTINUATION-PROMPT.md': 'docs: document agent continuation and resumption prompt',
  'docs/16-AI-GUIDE-PROMPTS.md': 'docs: provide external AI prompts and formatting guide',

  // Schemas, Examples & Assets
  'schemas/quizeasy-set.schema.json': 'chore(schema): define JSON Schema for Quizeasy quiz set exports',
  'examples/sample-import.txt': 'chore(examples): add sample raw quiz text for import testing',
  'examples/sample-set.quizeasy.json': 'chore(examples): add sample exported quiz set JSON',
  'scripts/generate-icons.mjs': 'chore(scripts): add PWA icon generation script',
  'scripts/commit-individual-files.mjs': 'chore(scripts): add individual file git commit automation script',
  'public/favicon.svg': 'style(assets): add favicon SVG vector icon',
  'public/icons/icon-192.png': 'style(assets): add 192x192 PWA app icon',
  'public/icons/icon-512.png': 'style(assets): add 512x512 PWA app icon',
  'public/icons/icon-maskable-512.png': 'style(assets): add 512x512 maskable PWA app icon',

  // E2E Tests
  'e2e/helpers.ts': 'test(e2e): add Playwright test utilities and navigation helpers',
  'e2e/import-to-study.spec.ts': 'test(e2e): add end-to-end test for raw text import to study flow',
  'e2e/modes.spec.ts': 'test(e2e): add end-to-end tests for all study mode interactions',
  'e2e/persistence-and-backup.spec.ts': 'test(e2e): add end-to-end tests for IndexedDB persistence and backups',
  'e2e/responsive.mobile.spec.ts': 'test(e2e): add mobile viewport and responsive layout tests',

  // App Shell & Store & Styles
  'src/styles/index.css': 'style: define global CSS variables, typography, and base theme',
  'src/styles/theme.css': 'style: define theme color tokens and elevation classes',
  'src/main.tsx': 'feat: initialize React application root with providers',
  'src/app/App.tsx': 'feat(app): create main application shell and router outlet',
  'src/app/routes.tsx': 'feat(app): configure application client-side route hierarchy',
  'src/app/theme.ts': 'feat(app): define theme constants and color tokens',
  'src/app/providers/AppProviders.tsx': 'feat(app): wrap application in react-router and theme providers',
  'src/app/providers/PreferencesProvider.tsx': 'feat(app): provide user preferences context and persistence',
  'src/app/store/appStore.ts': 'feat(store): initialize global Zustand app state store',

  // Test Utilities
  'src/test/setup.ts': 'test: configure Vitest environment with fake-indexeddb and jest-dom',
  'src/test/factories.ts': 'test: define test data factories for quiz sets and questions',
  'src/test/renderApp.tsx': 'test: create custom render utility with test router and providers',

  // Domain Logic & Schemas
  'src/domain/constants.ts': 'feat(domain): define domain constants, study modes, and limits',
  'src/domain/schemas/index.ts': 'feat(schemas): re-export core domain Zod schemas',
  'src/domain/schemas/common.ts': 'feat(schemas): define common ID, timestamp, and audit schemas',
  'src/domain/schemas/set.ts': 'feat(schemas): define quiz set entity validation schemas',
  'src/domain/schemas/question.ts': 'feat(schemas): define canonical question and choice schemas',
  'src/domain/schemas/study.ts': 'feat(schemas): define study session, mode, and progress schemas',
  'src/domain/schemas/preferences.ts': 'feat(schemas): define user display and study preference schemas',
  'src/domain/schemas/transfer.ts': 'feat(schemas): define export and import payload schemas',
  'src/domain/quiz/normalize.ts': 'feat(quiz): implement text normalization for answer comparison',
  'src/domain/quiz/normalize.test.ts': 'test(quiz): add unit tests for answer text normalization',
  'src/domain/quiz/choices.ts': 'feat(quiz): implement distractor generation and choice shuffling',
  'src/domain/quiz/choices.test.ts': 'test(quiz): add unit tests for multiple choice generation',
  'src/domain/study/eligibility.ts': 'feat(study): filter and validate question eligibility across study modes',
  'src/domain/study/scoring.ts': 'feat(study): implement score calculation and accuracy metrics',
  'src/domain/study/scoring.test.ts': 'test(study): add unit tests for scoring and grade calculations',
  'src/domain/study/plan.ts': 'feat(study): generate structured study plans from question sets',
  'src/domain/study/plan.test.ts': 'test(study): add unit tests for study session plan generation',

  // Data Layer (IndexedDB & Repositories)
  'src/data/db/database.ts': 'feat(db): initialize Dexie IndexedDB tables and versioned schema',
  'src/data/db/validation.ts': 'feat(db): validate entity records before IndexedDB write operations',
  'src/data/repositories/types.ts': 'feat(repositories): define repository interfaces and storage types',
  'src/data/repositories/rows.ts': 'feat(repositories): implement database row mappers and converters',
  'src/data/repositories/index.ts': 'feat(repositories): export unified repository container',
  'src/data/repositories/setRepository.ts': 'feat(repositories): implement quiz set CRUD operations',
  'src/data/repositories/questionRepository.ts': 'feat(repositories): implement question bank CRUD repository',
  'src/data/repositories/sessionRepository.ts': 'feat(repositories): implement study session tracking repository',
  'src/data/repositories/attemptRepository.ts': 'feat(repositories): implement question attempt history repository',
  'src/data/repositories/preferencesRepository.ts': 'feat(repositories): implement user preferences repository',
  'src/data/repositories/repositories.test.ts': 'test(repositories): add unit tests for repository CRUD operations',

  // Parser
  'src/parser/index.ts': 'feat(parser): expose public raw text parser API',
  'src/parser/types.ts': 'feat(parser): define parser token and AST interfaces',
  'src/parser/limits.ts': 'feat(parser): enforce parsing quotas and token boundary limits',
  'src/parser/normalize.ts': 'feat(parser): normalize raw quiz text input lines',
  'src/parser/validate.ts': 'feat(parser): validate parsed questions against structural rules',
  'src/parser/parse.ts': 'feat(parser): implement multi-format raw quiz text parser',
  'src/parser/parse.test.ts': 'test(parser): add comprehensive unit tests for quiz import parser',

  // Services
  'src/services/importService.ts': 'feat(services): implement service for parsing and saving imported sets',
  'src/services/backupService.ts': 'feat(services): implement full database backup and restore export service',
  'src/services/setTransfer.ts': 'feat(services): implement individual set JSON import and export transfer',
  'src/services/exampleArtifacts.test.ts': 'test(services): add tests verifying bundled example data and transfers',

  // UI Primitives & Layout
  'src/components/ui/Button.tsx': 'feat(ui): implement accessible Button component with variants',
  'src/components/ui/Badge.tsx': 'feat(ui): implement Badge component for tags and status chips',
  'src/components/ui/Dialog.tsx': 'feat(ui): implement accessible modal Dialog component',
  'src/components/ui/Dialog.test.tsx': 'test(ui): add unit tests for modal Dialog component',
  'src/components/ui/Feedback.tsx': 'feat(ui): implement visual Feedback alerts and notifications',
  'src/components/ui/Form.tsx': 'feat(ui): implement Form inputs, textareas, and field wrappers',
  'src/components/ui/Toast.tsx': 'feat(ui): implement Toast notification provider and toast stack',
  'src/components/layout/AppShell.tsx': 'feat(layout): implement responsive AppShell with header and navigation',
  'src/components/layout/PageHeader.tsx': 'feat(layout): implement PageHeader component with back navigation',
  'src/components/layout/navigation.ts': 'feat(layout): define navigation items and path definitions',
  'src/components/layout/useNavShortcuts.ts': 'feat(layout): implement keyboard shortcuts hook for global app navigation',

  // Features
  'src/features/shared/CopyButton.tsx': 'feat(shared): implement clipboard copy button with feedback toast',
  'src/features/shared/NotFoundPage.tsx': 'feat(shared): implement 404 not found error page',
  'src/features/shared/SetFileImportButton.tsx': 'feat(shared): implement file selector button for JSON set imports',
  'src/features/library/LibraryPage.tsx': 'feat(library): build library page for browsing and managing quiz sets',
  'src/features/library/SetCard.tsx': 'feat(library): render quiz set card with study stats and actions',
  'src/features/library/SetActionsDialog.tsx': 'feat(library): implement set actions dialog for export, edit, and deletion',
  'src/features/library/useSetSignals.ts': 'feat(library): implement reactive set signals hook for library state',
  'src/features/sets/SetDetailPage.tsx': 'feat(sets): build set detail overview page with question list',
  'src/features/sets/SetEditorPage.tsx': 'feat(sets): implement question bank and set editor interface',
  'src/features/sets/SetEditorPage.test.tsx': 'test(sets): add unit tests for set editor and question creation',
  'src/features/sets/QuestionFormDialog.tsx': 'feat(sets): create question add/edit modal form',
  'src/features/import/ImportPage.tsx': 'feat(import): implement raw text import editor with live preview',
  'src/features/import/ImportPage.test.tsx': 'test(import): add unit tests for import page workflow',
  'src/features/import/ImportItemCard.tsx': 'feat(import): render parsed question item preview card',
  'src/features/import/ImportSummary.tsx': 'feat(import): display question count and validation summary',
  'src/features/import/importDraft.ts': 'feat(import): manage ephemeral import draft state and persistence',
  'src/features/study/StudyIndexPage.tsx': 'feat(study): build study hub page for mode selection',
  'src/features/study/StudySetupPage.tsx': 'feat(study): configure study session options and question count',
  'src/features/study/SessionPage.tsx': 'feat(study): create study session controller supporting all study modes',
  'src/features/study/FlashcardView.tsx': 'feat(study): implement interactive flip flashcard study view',
  'src/features/study/MultipleChoiceView.tsx': 'feat(study): implement multiple choice quiz view with timer and options',
  'src/features/study/IdentificationView.tsx': 'feat(study): implement text input identification quiz view',
  'src/features/study/studySessionStore.ts': 'feat(study): implement study session state machine store',
  'src/features/study/studyFlow.test.tsx': 'test(study): add integration tests for complete study flow',
  'src/features/results/ResultsPage.tsx': 'feat(results): build quiz results summary page with review breakdown',
  'src/features/settings/SettingsPage.tsx': 'feat(settings): build user settings page for theme and data controls',
  'src/features/settings/BackupRestoreButton.tsx': 'feat(settings): implement JSON database backup and restore triggers',
  'src/features/ai-guide/AiGuidePage.tsx': 'feat(ai-guide): build AI guide page with copyable prompt templates',
  'src/features/ai-guide/prompts.ts': 'feat(ai-guide): define curated prompts for external LLM question generation',

  // Hooks & Libs
  'src/hooks/useAsyncData.ts': 'feat(hooks): implement generic async data fetching hook with status states',
  'src/hooks/useLibrary.ts': 'feat(hooks): implement hook for loading and managing library sets',
  'src/hooks/useSetBundle.ts': 'feat(hooks): implement hook for loading full quiz set bundle and questions',
  'src/hooks/useUnsavedChangesGuard.ts': 'feat(hooks): implement navigation guard for unsaved form changes',
  'src/lib/empties.ts': 'feat(lib): define empty entity state factories',
  'src/lib/files.ts': 'feat(lib): implement browser file read and download helpers',
  'src/lib/rng.ts': 'feat(lib): implement deterministic random number generator for study shuffles',
  'src/lib/utils.ts': 'feat(lib): implement general utility functions and classname merger',
};

// Fallback message generator for any unforeseen files
function generateFallbackMessage(normalizedPath) {
  const ext = path.extname(normalizedPath);
  const base = path.basename(normalizedPath, ext);

  if (normalizedPath.includes('.test.') || normalizedPath.includes('.spec.')) {
    return `test: add tests for ${base}`;
  }
  if (normalizedPath.startsWith('docs/')) {
    return `docs: update documentation for ${base}`;
  }
  if (normalizedPath.startsWith('.github/')) {
    return `chore(github): update ${base}`;
  }
  if (normalizedPath.startsWith('src/features/')) {
    const featureName = normalizedPath.split('/')[2] || 'feature';
    return `feat(${featureName}): implement ${base}`;
  }
  if (normalizedPath.startsWith('src/components/ui/')) {
    return `feat(ui): implement ${base} component`;
  }
  if (normalizedPath.startsWith('src/components/layout/')) {
    return `feat(layout): implement ${base} layout component`;
  }
  if (normalizedPath.startsWith('src/data/repositories/')) {
    return `feat(repositories): implement ${base}`;
  }
  if (normalizedPath.startsWith('src/data/db/')) {
    return `feat(db): update ${base}`;
  }
  if (normalizedPath.startsWith('src/domain/schemas/')) {
    return `feat(schemas): define ${base} schema`;
  }
  if (normalizedPath.startsWith('src/domain/')) {
    return `feat(domain): implement ${base}`;
  }
  if (normalizedPath.startsWith('src/parser/')) {
    return `feat(parser): implement ${base}`;
  }
  if (normalizedPath.startsWith('src/hooks/')) {
    return `feat(hooks): implement ${base}`;
  }
  if (normalizedPath.startsWith('src/services/')) {
    return `feat(services): implement ${base}`;
  }
  if (normalizedPath.startsWith('src/lib/')) {
    return `feat(lib): implement ${base}`;
  }
  if (normalizedPath.startsWith('scripts/')) {
    return `chore(scripts): update ${base}`;
  }
  if (ext === '.css' || ext === '.scss') {
    return `style: update stylesheet ${base}`;
  }
  return `feat: add ${base}`;
}

// Logical architectural ordering
function getPriority(filePath) {
  if (filePath === 'LICENSE') return 10;
  if (filePath === '.gitignore' || filePath === '.prettierrc.json' || filePath.startsWith('eslint.') || filePath.startsWith('tsconfig.') || filePath.startsWith('vite.') || filePath === 'playwright.config.ts') return 20;
  if (filePath === 'vercel.json') return 22;
  if (filePath === 'package.json' || filePath === 'package-lock.json') return 25;
  if (filePath.startsWith('.github/')) return 30;
  if (filePath === 'CODE_OF_CONDUCT.md' || filePath === 'CONTRIBUTING.md' || filePath === 'SECURITY.md') return 40;
  if (filePath === 'AGENTS.md' || filePath === 'TASKS.md' || filePath === 'STATUS.md') return 50;
  if (filePath.startsWith('docs/')) return 60;
  if (filePath === 'README.md') return 70;
  if (filePath.startsWith('schemas/')) return 80;
  if (filePath.startsWith('examples/')) return 90;
  if (filePath.startsWith('scripts/')) return 100;
  if (filePath.startsWith('public/')) return 110;
  if (filePath === 'index.html') return 120;
  if (filePath.startsWith('src/test/')) return 130;
  if (filePath.startsWith('src/domain/schemas/')) return 140;
  if (filePath.startsWith('src/domain/')) return 150;
  if (filePath.startsWith('src/data/db/')) return 160;
  if (filePath.startsWith('src/data/repositories/')) return 170;
  if (filePath.startsWith('src/services/')) return 180;
  if (filePath.startsWith('src/parser/')) return 190;
  if (filePath.startsWith('src/styles/')) return 200;
  if (filePath.startsWith('src/components/ui/')) return 210;
  if (filePath.startsWith('src/components/layout/')) return 220;
  if (filePath.startsWith('src/hooks/')) return 230;
  if (filePath.startsWith('src/lib/')) return 240;
  if (filePath.startsWith('src/app/store/')) return 250;
  if (filePath.startsWith('src/app/theme.')) return 255;
  if (filePath.startsWith('src/app/providers/')) return 260;
  if (filePath.startsWith('src/app/routes.')) return 265;
  if (filePath.startsWith('src/app/App.')) return 270;
  if (filePath === 'src/main.tsx') return 275;
  if (filePath.startsWith('src/features/shared/')) return 280;
  if (filePath.startsWith('src/features/settings/')) return 285;
  if (filePath.startsWith('src/features/library/')) return 290;
  if (filePath.startsWith('src/features/sets/')) return 295;
  if (filePath.startsWith('src/features/import/')) return 300;
  if (filePath.startsWith('src/features/study/')) return 305;
  if (filePath.startsWith('src/features/results/')) return 310;
  if (filePath.startsWith('src/features/ai-guide/')) return 315;
  if (filePath.startsWith('e2e/')) return 320;
  return 400;
}

// 1. Get uncommitted files
const rawStatus = run('git status --porcelain -uall');
if (!rawStatus.trim()) {
  console.log('✨ Working tree is already clean. Nothing to commit.');
  process.exit(0);
}

const lines = rawStatus.split(/\r?\n/).filter(line => line.trim().length > 0);
const files = lines
  .map(line => {
    // In git porcelain format, the first 2 characters are status flags (e.g. " M", "??")
    // followed by a space, so the file path begins at index 3.
    const relative = line.slice(3).trim();
    // Handle quoted paths from git
    const unquoted = relative.replace(/^"(.*)"$/, '$1');
    return unquoted.replace(/\\/g, '/');
  })
  .filter(file => !file.toLowerCase().includes('freebuff'));

console.log('🛡️ Verified: freebuff directory and files are excluded.\n');

// Sort files logically
files.sort((a, b) => {
  const pA = getPriority(a);
  const pB = getPriority(b);
  if (pA !== pB) return pA - pB;
  return a.localeCompare(b);
});

console.log(`Found ${files.length} file(s) to commit individually.\n`);
if (isDryRun) {
  console.log('🔎 DRY RUN MODE (no changes will be committed):\n');
}

let count = 0;
for (const file of files) {
  count++;
  const msg = EXACT_MESSAGES[file] || generateFallbackMessage(file);

  if (isDryRun) {
    console.log(`[${count}/${files.length}] [DRY-RUN] ${file} -> "${msg}"`);
    continue;
  }

  // 1. Stage the file
  run(`git add "${file}"`);

  // 2. Commit with strict author and committer metadata
  try {
    run(`git commit -m "${msg}" --author="${AUTHOR_STRING}" --no-verify`);
    const shortHash = run('git rev-parse --short HEAD').trim();
    console.log(`[${count}/${files.length}] ✅ (${shortHash}) ${file} -> "${msg}"`);
  } catch (err) {
    console.error(`❌ Failed to commit ${file}:`, err.message);
    process.exit(1);
  }
}

console.log(`\n🎉 Successfully processed ${count} files individually!`);
if (!isDryRun) {
  console.log(`\nAll commits signed under: ${AUTHOR_STRING}`);
  console.log('Run "git log -n 10 --oneline" to inspect the recent commits.');
}
