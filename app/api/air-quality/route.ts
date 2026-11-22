import { getFetcher } from '@/lib/data/fetcher';
import { getAirData } from '@/lib/data/openMeteo';
import { summarise } from '@/lib/data/summary';
import { errorResponse, json, rateLimited, readQuery } from '@/lib/security/http';
import { limiters } from '@/lib/security/rateLimit';
import { airQualityQuery } from '@/lib/security/schemas';

export const runtime = 'nodejs';

export async function GET(req: Request): Promise<Response> {
  const limited = rateLimited(req, limiters.airQuality);
  if (limited) return limited;
  const query = readQuery(req, airQualityQuery);
  if (!query.ok) return query.response;
  try {
    const air = await getAirData(query.data.lat, query.data.lon, getFetcher());
    return json({ air: summarise(air) });
  } catch {
    return errorResponse('upstream');
  }
}
