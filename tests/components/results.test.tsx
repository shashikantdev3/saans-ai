// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AirNow } from '@/components/air/AirNow';
import { ForecastChart, compass } from '@/components/air/ForecastChart';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { ChatTrace } from '@/components/chat/ChatTrace';
import { ImpactPanel } from '@/components/impact/ImpactPanel';
import { PlanTimeline } from '@/components/plan/PlanTimeline';
import { BandBadge } from '@/components/ui/BandBadge';
import { Header } from '@/components/ui/Header';
import { ruleExplanation } from '@/lib/ai/explainPlan';
import { DEFAULT_PROFILE } from '@/lib/profile/schema';
import { delhiSample, renderIn } from './render';

const { plan, air } = await delhiSample();

describe('air components', () => {
  it('pairs every AQI colour with a text label, in both languages', () => {
    renderIn(<BandBadge band="very_poor" />);
    expect(screen.getByText('Very Poor')).toBeTruthy();
    renderIn(<BandBadge band="severe" />, 'hi');
    expect(screen.getByText('गंभीर')).toBeTruthy();
  });

  it('shows the Indian AQI, US AQI and the modelled-data note', () => {
    renderIn(<AirNow place="Delhi" air={air} />);
    expect(screen.getByTestId('indian-aqi').textContent).toBe(String(air.aqi?.aqi));
    expect(screen.getAllByText(/US AQI/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Modelled data/)).toBeTruthy();
  });

  it('gives the chart a text alternative and a full data table', () => {
    renderIn(<ForecastChart points={air.forecast} />);
    expect(screen.getByRole('img', { name: /PM2.5 forecast, next 72 hours/ })).toBeTruthy();
    expect(screen.getAllByRole('row')).toHaveLength(air.forecast.length + 1);
    expect(compass(0)).toBe('N');
    expect(compass(225)).toBe('SW');
  });
});

describe('plan and impact', () => {
  it('labels rule-based text and shows the cleanest hour', () => {
    renderIn(<PlanTimeline data={{ plan, explanation: ruleExplanation(plan, 'en') }} />);
    expect(screen.getByTestId('plan-source').textContent).toBe('Rule-based text');
    expect(screen.getByTestId('best-time').textContent).toBe(plan.best.time);
  });

  it('labels Gemini text as AI', () => {
    const explanation = { ...ruleExplanation(plan, 'en'), source: 'gemini' as const };
    renderIn(<PlanTimeline data={{ plan, explanation }} />);
    expect(screen.getByTestId('plan-source').textContent).toBe('AI explanation (Gemini)');
  });

  it('states the dose cut and lists hacks with sources', () => {
    renderIn(<ImpactPanel plan={plan} />);
    expect(screen.getByTestId('dose-headline').textContent).toContain(`${plan.dose.percentCut}%`);
    expect(screen.getByText('Low-cost indoor hacks')).toBeTruthy();
    expect(screen.getAllByText('Sources and assumptions').length).toBeGreaterThan(0);
  });
});

describe('chat components', () => {
  it('shows what Gemini saw, each tool call, and the number check', () => {
    renderIn(
      <ChatTrace
        message={{
          role: 'model',
          text: 'Go at 15:00.',
          source: 'gemini',
          done: true,
          unverified: [],
          trace: [
            { type: 'meta', source: 'gemini', context: { place: 'Delhi', household: {} as never } },
            { type: 'tool_call', name: 'get_forecast', args: { hours: 24 } },
            { type: 'tool_result', name: 'get_forecast', result: { pm25: 42 } },
          ],
        }}
      />,
    );
    expect(screen.getByText('Context sent to Gemini (no personal details)')).toBeTruthy();
    expect(screen.getByTestId('trace-tool-call').textContent).toContain('get_forecast');
    expect(screen.getByText(/Every number in this answer was found/)).toBeTruthy();
  });

  it('flags unverified numbers', () => {
    renderIn(
      <ChatTrace
        message={{
          role: 'model',
          text: 'x',
          source: 'gemini',
          done: true,
          unverified: ['987'],
          trace: [],
        }}
      />,
    );
    expect(screen.getByText(/987/)).toBeTruthy();
  });

  it('asks for a place before sending a question', () => {
    renderIn(<ChatPanel location={null} profile={DEFAULT_PROFILE} />);
    fireEvent.change(screen.getByLabelText('Your question'), { target: { value: 'Can I walk?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
    expect(screen.getByRole('alert').textContent).toContain('Choose a place first');
  });
});

describe('header', () => {
  it('exposes language and large-text toggles as pressed buttons', () => {
    const onLang = vi.fn();
    const onLargeText = vi.fn();
    renderIn(<Header largeText={false} onLang={onLang} onLargeText={onLargeText} />);
    expect(screen.getByRole('button', { name: 'English' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: 'हिंदी' }));
    expect(onLang).toHaveBeenCalledWith('hi');
    fireEvent.click(screen.getByRole('button', { name: /Large text/ }));
    expect(onLargeText).toHaveBeenCalledWith(true);
  });
});
