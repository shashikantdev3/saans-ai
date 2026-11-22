'use client';

import { useRef, useState, type FormEvent } from 'react';
import type { AnswerSource, ChatEvent, ChatTurn } from '@/lib/ai/chatTypes';
import { streamChat, type Location } from '@/lib/client/api';
import type { MessageKey } from '@/lib/i18n';
import type { Profile } from '@/lib/profile/schema';
import { useI18n } from '../ui/I18n';
import { ErrorNote, buttonPrimary, inputClass } from '../ui/Section';
import { errorKey } from '../ui/errors';

interface Message {
  role: 'user' | 'model';
  text: string;
  source?: AnswerSource;
  trace: ChatEvent[];
  unverified?: string[];
  done?: boolean;
}

const MAX_CHARS = 500;

function Trace({ message }: { message: Message }) {
  const { t } = useI18n();
  const meta = message.trace.find((e) => e.type === 'meta');
  const steps = message.trace.filter((e) => e.type === 'tool_call' || e.type === 'tool_result');
  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer font-semibold text-breath">{t('traceButton')}</summary>
      <div className="mt-2 flex flex-col gap-2 rounded-lg border border-line bg-sky p-3">
        <p className="font-semibold">
          {message.source === 'gemini' ? t('traceSourceGemini') : t('traceSourceRules')}
        </p>
        {meta?.type === 'meta' && message.source === 'gemini' ? (
          <div>
            <p className="font-semibold">{t('traceSentToGemini')}</p>
            <pre
              tabIndex={0}
              className="mt-1 overflow-x-auto rounded bg-paper p-2 text-xs whitespace-pre-wrap"
            >
              {JSON.stringify(meta.context, null, 2)}
            </pre>
          </div>
        ) : null}
        {steps.map((e, i) =>
          e.type === 'tool_call' ? (
            <p key={i} className="font-semibold" data-testid="trace-tool-call">
              {t('traceToolCall', { name: e.name })}{' '}
              <code className="text-xs">{JSON.stringify(e.args)}</code>
            </p>
          ) : e.type === 'tool_result' ? (
            <div key={i}>
              <p className="text-muted">
                {t('traceToolResult')} ({e.name})
              </p>
              <pre
                tabIndex={0}
                className="mt-1 max-h-48 overflow-auto rounded bg-paper p-2 text-xs whitespace-pre-wrap"
              >
                {JSON.stringify(e.result, null, 2)}
              </pre>
            </div>
          ) : null,
        )}
        {message.source === 'gemini' && message.done ? (
          <p
            className={
              message.unverified?.length ? 'font-semibold text-[#b3261e]' : 'text-[#1b5e20]'
            }
          >
            {message.unverified?.length
              ? t('traceUnverified', { numbers: message.unverified.join(', ') })
              : t('traceVerified')}
          </p>
        ) : null}
      </div>
    </details>
  );
}

export function ChatPanel({ location, profile }: { location: Location | null; profile: Profile }) {
  const { t, lang } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const updateLast = (fn: (m: Message) => Message) =>
    setMessages((all) => [...all.slice(0, -1), fn(all[all.length - 1] as Message)]);

  function onEvent(e: ChatEvent) {
    updateLast((m) => {
      switch (e.type) {
        case 'text':
          return { ...m, text: m.text + e.delta };
        case 'reset':
          return { ...m, text: '', trace: [] };
        case 'meta':
          return {
            ...m,
            source: e.source,
            trace: [...m.trace.filter((x) => x.type !== 'meta'), e],
          };
        case 'done':
          return { ...m, source: e.source, unverified: e.unverified, done: true };
        case 'error':
          return { ...m, text: m.text || t('errorGeneric'), done: true };
        default:
          return { ...m, trace: [...m.trace, e] };
      }
    });
  }

  async function ask(e: FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!location) return setError('chatNeedsPlace');
    if (!q) return setError('chatEmpty');
    if (q.length > MAX_CHARS) return setError('chatTooLong');
    setError(null);
    const history: ChatTurn[] = messages
      .filter((m) => m.text)
      .slice(-6)
      .map((m) => ({ role: m.role, text: m.text.slice(0, 1500) }));
    setMessages((all) => [
      ...all,
      { role: 'user', text: q, trace: [] },
      { role: 'model', text: '', trace: [] },
    ]);
    setQuestion('');
    setBusy(true);
    try {
      await streamChat(location, profile, lang, q, history, onEvent);
    } catch (err) {
      setMessages((all) => all.slice(0, -1));
      setError(errorKey(err));
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div>
      <div
        role="log"
        aria-live="polite"
        aria-busy={busy}
        className="flex flex-col gap-3"
        data-testid="chat-log"
      >
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div
              key={i}
              className="max-w-[85%] self-end rounded-2xl rounded-br-sm bg-breath px-4 py-2 text-white"
            >
              <span className="sr-only">{t('you')}: </span>
              {m.text}
            </div>
          ) : (
            <div
              key={i}
              className="max-w-[95%] rounded-2xl rounded-bl-sm border border-line bg-paper px-4 py-3"
            >
              <p className="text-sm font-semibold text-breath">{t('saans')}</p>
              <p className="mt-1 whitespace-pre-line" data-testid="chat-answer">
                {m.text || (busy && i === messages.length - 1 ? t('chatThinking') : '')}
              </p>
              {m.done ? <Trace message={m} /> : null}
            </div>
          ),
        )}
      </div>

      <form onSubmit={ask} className="mt-4 flex flex-col gap-2" noValidate>
        <label htmlFor="question" className="font-semibold">
          {t('chatLabel')}
        </label>
        <textarea
          id="question"
          ref={inputRef}
          rows={2}
          className={inputClass}
          placeholder={t('chatPlaceholder')}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          aria-describedby="question-count"
        />
        <div className="flex items-center justify-between gap-3">
          <span
            id="question-count"
            className={`text-sm ${question.length > MAX_CHARS ? 'font-semibold text-[#b3261e]' : 'text-muted'}`}
          >
            {question.length}/{MAX_CHARS}
          </span>
          <button type="submit" className={buttonPrimary} disabled={busy}>
            {busy ? t('chatThinking') : t('chatSend')}
          </button>
        </div>
        {error ? <ErrorNote>{t(error)}</ErrorNote> : null}
      </form>
    </div>
  );
}
