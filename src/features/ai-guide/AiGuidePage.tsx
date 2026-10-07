import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleAlert, Sparkles, Upload } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { CopyButton } from '@/features/shared/CopyButton';
import {
  AI_ACCURACY_WARNING,
  GUIDE_PROMPTS,
  type GuidePrompt,
} from './prompts';

export function AiGuidePage() {
  const [selected, setSelected] = useState<GuidePrompt>(
    GUIDE_PROMPTS[0] as GuidePrompt,
  );

  return (
    <div>
      <PageHeader
        title="AI guide"
        subtitle="Quizeasy does not send your notes anywhere. This page helps you use ChatGPT, Gemini, Claude, or another tool to turn your material into question-and-answer pairs you can paste back in."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {GUIDE_PROMPTS.map((prompt) => {
          const active = prompt.id === selected.id;
          return (
            <button
              key={prompt.id}
              type="button"
              aria-pressed={active}
              onClick={() => setSelected(prompt)}
              className={`card flex-1 basis-64 p-4 text-left transition ${
                active
                  ? 'border-indigo-500 ring-2 ring-indigo-200 dark:border-indigo-400 dark:ring-indigo-900'
                  : 'hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold">{prompt.name}</span>
                {active ? <Badge tone="info">Selected</Badge> : null}
              </span>
              <span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">
                {prompt.summary}
              </span>
              <span className="mt-2 block whitespace-pre-line font-mono text-xs text-slate-500 dark:text-slate-400">
                {prompt.preview}
              </span>
            </button>
          );
        })}
      </div>

      <section className="card mb-5 p-4" aria-label="Prompt">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base">{selected.name} prompt</h2>
          <CopyButton text={selected.text} />
        </div>
        <pre className="max-h-96 overflow-auto rounded-xl bg-slate-100 p-4 text-xs leading-relaxed whitespace-pre-wrap text-slate-800 dark:bg-slate-950 dark:text-slate-100">
          {selected.text}
        </pre>
        <p className="mt-2 hint">
          Tip: paste your notes or upload your PDF first, then send this prompt
          so the AI has something to work from.
        </p>
      </section>

      <section className="card mb-5 p-4" aria-label="How to use this guide">
        <h2 className="mb-2 text-base">How this works</h2>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-slate-700 dark:text-slate-200">
          <li>
            Open your preferred AI tool and attach or paste the study material.
          </li>
          <li>Copy the prompt above and send it.</li>
          <li>
            Copy the AI&apos;s reply — it should be plain “Q:” and “A:” lines
            with no commentary.
          </li>
          <li>
            <Link
              to="/import"
              className="font-medium text-indigo-700 hover:underline dark:text-indigo-300"
            >
              Paste it into Quizeasy
            </Link>{' '}
            and check the preview before saving.
          </li>
        </ol>
      </section>

      <p className="mb-5 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {AI_ACCURACY_WARNING}
      </p>

      <div className="flex flex-wrap gap-2">
        <Link to="/import" className="btn btn-primary">
          <Upload aria-hidden="true" className="size-4" />
          Paste your questions
        </Link>
        <Link to="/settings" className="btn btn-secondary">
          <Sparkles aria-hidden="true" className="size-4" />
          Future AI settings
        </Link>
      </div>
    </div>
  );
}
