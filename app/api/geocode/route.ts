import { getFetcher } from '@/lib/data/fetcher';
import { searchPlaces } from '@/lib/data/openMeteo';
import { errorResponse, json, rateLimited, readQuery } from '@/lib/security/http';
import { limiters } from '@/lib/security/rateLimit';
import { geocodeQuery } from '@/lib/security/schemas';

export const runtime = 'nodejs';

export async function GET(req: Request): Promise<Response> {
  const limited = rateLimited(req, limiters.geocode);
  if (limited) return limited;
  const query = readQuery(req, geocodeQuery);
  if (!query.ok) return query.response;
  try {
    const places = await searchPlaces(query.data.q, getFetcher());
    return json({ places });
  } catch {
    return errorResponse('upstream');
  }
}
