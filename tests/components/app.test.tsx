// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as airQuality } from '@/app/api/air-quality/route';
import { POST as chat } from '@/app/api/chat/route';
import { POST as plan } from '@/app/api/plan/route';
import { SaansApp } from '@/components/SaansApp';
import { ApiError, streamChat } from '@/lib/client/api';
import { DEFAULT_PROFILE } from '@/lib/profile/schema';
import { loadPrefs, loadProfile, savePrefs, saveProfile } from '@/lib/profile/storage';

/** Route browser fetches to the real API handlers (Open-Meteo is served from fixtures). */
function wireApi() {
  vi.stubGlobal('fetch', async (input: string, init?: RequestInit) => {
    const url = new URL(input, 'http://localhost');
    const req = new Request(url, {
      ...init,
      headers: { 'x-forwarded-for': `9.9.9.${Math.random()}` },
    });
    if (url.pathname === '/api/air-quality') return airQuality(req);
    if (url.pathname === '/api/plan') return plan(req);
    if (url.pathname === '/api/chat') return chat(req);
    return new Response('{}', { status: 404 });
  });
}

beforeEach(() => {
  window.localStorage.clear();
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  wireApi();
});
afterEach(() => vi.unstubAllGlobals());

describe('Saans end to end in the DOM', () => {
  it('goes from a city to a plan, impact and a chat answer', async () => {
    render(<SaansApp />);
    fireEvent.click(screen.getByRole('button', { name: 'Delhi' }));
    expect(await screen.findByTestId('indian-aqi')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Try a sample family' }));
    expect(await screen.findByTestId('plan-source')).toBeTruthy();
    expect(screen.getByTestId('dose-headline').textContent).toMatch(/\d+%/);
    expect(loadProfile()?.people).toBe(4);

    fireEvent.change(screen.getByLabelText('Your question'), {
      target: { value: 'Should I wear a mask?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
    await waitFor(() => expect(screen.getByTestId('chat-answer').textContent).toContain('N95'));
  });

  it('switches the whole page to Hindi and remembers it', async () => {
    render(<SaansApp />);
    fireEvent.click(screen.getByRole('button', { name: 'हिंदी' }));
    expect(await screen.findByRole('heading', { name: '1. आप कहाँ हैं?' })).toBeTruthy();
    await waitFor(() => expect(loadPrefs().lang).toBe('hi'));
    expect(document.documentElement.lang).toBe('hi');
  });

  it('shows a clear message when the air service fails', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ error: 'upstream' }, { status: 502 }));
    render(<SaansApp />);
    fireEvent.click(screen.getByRole('button', { name: 'Delhi' }));
    expect((await screen.findByRole('alert')).textContent).toContain('not responding');
  });
});

describe('browser storage and API client', () => {
  it('ignores corrupted or invalid stored data', () => {
    window.localStorage.setItem('saans.profile.v1', '{not json');
    expect(loadProfile()).toBeNull();
    saveProfile({ ...DEFAULT_PROFILE, people: 2 });
    expect(loadProfile()?.people).toBe(2);
    savePrefs({ lang: 'hi', largeText: true });
    expect(loadPrefs()).toEqual({ lang: 'hi', largeText: true });
  });

  it('parses a streamed NDJSON answer split across chunks', async () => {
    const body = new ReadableStream({
      start(c) {
        const enc = new TextEncoder();
        c.enqueue(enc.encode('{"type":"text","delta":"Hel'));
        c.enqueue(enc.encode('lo"}\n{"type":"done","source":"rules","unverified":[]}'));
        c.close();
      },
    });
    vi.stubGlobal('fetch', async () => new Response(body));
    const events: string[] = [];
    await streamChat({ name: 'Delhi', lat: 28.6, lon: 77.2 }, DEFAULT_PROFILE, 'en', 'q', [], (e) =>
      events.push(e.type),
    );
    expect(events).toEqual(['text', 'done']);
  });

  it('turns HTTP errors into typed API errors', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ error: 'rate_limited' }, { status: 429 }));
    await expect(
      streamChat({ name: 'Delhi', lat: 28.6, lon: 77.2 }, DEFAULT_PROFILE, 'en', 'q', [], () => {}),
    ).rejects.toEqual(new ApiError('rate_limited'));
  });
});
