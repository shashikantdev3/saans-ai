// ============================================================
// src/types/ask.ts
// Where an AI-facing answer came from, and the Ask Saans response
// ============================================================

/** gemini = live model output, rules = deterministic fallback, safety = fixed emergency guidance. */
export type AiSource = 'gemini' | 'rules' | 'safety';

export interface AskResponse {
  answer: string;
  source: AiSource;
  model?: string;
  promptPreview?: string;
}

export interface AdvisoryResponse {
  advisory: string;
  source: AiSource;
  model?: string;
}
