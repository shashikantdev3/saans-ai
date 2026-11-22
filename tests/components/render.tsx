import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import { LangProvider } from '@/components/ui/I18n';
import { fixtureFetcher } from '@/lib/data/fetcher';
import { getAirData } from '@/lib/data/openMeteo';
import { summarise } from '@/lib/data/summary';
import type { Lang } from '@/lib/i18n';
import { buildPlan, type Plan } from '@/lib/plan/buildPlan';
import { SAMPLE_PROFILE } from '@/lib/profile/schema';

/** Render inside the language provider, as the app does. */
export function renderIn(ui: ReactElement, lang: Lang = 'en'): RenderResult {
  return render(<LangProvider value={lang}>{ui}</LangProvider>);
}

/** Real plan and air summary built from the recorded Delhi sample. */
export async function delhiSample(): Promise<{ plan: Plan; air: ReturnType<typeof summarise> }> {
  const air = await getAirData(28.65, 77.23, fixtureFetcher);
  return { plan: buildPlan(air, SAMPLE_PROFILE), air: summarise(air) };
}
