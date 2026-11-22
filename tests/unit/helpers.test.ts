import { describe, expect, it } from 'vitest';
import { applyEvent, historyFrom, validateQuestion, type ChatMessage } from '@/lib/ai/chatMessages';
import { parseProfile, toDraft } from '@/lib/profile/form';
import { planItem } from '@/lib/plan/rules';
import { DEFAULT_PROFILE } from '@/lib/profile/schema';

describe('chat transcript helpers', () => {
  const empty: ChatMessage = { role: 'model', text: '', trace: [] };

  it('validates questions', () => {
    expect(validateQuestion('hi', false)).toBe('chatNeedsPlace');
    expect(validateQuestion('   ', true)).toBe('chatEmpty');
    expect(validateQuestion('x'.repeat(501), true)).toBe('chatTooLong');
    expect(validateQuestion('Can I walk?', true)).toBeNull();
  });

  it('folds streamed events into one answer', () => {
    let m = applyEvent(empty, { type: 'text', delta: 'Hel' }, 'err');
    m = applyEvent(m, { type: 'text', delta: 'lo' }, 'err');
    m = applyEvent(m, { type: 'tool_call', name: 'get_forecast', args: {} }, 'err');
    expect(m.text).toBe('Hello');
    expect(m.trace).toHaveLength(1);
    m = applyEvent(m, { type: 'reset' }, 'err');
    expect(m).toMatchObject({ text: '', trace: [] });
    m = applyEvent(m, { type: 'done', source: 'rules', unverified: [] }, 'err');
    expect(m.done).toBe(true);
    expect(applyEvent(empty, { type: 'error', code: 'server' }, 'Oops').text).toBe('Oops');
  });

  it('keeps one meta event and trims history', () => {
    const household = toDraft(DEFAULT_PROFILE) as never;
    let m = applyEvent(
      empty,
      { type: 'meta', source: 'gemini', context: { place: 'A', household } },
      '',
    );
    m = applyEvent(m, { type: 'meta', source: 'rules', context: { place: 'B', household } }, '');
    expect(m.trace).toHaveLength(1);
    expect(m.source).toBe('rules');
    const many = Array.from({ length: 10 }, (_, i) => ({
      ...empty,
      text: `t${i}${'x'.repeat(2000)}`,
    }));
    const history = historyFrom(many);
    expect(history).toHaveLength(6);
    expect(history[0]?.text.length).toBe(1500);
  });
});

describe('profile form parsing', () => {
  it('round-trips a valid profile', () => {
    const result = parseProfile(DEFAULT_PROFILE, toDraft(DEFAULT_PROFILE));
    expect(result).toEqual({ ok: true, profile: DEFAULT_PROFILE });
  });

  it('reports every invalid field once', () => {
    const draft = { ...toDraft(DEFAULT_PROFILE), people: '', roomSizeM2: '500' };
    const result = parseProfile(DEFAULT_PROFILE, draft);
    expect(result).toEqual({ ok: false, invalid: ['people', 'roomSizeM2'] });
  });
});

describe('planItem', () => {
  it('omits time unless given', () => {
    expect(planItem('cleaning_wet', 'info')).toEqual({
      id: 'cleaning_wet',
      severity: 'info',
      params: {},
    });
    expect(planItem('windows_air_out', 'caution', { time: '15:00' }, '15:00').time).toBe('15:00');
  });
});
