'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useChat } from '@/hooks/useChat';
import { MAX_QUESTION_CHARS, validateQuestion, type ChatMessage } from '@/lib/ai/chatMessages';
import type { Location } from '@/lib/client/api';
import type { Profile } from '@/lib/profile/schema';
import { useI18n } from '../ui/I18n';
import { ErrorNote, buttonPrimary, inputClass } from '../ui/Section';
import { ChatTrace } from './ChatTrace';

function MessageBubble({ message, pending }: { message: ChatMessage; pending: boolean }) {
  const { t } = useI18n();
  if (message.role === 'user') {
    return (
      <div className="max-w-[85%] self-end rounded-2xl rounded-br-sm bg-breath px-4 py-2 text-white">
        <span className="sr-only">{t('you')}: </span>
        {message.text}
      </div>
    );
  }
  return (
    <div className="max-w-[95%] rounded-2xl rounded-bl-sm border border-line bg-paper px-4 py-3">
      <p className="text-sm font-semibold text-breath">{t('saans')}</p>
      <p className="mt-1 whitespace-pre-line" data-testid="chat-answer">
        {message.text || (pending ? t('chatThinking') : '')}
      </p>
      {message.done ? <ChatTrace message={message} /> : null}
    </div>
  );
}

/** "Ask Saans": question box plus a live log of answers with their trace. */
export function ChatPanel({ location, profile }: { location: Location | null; profile: Profile }) {
  const { t, lang } = useI18n();
  const { messages, busy, error, ask } = useChat(location, profile, lang, t('errorGeneric'));
  const [question, setQuestion] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const tooLong = question.length > MAX_QUESTION_CHARS;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const text = question;
    if (validateQuestion(text, location !== null) === null) setQuestion('');
    await ask(text);
    inputRef.current?.focus();
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
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} pending={busy && i === messages.length - 1} />
        ))}
      </div>

      <form onSubmit={submit} className="mt-4 flex flex-col gap-2" noValidate>
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
            className={`text-sm ${tooLong ? 'font-semibold text-[#b3261e]' : 'text-muted'}`}
          >
            {question.length}/{MAX_QUESTION_CHARS}
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
