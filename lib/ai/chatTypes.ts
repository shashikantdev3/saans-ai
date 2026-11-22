/** Shared between the chat API (server) and the chat panel (browser). */
import type { HouseholdContext } from './redact';

export type AnswerSource = 'gemini' | 'rules' | 'safety';

export type ChatEvent =
  | { type: 'meta'; source: AnswerSource; context: { place: string; household: HouseholdContext } }
  | { type: 'tool_call'; name: string; args: unknown }
  | { type: 'tool_result'; name: string; result: unknown }
  | { type: 'text'; delta: string }
  /** Discard text streamed so far (used when we switch to the rule-based answer mid-stream) */
  | { type: 'reset' }
  | { type: 'done'; source: AnswerSource; unverified: string[] }
  | { type: 'error'; code: 'rate_limited' | 'upstream' | 'invalid' | 'server' };

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}
