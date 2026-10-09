import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleAlert, Upload } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CopyButton } from '@/features/shared/CopyButton';
import {
  AI_ACCURACY_WARNING,
  GUIDE_PROMPTS,
  type GuidePrompt,
} from './prompts';

const STEPS = [
  {
    step: '01',
    title: 'Attach your material',
    detail:
      'Open ChatGPT, Gemini, Claude or any other tool and add your notes.',
  },
  {
    step: '02',
    title: 'Send the prompt',
    detail: 'Copy the prompt below and send it as your next message.',
  },
  {
    step: '03',
    title: 'Paste the reply back',
    detail:
      'The answer should be plain Q: and A: lines — paste it into Import.',
  },
];

export function AiGuidePage() {
  const [selected, setSelected] = useState<GuidePrompt>(
    GUIDE_PROMPTS[0] as GuidePrompt,
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="AI guide"
        title="AI guide"
        subtitle="Copy a prompt into any AI tool, then bring the Q: and A: lines back here to review them."
      />

      <section aria-label="How this works">
        <h2 className="eyebrow mb-3">HOW THIS WORKS</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((item) => (
            <li key={item.step} className="card flex flex-col gap-1 p-5">
              <span className="font-mono text-eyebrow text-muted">
                {item.step}
              </span>
              <span className="text-card font-display font-medium">
                {item.title}
              </span>
              <span className="text-caption text-muted">{item.detail}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Prompt format">
        <h2 className="eyebrow mb-3">PROMPT FORMAT</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {GUIDE_PROMPTS.map((prompt) => {
            const active = prompt.id === selected.id;
            return (
              <button
                key={prompt.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelected(prompt)}
                className={`card flex flex-col items-start gap-2 p-5 text-left transition ${
                  active ? 'border-accent' : 'hover:border-line-strong'
                }`}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="text-card font-display font-medium">
                    {prompt.name}
                  </span>
                  {active ? (
                    <span className="chip chip-accent">SELECTED</span>
                  ) : null}
                </span>
                <span className="text-caption text-muted">
                  {prompt.summary}
                </span>
                <span className="text-caption text-muted font-mono whitespace-pre-line">
                  {prompt.preview}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card p-5" aria-label="Prompt">
        <h2 className="eyebrow mb-3">{selected.name.toUpperCase()} PROMPT</h2>
        <pre className="rounded-control border-line bg-inset max-h-[360px] overflow-auto border p-4 font-mono text-caption whitespace-pre-wrap text-ink">
          {selected.text}
        </pre>
        <div className="border-line bg-surface sticky bottom-0 mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <p className="text-caption text-muted max-w-prose">
            Paste your notes or attach your PDF first, then send this prompt so
            the AI has something to work from.
          </p>
          <CopyButton text={selected.text} />
        </div>
      </section>

      <p className="card text-caption text-warning flex items-start gap-2 px-4 py-3">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {AI_ACCURACY_WARNING}
      </p>

      <div className="flex flex-wrap gap-2">
        <Link to="/import" className="btn btn-outline">
          <Upload aria-hidden="true" className="size-4" />
          Paste your questions
        </Link>
        <Link to="/settings" className="btn btn-ghost">
          Future AI settings
        </Link>
      </div>
    </div>
  );
}
