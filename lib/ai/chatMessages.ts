/**
 * Pure helpers for the chat transcript in the browser: applying streamed events to the
 * answer being built, validating a question, and trimming history before it is sent.
 */
import type { AnswerSource, ChatEvent, ChatTurn } from './chatTypes';

export const MAX_QUESTION_CHARS = 500;
const MAX_HISTORY_TURNS = 6;
const MAX_TURN_CHARS = 1500;

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  source?: AnswerSource;
  /** meta, tool_call and tool_result events, shown in the "How Saans answered" panel */
  trace: ChatEvent[];
  unverified?: string[];
  done?: boolean;
}

export type QuestionProblem = 'chatNeedsPlace' | 'chatEmpty' | 'chatTooLong';

export function validateQuestion(question: string, hasPlace: boolean): QuestionProblem | null {
  if (!hasPlace) return 'chatNeedsPlace';
  const q = question.trim();
  if (!q) return 'chatEmpty';
  if (q.length > MAX_QUESTION_CHARS) return 'chatTooLong';
  return null;
}

/** Last few turns with text, each capped, ready for the API. */
export function historyFrom(messages: readonly ChatMessage[]): ChatTurn[] {
  return messages
    .filter((m) => m.text)
    .slice(-MAX_HISTORY_TURNS)
    .map((m) => ({ role: m.role, text: m.text.slice(0, MAX_TURN_CHARS) }));
}

/** Fold one streamed event into the answer being built. */
export function applyEvent(message: ChatMessage, event: ChatEvent, errorText: string): ChatMessage {
  switch (event.type) {
    case 'text':
      return { ...message, text: message.text + event.delta };
    case 'reset':
      return { ...message, text: '', trace: [] };
    case 'meta':
      return {
        ...message,
        source: event.source,
        trace: [...message.trace.filter((x) => x.type !== 'meta'), event],
      };
    case 'done':
      return { ...message, source: event.source, unverified: event.unverified, done: true };
    case 'error':
      return { ...message, text: message.text || errorText, done: true };
    case 'tool_call':
    case 'tool_result':
      return { ...message, trace: [...message.trace, event] };
  }
}
