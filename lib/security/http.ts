/** Small helpers shared by the API routes. Errors never echo user input or internals. */
import type { z } from 'zod';
import { clientKey, type RateLimiter } from './rateLimit';

export type ErrorCode =
  'invalid' | 'rate_limited' | 'upstream' | 'too_large' | 'server' | 'insufficient_data';

const STATUS: Record<ErrorCode, number> = {
  invalid: 400,
  too_large: 413,
  rate_limited: 429,
  upstream: 502,
  server: 500,
  insufficient_data: 422,
};

const NO_STORE = { 'cache-control': 'no-store' };

export function json(body: unknown, init: ResponseInit = {}): Response {
  return Response.json(body, { ...init, headers: { ...NO_STORE, ...init.headers } });
}

export function errorResponse(code: ErrorCode, headers: HeadersInit = {}): Response {
  return json({ error: code }, { status: STATUS[code], headers });
}

/** Returns a 429 response when the client is over the limit, otherwise null. */
export function rateLimited(req: Request, limiter: RateLimiter): Response | null {
  const result = limiter.check(clientKey(req.headers));
  return result.ok
    ? null
    : errorResponse('rate_limited', { 'retry-after': String(result.retryAfterSeconds) });
}

const MAX_BODY_BYTES = 16_384;

/** Parse and validate a JSON body with a size cap. */
export async function readBody<T extends z.ZodType>(
  req: Request,
  schema: T,
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; response: Response }> {
  const length = Number(req.headers.get('content-length') ?? 0);
  if (length > MAX_BODY_BYTES) return { ok: false, response: errorResponse('too_large') };
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return { ok: false, response: errorResponse('invalid') };
  }
  if (raw.length > MAX_BODY_BYTES) return { ok: false, response: errorResponse('too_large') };
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success
      ? { ok: true, data: parsed.data }
      : { ok: false, response: errorResponse('invalid') };
  } catch {
    return { ok: false, response: errorResponse('invalid') };
  }
}

export function readQuery<T extends z.ZodType>(
  req: Request,
  schema: T,
): { ok: true; data: z.infer<T> } | { ok: false; response: Response } {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = schema.safeParse(params);
  return parsed.success
    ? { ok: true, data: parsed.data }
    : { ok: false, response: errorResponse('invalid') };
}
