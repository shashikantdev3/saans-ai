/**
 * Gemini client (server side only). The key is read from the environment and never sent
 * to the browser. Returns null when no key is configured, which switches Saans to its
 * rule-based text.
 */
import 'server-only';
import { GoogleGenAI } from '@google/genai';

export interface GeminiConfig {
  client: GoogleGenAI;
  models: string[];
}

let cached: GeminiConfig | null | undefined;

export function getGemini(): GeminiConfig | null {
  if (cached !== undefined) return cached;
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  // Fixture mode (CI and end-to-end tests) is fully offline, so Gemini is off there too.
  if (!apiKey || process.env.SAANS_FIXTURES === '1') {
    cached = null;
    return cached;
  }
  const primary = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';
  const fallback = process.env.GEMINI_FALLBACK_MODEL?.trim();
  cached = {
    client: new GoogleGenAI({ apiKey }),
    models: fallback && fallback !== primary ? [primary, fallback] : [primary],
  };
  return cached;
}

/** Errors worth retrying on the fallback model: quota, overload, model not found. */
export function isRetryableModelError(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  return status === 429 || status === 503 || status === 404 || status === 500;
}
