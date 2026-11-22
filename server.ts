// ============================================================
// server.ts
// Express API gateway: security middleware, validated AI routes,
// response cache and SPA fallback. Runs locally via `npm run server`
// and on Vercel through api/index.ts.
// ============================================================

import 'dotenv/config';
import { existsSync } from 'fs';
import path from 'path';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import {
  aiRateLimiter,
  corsMiddleware,
  helmetMiddleware,
  safeErrorHandler,
} from './server/middleware.js';
import {
  sanitizeText,
  validatePersona,
  validateZone,
  type ValidatedPersona,
  type ValidatedZone,
} from './server/validators.js';
import { hashPayload, insightCache, pruneCache } from './server/cache.js';
import { getAiRoutineInsights, getEmergencyAdvisoryText } from './server/aiService.js';

export { insightCache };

const SUPPORTED_LANGUAGES = new Set(['en', 'hi', 'ar', 'es']);
const CACHE_TTL_MS = 15 * 60 * 1000;
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const INDEX_HTML = path.join(DIST_DIR, 'index.html');

function resolveLanguage(value: unknown): string {
  const lang = sanitizeText(value, 5).toLowerCase();
  return SUPPORTED_LANGUAGES.has(lang) ? lang : 'en';
}

/** Copies only validated fields so nothing unexpected reaches the prompt. */
function cleanZone(zone: ValidatedZone): ValidatedZone {
  return {
    zoneId: sanitizeText(zone.zoneId, 50),
    zoneName: sanitizeText(zone.zoneName, 100),
    aqi: zone.aqi,
    pm25: zone.pm25,
    pm10: zone.pm10,
    no2: zone.no2,
    temperatureC: zone.temperatureC,
    windSpeedKmh: zone.windSpeedKmh,
    inversionRisk: zone.inversionRisk === true,
  };
}

function cleanPersona(persona: ValidatedPersona): ValidatedPersona {
  return {
    id: sanitizeText(persona.id, 50),
    name: sanitizeText(persona.name, 100),
    subCategory: sanitizeText(persona.subCategory, 50),
    sensitivityLevel: sanitizeText(persona.sensitivityLevel, 20),
    preferredStartHour: persona.preferredStartHour,
    preferredEndHour: persona.preferredEndHour,
  };
}

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: '16kb' }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime(), cacheEntries: insightCache.size });
});

app.post(
  '/api/routine-insights',
  aiRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { persona, zone, language } = (req.body ?? {}) as Record<string, unknown>;

      if (!validatePersona(persona)) {
        res.status(400).json({ error: 'Invalid persona profile payload' });
        return;
      }
      if (!validateZone(zone)) {
        res.status(400).json({ error: 'Invalid zone telemetry payload' });
        return;
      }

      const safePersona = cleanPersona(persona);
      const safeZone = cleanZone(zone);
      const lang = resolveLanguage(language);

      const key = hashPayload({ persona: safePersona, zone: safeZone, lang });
      const cached = insightCache.get(key);
      if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
        res.json(cached.data);
        return;
      }

      const plan = await getAiRoutineInsights(safePersona, safeZone, lang);
      pruneCache();
      insightCache.set(key, { data: plan, cachedAt: Date.now() });
      res.json(plan);
    } catch (err) {
      next(err);
    }
  },
);

app.post(
  '/api/emergency-advisory',
  aiRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { zone, language } = (req.body ?? {}) as Record<string, unknown>;

      if (!validateZone(zone)) {
        res.status(400).json({ error: 'Invalid zone telemetry payload' });
        return;
      }

      const advisory = await getEmergencyAdvisoryText(cleanZone(zone), resolveLanguage(language));
      res.json({ advisory });
    } catch (err) {
      next(err);
    }
  },
);

// Unknown API routes get a JSON 404 instead of the SPA shell.
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Local production mode: serve the Vite build and fall back to index.html for client routes.
app.use(express.static(DIST_DIR));
app.get('/{*splat}', (_req: Request, res: Response) => {
  if (existsSync(INDEX_HTML)) {
    res.sendFile(INDEX_HTML);
    return;
  }
  res.type('text/plain').send('Saans API is running. Run `npm run build` to serve the frontend.');
});

// Malformed JSON bodies are a client error, not a server fault.
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  const type = (err as { type?: string } | null)?.type;
  if (type === 'entity.parse.failed' || type === 'entity.too.large') {
    res.status(400).json({ error: 'Malformed or oversized JSON body' });
    return;
  }
  safeErrorHandler(err, req, res, next);
});

// Vercel imports `app` from api/index.ts and Vitest starts its own listener,
// so only bind a port when this file is run directly.
if (!process.env.VERCEL && !process.env.VITEST) {
  const port = Number(process.env.PORT) || 3001;
  app.listen(port, () => {
    console.log(`[SAANS API] Listening on http://localhost:${port}`);
  });
}
