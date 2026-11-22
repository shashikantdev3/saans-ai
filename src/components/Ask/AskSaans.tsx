// ============================================================
// src/components/Ask/AskSaans.tsx
// Free-text questions answered by Gemini, grounded in the selected
// area's live readings and the active household profile.
// ============================================================

import { memo, useCallback, useId, useState, type FormEvent } from 'react';
import { useAppContext } from '@/context/AppContext';
import { apiService } from '@/services/apiService';
import type { AskResponse } from '@/types';
import { AiSourceBadge } from '@/components/shared/AiSourceBadge';

export const ASK_MIN_LENGTH = 3;
export const ASK_MAX_LENGTH = 300;

const SUGGESTIONS = [
  'Can my child play outside after school today?',
  'Should I open the windows to air out the kitchen now?',
  'Is it safe to cycle to the metro at 8 AM?',
];

export const AskSaans = memo(function AskSaans() {
  const { selectedZone, activePersona, language } = useAppContext();
  const [question, setQuestion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AskResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const ids = useId();
  const inputId = `${ids}-question`;
  const helpId = `${ids}-help`;
  const errorId = `${ids}-error`;

  const length = question.trim().length;
  const isTooLong = length > ASK_MAX_LENGTH;

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = question.trim();

      if (trimmed.length < ASK_MIN_LENGTH) {
        setError('Type a question first (at least 3 characters).');
        return;
      }
      if (trimmed.length > ASK_MAX_LENGTH) {
        setError(`Please keep it under ${ASK_MAX_LENGTH} characters. Yours has ${trimmed.length}.`);
        return;
      }

      setError(null);
      setIsLoading(true);
      try {
        const answer = await apiService.askSaans({
          question: trimmed,
          persona: activePersona,
          zone: selectedZone,
          language,
        });
        setResult(answer);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Saans could not answer right now. Please try again.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [question, activePersona, selectedZone, language],
  );

  return (
    <section
      aria-labelledby={`${ids}-heading`}
      className="bg-white border border-[#c9dce0] rounded-3xl p-6 flex flex-col gap-4 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          <h2
            id={`${ids}-heading`}
            className="text-xl font-black text-[#18313d] flex items-center gap-2"
          >
            <span aria-hidden="true">💬</span> Ask Saans
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#e6f0fb] text-[#174a78] border border-[#a9c8ea]">
              Gemini
            </span>
          </h2>
          <p className="text-sm text-[#3d5a66] mt-1">
            Ask anything about today&apos;s air. Saans answers using the live readings for{' '}
            <strong className="text-[#18313d]">
              {selectedZone.zoneName} (AQI {selectedZone.aqi})
            </strong>{' '}
            and the <strong className="text-[#18313d]">{activePersona.name}</strong> profile.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
        <label htmlFor={inputId} className="text-sm font-bold text-[#18313d]">
          Your question
        </label>
        <textarea
          id={inputId}
          rows={2}
          value={question}
          onChange={(e) => {
            setQuestion(e.target.value);
            if (error) setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${helpId} ${errorId}` : helpId}
          placeholder="e.g. Can my child play outside after school today?"
          className="w-full rounded-2xl border border-[#9fbfc6] bg-[#f7fbfb] px-4 py-3 text-base text-[#18313d] placeholder:text-[#6f8790] focus:outline-none focus:ring-2 focus:ring-[#176b7e]"
        />
        <div className="flex items-center justify-between text-xs">
          <span id={helpId} className="text-[#526c76]">
            Plain question, {ASK_MIN_LENGTH} to {ASK_MAX_LENGTH} characters.
          </span>
          <span className={`font-bold ${isTooLong ? 'text-[#b42318]' : 'text-[#526c76]'}`}>
            {length} / {ASK_MAX_LENGTH}
          </span>
        </div>

        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-sm font-semibold text-[#9f1c1c] bg-[#fdecec] border border-[#efb1ac] rounded-xl px-3 py-2"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#526c76]">Try:</span>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQuestion(s);
                  setError(null);
                }}
                className="text-xs px-3 py-1.5 rounded-full border border-[#c9dce0] bg-[#eef7f8] text-[#294653] hover:bg-[#dff0ed] focus:outline-none focus:ring-2 focus:ring-[#176b7e]"
              >
                {s}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 rounded-2xl font-bold text-sm bg-[#176b7e] text-[#ffffff] hover:bg-[#12596a] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#176b7e] shrink-0"
          >
            {isLoading ? 'Asking Gemini…' : 'Ask Saans'}
          </button>
        </div>
      </form>

      <div aria-live="polite" aria-busy={isLoading}>
        {result && (
          <div
            role="region"
            aria-label="Saans answer"
            className="rounded-2xl border border-[#c9dce0] bg-[#f7fbfb] p-4 flex flex-col gap-3"
          >
            <AiSourceBadge source={result.source} model={result.model} />
            <p
              className={`text-base leading-relaxed text-[#18313d] ${language === 'ar' ? 'font-arabic text-right' : ''}`}
            >
              {result.answer}
            </p>
            {result.promptPreview && (
              <details className="text-xs text-[#3d5a66]">
                <summary className="cursor-pointer font-bold text-[#176b7e]">
                  What Saans sent to Gemini
                </summary>
                <pre className="mt-2 whitespace-pre-wrap font-mono text-[12px] leading-relaxed bg-white border border-[#c9dce0] rounded-xl p-3 text-[#294653]">
                  {result.promptPreview}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    </section>
  );
});
