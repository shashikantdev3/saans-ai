'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchAir, fetchPlan, type Location, type PlanResponse } from '@/lib/client/api';
import type { AirSummary } from '@/lib/data/summary';
import { t as translate, type Lang, type MessageKey } from '@/lib/i18n';
import { DEFAULT_PROFILE, type Profile } from '@/lib/profile/schema';
import {
  clearProfile,
  loadPrefs,
  loadProfile,
  savePrefs,
  saveProfile,
} from '@/lib/profile/storage';
import { AirNow } from './air/AirNow';
import { ForecastChart } from './air/ForecastChart';
import { ChatPanel } from './chat/ChatPanel';
import { ImpactPanel } from './impact/ImpactPanel';
import { LocationPicker } from './location/LocationPicker';
import { PlanTimeline } from './plan/PlanTimeline';
import { ProfileForm } from './profile/ProfileForm';
import { Header } from './ui/Header';
import { LangProvider } from './ui/I18n';
import { ErrorNote, Section } from './ui/Section';
import { errorKey } from './ui/errors';

export function SaansApp() {
  const [lang, setLang] = useState<Lang>('en');
  const [largeText, setLargeText] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [air, setAir] = useState<AirSummary | null>(null);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [profileReady, setProfileReady] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState<'air' | 'plan' | null>(null);
  const [error, setError] = useState<{ where: 'air' | 'plan'; key: MessageKey } | null>(null);

  // Restore preferences and the saved household once, in the browser only.
  useEffect(() => {
    const prefs = loadPrefs();
    const saved = loadProfile();
    /* eslint-disable react-hooks/set-state-in-effect -- reading localStorage must wait for the browser */
    setLang(prefs.lang);
    setLargeText(prefs.largeText);
    if (saved) {
      setProfile(saved);
      setProfileReady(true);
      setFormKey((k) => k + 1);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.classList.toggle('large-text', largeText);
    savePrefs({ lang, largeText });
  }, [lang, largeText]);

  const buildPlan = useCallback(async (loc: Location, p: Profile, l: Lang) => {
    setLoading('plan');
    setError(null);
    try {
      setPlan(await fetchPlan(loc, p, l));
    } catch (err) {
      setPlan(null);
      setError({ where: 'plan', key: errorKey(err) });
    } finally {
      setLoading(null);
    }
  }, []);

  async function pickLocation(loc: Location) {
    setLocation(loc);
    setAir(null);
    setPlan(null);
    setLoading('air');
    setError(null);
    try {
      setAir(await fetchAir(loc));
      setLoading(null);
      if (profileReady) await buildPlan(loc, profile, lang);
    } catch (err) {
      setLoading(null);
      setError({ where: 'air', key: errorKey(err) });
    }
  }

  async function submitProfile(p: Profile) {
    setProfile(p);
    setProfileReady(true);
    saveProfile(p);
    if (location) await buildPlan(location, p, lang);
    document.getElementById('plan-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function changeLang(l: Lang) {
    setLang(l);
    if (location && plan) void buildPlan(location, profile, l);
  }

  const t = (key: MessageKey, params?: Record<string, string | number>) =>
    translate(lang, key, params);

  return (
    <LangProvider value={lang}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded focus:bg-paper focus:p-3"
      >
        {t('skipToContent')}
      </a>
      <div className="mx-auto max-w-3xl px-4 pb-16">
        <Header largeText={largeText} onLang={changeLang} onLargeText={setLargeText} />
        <p className="rounded-lg bg-breath-soft px-4 py-2 text-sm font-semibold" role="note">
          {t('disclaimer')}
        </p>
        <main id="main">
          <Section id="location" title={t('locationHeading')}>
            <LocationPicker onPick={pickLocation} />
            {loading === 'air' ? <p className="mt-4 text-muted">{t('loading')}</p> : null}
            {error?.where === 'air' ? <ErrorNote>{t(error.key)}</ErrorNote> : null}
            {air && location ? (
              <div className="mt-6 flex flex-col gap-6">
                <AirNow place={location.name} air={air} />
                <ForecastChart points={air.forecast} />
              </div>
            ) : null}
          </Section>

          <Section id="profile" title={t('profileHeading')} intro={t('profileIntro')}>
            <ProfileForm
              key={formKey}
              initial={profile}
              onSubmit={submitProfile}
              onClear={() => {
                clearProfile();
                setProfile(DEFAULT_PROFILE);
                setProfileReady(false);
                setPlan(null);
                setFormKey((k) => k + 1);
              }}
            />
          </Section>

          <Section id="plan" title={t('planHeading')}>
            {loading === 'plan' ? <p className="text-muted">{t('loading')}</p> : null}
            {error?.where === 'plan' ? <ErrorNote>{t(error.key)}</ErrorNote> : null}
            {plan ? (
              <PlanTimeline data={plan} />
            ) : loading ? null : (
              <p className="text-muted">{t('planEmpty')}</p>
            )}
          </Section>

          {plan ? (
            <Section id="impact" title={t('impactHeading')}>
              <ImpactPanel plan={plan.plan} />
            </Section>
          ) : null}

          <Section id="chat" title={t('chatHeading')} intro={t('chatIntro')}>
            <ChatPanel location={location} profile={profile} />
          </Section>
        </main>
        <footer className="mt-8 border-t border-line pt-6 text-sm text-muted">
          <p>{t('attribution')}</p>
          <p className="mt-1">{t('privacyNote')}</p>
          <p className="mt-2">
            <a
              className="font-semibold text-breath underline"
              href="https://github.com/shashikantdev3/saans-ai"
            >
              {t('footerSource')}
            </a>{' '}
            | {t('footerMethod')}
          </p>
        </footer>
      </div>
    </LangProvider>
  );
}
