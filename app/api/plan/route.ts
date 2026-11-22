import { explainPlan } from '@/lib/ai/explainPlan';
import { householdContext } from '@/lib/ai/redact';
import { getFetcher } from '@/lib/data/fetcher';
import { getAirData } from '@/lib/data/openMeteo';
import { buildPlan, InsufficientDataError } from '@/lib/plan/buildPlan';
import { errorResponse, json, rateLimited, readBody } from '@/lib/security/http';
import { limiters } from '@/lib/security/rateLimit';
import { planBody } from '@/lib/security/schemas';

export const runtime = 'nodejs';

export async function POST(req: Request): Promise<Response> {
  const limited = rateLimited(req, limiters.plan);
  if (limited) return limited;
  const body = await readBody(req, planBody);
  if (!body.ok) return body.response;
  const { lat, lon, placeName, profile, lang } = body.data;

  let air;
  try {
    air = await getAirData(lat, lon, getFetcher());
  } catch {
    return errorResponse('upstream');
  }
  try {
    const plan = buildPlan(air, profile);
    const explanation = await explainPlan(plan, placeName, lang, householdContext(profile));
    return json({ plan, explanation });
  } catch (error) {
    return errorResponse(error instanceof InsufficientDataError ? 'insufficient_data' : 'server');
  }
}
