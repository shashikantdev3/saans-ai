/** Browser calls to the Saans API. The browser never talks to Open-Meteo or Gemini directly. */
import type { PlanExplanation } from '../ai/explainPlan';
import type { ChatEvent, ChatTurn } from '../ai/chatTypes';
import type { AirSummary } from '../data/summary';
import type { Place } from '../data/types';
import type { Lang } from '../i18n';
import type { Plan } from '../plan/buildPlan';
import type { Profile } from '../profile/schema';

export type ApiErrorCode =
  'invalid' | 'rate_limited' | 'upstream' | 'server' | 'insufficient_data' | 'too_large';

export class ApiError extends Error {
  constructor(readonly code: ApiErrorCode) {
    super(code);
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    throw new ApiError('upstream');
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: ApiErrorCode };
    throw new ApiError(body.error ?? 'server');
  }
  return res.json() as Promise<T>;
}

export interface Location {
  name: string;
  lat: number;
  lon: number;
}

export const searchPlaces = (q: string) =>
  call<{ places: Place[] }>(`/api/geocode?q=${encodeURIComponent(q)}`).then((r) => r.places);

export const fetchAir = (loc: Location) =>
  call<{ air: AirSummary }>(`/api/air-quality?lat=${loc.lat}&lon=${loc.lon}`).then((r) => r.air);

export interface PlanResponse {
  plan: Plan;
  explanation: PlanExplanation;
}

export const fetchPlan = (loc: Location, profile: Profile, lang: Lang) =>
  call<PlanResponse>('/api/plan', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ lat: loc.lat, lon: loc.lon, placeName: loc.name, profile, lang }),
  });

/** Streams chat events (NDJSON) and calls onEvent for each one. */
export async function streamChat(
  loc: Location,
  profile: Profile,
  lang: Lang,
  question: string,
  history: ChatTurn[],
  onEvent: (e: ChatEvent) => void,
): Promise<void> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      lat: loc.lat,
      lon: loc.lon,
      placeName: loc.name,
      profile,
      lang,
      question,
      history,
    }),
  });
  if (!res.ok || !res.body) {
    const body = (await res.json().catch(() => ({}))) as { error?: ApiErrorCode };
    throw new ApiError(body.error ?? 'server');
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) if (line.trim()) onEvent(JSON.parse(line) as ChatEvent);
  }
  if (buffer.trim()) onEvent(JSON.parse(buffer) as ChatEvent);
}
