/**
 * Streams the chat answer as newline-delimited JSON events (see lib/ai/chatTypes.ts),
 * so the browser can show tool calls and text as they happen.
 */
import { chatEvents } from '@/lib/ai/chat';
import type { ChatEvent } from '@/lib/ai/chatTypes';
import { getFetcher } from '@/lib/data/fetcher';
import { getAirData } from '@/lib/data/openMeteo';
import { buildPlan } from '@/lib/plan/buildPlan';
import { errorResponse, rateLimited, readBody } from '@/lib/security/http';
import { limiters } from '@/lib/security/rateLimit';
import { chatBody } from '@/lib/security/schemas';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request): Promise<Response> {
  const limited = rateLimited(req, limiters.chat);
  if (limited) return limited;
  const body = await readBody(req, chatBody);
  if (!body.ok) return body.response;
  const { lat, lon, placeName, profile, lang, question, history } = body.data;

  let ctx;
  try {
    const air = await getAirData(lat, lon, getFetcher());
    ctx = { placeName, air, plan: buildPlan(air, profile), profile, lang };
  } catch {
    return errorResponse('upstream');
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        for await (const event of chatEvents(ctx, history, question)) send(event);
      } catch {
        send({ type: 'error', code: 'server' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}
