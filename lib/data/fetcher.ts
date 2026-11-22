/**
 * Chooses how the server talks to Open-Meteo. Normal runs use the real network.
 * When SAANS_FIXTURES=1 (CI and end-to-end tests), recorded sample responses are served instead,
 * so tests are deterministic and never depend on a third-party service being up.
 */
import airBengaluru from './fixtures/air-bengaluru.json';
import airDelhi from './fixtures/air-delhi.json';
import geocode from './fixtures/geocode.json';
import weatherBengaluru from './fixtures/weather-bengaluru.json';
import weatherDelhi from './fixtures/weather-delhi.json';
import type { Fetcher } from './types';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** Southern India (lat < 20) gets the clean-air sample, everything else the smoggy Delhi sample. */
export const fixtureFetcher: Fetcher = async (input) => {
  const url = new URL(input);
  if (url.hostname.startsWith('geocoding')) {
    const query = (url.searchParams.get('name') ?? '').toLowerCase();
    const results = geocode.results.filter((r) => r.name.toLowerCase().includes(query));
    return json(results.length ? { results } : {});
  }
  const south = Number(url.searchParams.get('latitude')) < 20;
  if (url.hostname.startsWith('air-quality')) return json(south ? airBengaluru : airDelhi);
  return json(south ? weatherBengaluru : weatherDelhi);
};

export function getFetcher(): Fetcher {
  return process.env.SAANS_FIXTURES === '1' ? fixtureFetcher : (input, init) => fetch(input, init);
}
