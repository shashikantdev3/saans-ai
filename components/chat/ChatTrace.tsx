'use client';

import { memo } from 'react';
import type { ChatMessage } from '@/lib/ai/chatMessages';
import { useI18n } from '../ui/I18n';

const preClass = 'mt-1 overflow-auto rounded bg-paper p-2 text-xs whitespace-pre-wrap';

/**
 * "How Saans answered": the context Gemini received, each tool call with its result, and
 * whether every number in the answer was found in those results.
 */
export const ChatTrace = memo(function ChatTrace({ message }: { message: ChatMessage }) {
  const { t } = useI18n();
  const fromGemini = message.source === 'gemini';
  const meta = message.trace.find((e) => e.type === 'meta');
  const unverified = message.unverified ?? [];

  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer font-semibold text-breath">{t('traceButton')}</summary>
      <div className="mt-2 flex flex-col gap-2 rounded-lg border border-line bg-sky p-3">
        <p className="font-semibold">
          {fromGemini ? t('traceSourceGemini') : t('traceSourceRules')}
        </p>
        {fromGemini && meta?.type === 'meta' ? (
          <div>
            <p className="font-semibold">{t('traceSentToGemini')}</p>
            <pre tabIndex={0} className={preClass}>
              {JSON.stringify(meta.context, null, 2)}
            </pre>
          </div>
        ) : null}
        {message.trace.map((e, i) => {
          if (e.type === 'tool_call') {
            return (
              <p key={i} className="font-semibold" data-testid="trace-tool-call">
                {t('traceToolCall', { name: e.name })}{' '}
                <code className="text-xs">{JSON.stringify(e.args)}</code>
              </p>
            );
          }
          if (e.type === 'tool_result') {
            return (
              <div key={i}>
                <p className="text-muted">
                  {t('traceToolResult')} ({e.name})
                </p>
                <pre tabIndex={0} className={`${preClass} max-h-48`}>
                  {JSON.stringify(e.result, null, 2)}
                </pre>
              </div>
            );
          }
          return null;
        })}
        {fromGemini && message.done ? (
          <p className={unverified.length ? 'font-semibold text-[#b3261e]' : 'text-[#1b5e20]'}>
            {unverified.length
              ? t('traceUnverified', { numbers: unverified.join(', ') })
              : t('traceVerified')}
          </p>
        ) : null}
      </div>
    </details>
  );
});
