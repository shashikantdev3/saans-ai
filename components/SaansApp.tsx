'use client';

import { usePreferences } from '@/hooks/usePreferences';
import { useSaans } from '@/hooks/useSaans';
import type { Lang } from '@/lib/i18n';
import { AirNow } from './air/AirNow';
import { ForecastChart } from './air/ForecastChart';
import { ChatPanel } from './chat/ChatPanel';
import { ImpactPanel } from './impact/ImpactPanel';
import { LocationPicker } from './location/LocationPicker';
import { PlanTimeline } from './plan/PlanTimeline';
import { ProfileForm } from './profile/ProfileForm';
import { Footer } from './ui/Footer';
import { Header } from './ui/Header';
import { LangProvider, useI18n } from './ui/I18n';
import { ErrorNote, Section } from './ui/Section';

/** Page shell: wires preferences and app state to the five sections. */
export function SaansApp() {
  const prefs = usePreferences();
  return (
    <LangProvider value={prefs.lang}>
      <SaansPage
        largeText={prefs.largeText}
        onLargeText={prefs.setLargeText}
        onLang={prefs.setLang}
      />
    </LangProvider>
  );
}

function SaansPage({
  largeText,
  onLargeText,
  onLang,
}: {
  largeText: boolean;
  onLargeText: (v: boolean) => void;
  onLang: (l: Lang) => void;
}) {
  const { t, lang } = useI18n();
  const app = useSaans(lang);

  const changeLang = (l: Lang) => {
    onLang(l);
    app.rebuildForLanguage(l);
  };

  const submitProfile = async (p: Parameters<typeof app.submitProfile>[0]) => {
    await app.submitProfile(p);
    document.getElementById('plan-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded focus:bg-paper focus:p-3"
      >
        {t('skipToContent')}
      </a>
      <div className="mx-auto max-w-3xl px-4 pb-16">
        <Header largeText={largeText} onLang={changeLang} onLargeText={onLargeText} />
        <p className="rounded-lg bg-breath-soft px-4 py-2 text-sm font-semibold" role="note">
          {t('disclaimer')}
        </p>
        <main id="main">
          <Section id="location" title={t('locationHeading')}>
            <LocationPicker onPick={app.pickLocation} />
            {app.loading === 'air' ? <p className="mt-4 text-muted">{t('loading')}</p> : null}
            {app.error?.where === 'air' ? <ErrorNote>{t(app.error.key)}</ErrorNote> : null}
            {app.air && app.location ? (
              <div className="mt-6 flex flex-col gap-6">
                <AirNow place={app.location.name} air={app.air} />
                <ForecastChart points={app.air.forecast} />
              </div>
            ) : null}
          </Section>

          <Section id="profile" title={t('profileHeading')} intro={t('profileIntro')}>
            <ProfileForm
              key={app.profileVersion}
              initial={app.profile}
              onSubmit={submitProfile}
              onClear={app.resetProfile}
            />
          </Section>

          <Section id="plan" title={t('planHeading')}>
            {app.loading === 'plan' ? <p className="text-muted">{t('loading')}</p> : null}
            {app.error?.where === 'plan' ? <ErrorNote>{t(app.error.key)}</ErrorNote> : null}
            {app.plan ? (
              <PlanTimeline data={app.plan} />
            ) : app.loading ? null : (
              <p className="text-muted">{t('planEmpty')}</p>
            )}
          </Section>

          {app.plan ? (
            <Section id="impact" title={t('impactHeading')}>
              <ImpactPanel plan={app.plan.plan} />
            </Section>
          ) : null}

          <Section id="chat" title={t('chatHeading')} intro={t('chatIntro')}>
            <ChatPanel location={app.location} profile={app.profile} />
          </Section>
        </main>
        <Footer />
      </div>
    </>
  );
}
