'use client';

import { useCallback, useState } from 'react';
import { errorKey } from '@/components/ui/errors';
import { applyEvent, historyFrom, validateQuestion, type ChatMessage } from '@/lib/ai/chatMessages';
import { streamChat, type Location } from '@/lib/client/api';
import type { Lang, MessageKey } from '@/lib/i18n';
import type { Profile } from '@/lib/profile/schema';

export interface ChatState {
  messages: ChatMessage[];
  busy: boolean;
  error: MessageKey | null;
  /** Returns true when the question was accepted and sent */
  ask: (question: string) => Promise<boolean>;
}

/** Chat transcript and the streaming call behind "Ask Saans". */
export function useChat(
  location: Location | null,
  profile: Profile,
  lang: Lang,
  errorText: string,
): ChatState {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);

  const ask = useCallback(
    async (raw: string) => {
      const problem = validateQuestion(raw, location !== null);
      if (problem || !location) {
        setError(problem);
        return false;
      }
      const question = raw.trim();
      const history = historyFrom(messages);
      setError(null);
      setMessages((all) => [
        ...all,
        { role: 'user', text: question, trace: [] },
        { role: 'model', text: '', trace: [] },
      ]);
      setBusy(true);
      try {
        await streamChat(location, profile, lang, question, history, (event) =>
          setMessages((all) => {
            const last = all[all.length - 1];
            return last ? [...all.slice(0, -1), applyEvent(last, event, errorText)] : all;
          }),
        );
      } catch (err) {
        setMessages((all) => all.slice(0, -1));
        setError(errorKey(err));
      } finally {
        setBusy(false);
      }
      return true;
    },
    [errorText, lang, location, messages, profile],
  );

  return { messages, busy, error, ask };
}
