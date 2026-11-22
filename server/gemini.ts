// ============================================================
// server/gemini.ts
// Shared Gemini client with a primary and an optional fallback model.
// Returns null when no key is set or every model fails, so callers
// can fall back to deterministic rules.
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_MODEL = 'gemini-3.1-flash-lite';
const REQUEST_TIMEOUT_MS = 15_000;

const apiKey = process.env.NODE_ENV === 'test' ? '' : (process.env.GEMINI_API_KEY?.trim() ?? '');
const client = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface GeminiRequest {
  prompt: string;
  systemInstruction: string;
  json?: boolean;
  maxOutputTokens?: number;
}

export interface GeminiResult {
  text: string;
  model: string;
}

/** Primary model from GEMINI_MODEL, then GEMINI_FALLBACK_MODEL if it is set and different. */
export function configuredModels(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const fallback = process.env.GEMINI_FALLBACK_MODEL?.trim();
  return fallback && fallback !== primary ? [primary, fallback] : [primary];
}

export async function generateWithGemini(request: GeminiRequest): Promise<GeminiResult | null> {
  if (!client) return null;

  for (const modelName of configuredModels()) {
    try {
      const model = client.getGenerativeModel(
        {
          model: modelName,
          systemInstruction: request.systemInstruction,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: request.maxOutputTokens ?? 2048,
            ...(request.json ? { responseMimeType: 'application/json' } : {}),
          },
        },
        { timeout: REQUEST_TIMEOUT_MS },
      );
      const result = await model.generateContent(request.prompt);
      const text = result.response.text().trim();
      if (text) return { text, model: modelName };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[GEMINI] ${modelName} failed: ${message}`);
    }
  }
  return null;
}

/** Removes markdown symbols so model text renders as plain sentences. */
export function toPlainText(text: string, maxLen: number): string {
  return text
    .replace(/[*#`_]+/g, '')
    .replace(/\s+\n/g, '\n')
    .trim()
    .slice(0, maxLen);
}
