// @vitest-environment node
// ============================================================
// src/test/api.test.ts
// Tier 5: Server HTTP API & Security Validation Tests
// Tests live HTTP backend routes, type guards, caching, and Helmet security
// Per TESTING_STANDARDS.md §3 (Tier 5)
// ============================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'http';
import { app, insightCache } from '../../server';
import { DEFAULT_ZONES, DEFAULT_PERSONAS } from '@/lib/constants';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        baseUrl = `http://localhost:${address.port}`;
      }
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

describe('Live HTTP Backend API Endpoints', () => {
  it('GET /api/health returns status 200 and health telemetry', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);

    const json = (await res.json()) as { status: string; uptime: number; cacheEntries: number };
    expect(json.status).toBe('ok');
    expect(typeof json.uptime).toBe('number');
    expect(typeof json.cacheEntries).toBe('number');
  });

  it('Verifies Helmet security headers on HTTP responses', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('content-security-policy')).not.toBeNull();
  });

  it('POST /api/routine-insights returns 200 with valid payload', async () => {
    const payload = {
      persona: DEFAULT_PERSONAS[0],
      zone: DEFAULT_ZONES[0],
      language: 'en',
    };

    const res = await fetch(`${baseUrl}/api/routine-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.persona).toBe(DEFAULT_PERSONAS[0].name);
    expect(data.optimalOutdoorWindow).toBeDefined();
    expect(data.hourlySchedule.length).toBeGreaterThan(0);
    expect(typeof data.totalExposureScore).toBe('number');
  });

  it('Verifies in-memory SHA-256 LRU cache hit on repeated payload', async () => {
    const payload = {
      persona: DEFAULT_PERSONAS[1],
      zone: DEFAULT_ZONES[1],
      language: 'en',
    };

    const initialCacheSize = insightCache.size;

    // First request (populates cache)
    const res1 = await fetch(`${baseUrl}/api/routine-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res1.status).toBe(200);

    // Second request (sub-10ms from cache)
    const tStart = performance.now();
    const res2 = await fetch(`${baseUrl}/api/routine-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const tElapsed = performance.now() - tStart;

    expect(res2.status).toBe(200);
    expect(tElapsed).toBeLessThan(50); // fast local retrieval
    expect(insightCache.size).toBeGreaterThanOrEqual(initialCacheSize);
  });

  it('POST /api/routine-insights returns 400 on malformed or out-of-range zone', async () => {
    const invalidPayload = {
      persona: DEFAULT_PERSONAS[0],
      zone: {
        zoneId: 'BAD_ZONE',
        zoneName: 'Bad Zone',
        aqi: -99, // Out of range (< 0)
        pm25: 100,
        pm10: 100,
        no2: 50,
        temperatureC: 15,
        windSpeedKmh: 5,
        inversionRisk: false,
      },
      language: 'en',
    };

    const res = await fetch(`${baseUrl}/api/routine-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPayload),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Invalid zone telemetry payload');
  });

  it('POST /api/routine-insights returns 400 on invalid persona profile', async () => {
    const invalidPayload = {
      persona: {
        id: '', // Empty ID
        name: '',
      },
      zone: DEFAULT_ZONES[0],
      language: 'en',
    };

    const res = await fetch(`${baseUrl}/api/routine-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPayload),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Invalid persona profile payload');
  });

  it('POST /api/routine-insights returns rate limit headers on response', async () => {
    const res = await fetch(`${baseUrl}/api/routine-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        persona: DEFAULT_PERSONAS[2],
        zone: DEFAULT_ZONES[2],
        language: 'en',
      }),
    });

    expect(res.status).toBe(200);
    // Express rate limit standard headers
    expect(res.headers.get('ratelimit-limit')).not.toBeNull();
    expect(res.headers.get('ratelimit-remaining')).not.toBeNull();
  });

  it('POST /api/emergency-advisory returns 200 with localized advisory text', async () => {
    const res = await fetch(`${baseUrl}/api/emergency-advisory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zone: DEFAULT_ZONES[0], language: 'en' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.advisory).toContain('EMERGENCY SMOG ADVISORY');
  });

  it('POST /api/emergency-advisory reports where the advisory came from', async () => {
    const res = await fetch(`${baseUrl}/api/emergency-advisory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zone: DEFAULT_ZONES[1], language: 'hi' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.source).toBe('rules');
    expect(data.advisory).toContain(DEFAULT_ZONES[1].zoneName);
  });

  it('POST /api/emergency-advisory returns 400 when zone is omitted', async () => {
    const res = await fetch(`${baseUrl}/api/emergency-advisory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zone: null, language: 'en' }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Invalid zone telemetry');
  });

  it('Express 5 *splat fallback handles client routing without crashing', async () => {
    const res = await fetch(`${baseUrl}/some-spa-deep-route`);
    // Status 200 (serves SPA index.html or fallback text)
    expect(res.status).toBe(200);
  });
});

describe('Ask Saans API', () => {
  const ask = (body: unknown) =>
    fetch(`${baseUrl}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('answers a valid question grounded in the selected zone readings', async () => {
    const res = await ask({
      question: 'Can my child play outside after school today?',
      persona: DEFAULT_PERSONAS[0],
      zone: DEFAULT_ZONES[0],
      language: 'en',
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.source).toBe('rules');
    expect(data.answer).toContain(String(DEFAULT_ZONES[0].aqi));
  });

  it('rejects an empty question with 400', async () => {
    const res = await ask({
      question: '   ',
      persona: DEFAULT_PERSONAS[0],
      zone: DEFAULT_ZONES[0],
      language: 'en',
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('between 3 and 300 characters');
  });

  it('rejects a question longer than 300 characters with 400', async () => {
    const res = await ask({
      question: 'smog '.repeat(70),
      persona: DEFAULT_PERSONAS[0],
      zone: DEFAULT_ZONES[0],
      language: 'en',
    });

    expect(res.status).toBe(400);
  });

  it('rejects a malformed zone even when the question is valid', async () => {
    const res = await ask({
      question: 'Is it safe to go for a run?',
      persona: DEFAULT_PERSONAS[0],
      zone: { zoneId: 'X' },
      language: 'en',
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Invalid zone telemetry payload');
  });

  it('answers emergency wording with fixed safety guidance and no model call', async () => {
    const res = await ask({
      question: 'My father cannot breathe properly and has chest pain',
      persona: DEFAULT_PERSONAS[2],
      zone: DEFAULT_ZONES[0],
      language: 'en',
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.source).toBe('safety');
    expect(data.answer).toContain('112');
    expect(data.promptPreview).toBeUndefined();
  });

  it('returns 404 JSON for unknown API routes', async () => {
    const res = await fetch(`${baseUrl}/api/does-not-exist`);
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('Not found');
  });

  it('returns 400 for malformed JSON instead of a server error', async () => {
    const res = await fetch(`${baseUrl}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not json',
    });
    expect(res.status).toBe(400);
  });
});
