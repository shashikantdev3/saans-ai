'use client';

import { useCallback, useEffect, useState } from 'react';
import { errorKey } from '@/components/ui/errors';
import { fetchAir, fetchPlan, type Location, type PlanResponse } from '@/lib/client/api';
import type { AirSummary } from '@/lib/data/summary';
import type { Lang, MessageKey } from '@/lib/i18n';
import { DEFAULT_PROFILE, type Profile } from '@/lib/profile/schema';
import { clearProfile, loadProfile, saveProfile } from '@/lib/profile/storage';

export type LoadingState = 'air' | 'plan' | null;
export interface AppError {
  where: 'air' | 'plan';
  key: MessageKey;
}

export interface SaansState {
  location: Location | null;
  air: AirSummary | null;
  profile: Profile;
  /** Changes when the stored profile is replaced, so the form can remount with new values */
  profileVersion: number;
  plan: PlanResponse | null;
  loading: LoadingState;
  error: AppError | null;
  pickLocation: (loc: Location) => Promise<void>;
  submitProfile: (profile: Profile) => Promise<void>;
  resetProfile: () => void;
  rebuildForLanguage: (lang: Lang) => void;
}

/** All app state and actions in one place, so components only render. */
export function useSaans(lang: Lang): SaansState {
  const [location, setLocation] = useState<Location | null>(null);
  const [air, setAir] = useState<AirSummary | null>(null);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [profileReady, setProfileReady] = useState(false);
  const [profileVersion, setProfileVersion] = useState(0);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState<LoadingState>(null);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    const saved = loadProfile();
    if (!saved) return;
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage is only readable after mount */
    setProfile(saved);
    setProfileReady(true);
    setProfileVersion((v) => v + 1);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

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

  const pickLocation = useCallback(
    async (loc: Location) => {
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
    },
    [buildPlan, lang, profile, profileReady],
  );

  const submitProfile = useCallback(
    async (p: Profile) => {
      setProfile(p);
      setProfileReady(true);
      saveProfile(p);
      if (location) await buildPlan(location, p, lang);
    },
    [buildPlan, lang, location],
  );

  const resetProfile = useCallback(() => {
    clearProfile();
    setProfile(DEFAULT_PROFILE);
    setProfileReady(false);
    setPlan(null);
    setProfileVersion((v) => v + 1);
  }, []);

  const rebuildForLanguage = useCallback(
    (l: Lang) => {
      if (location && plan) void buildPlan(location, profile, l);
    },
    [buildPlan, location, plan, profile],
  );

  return {
    location,
    air,
    profile,
    profileVersion,
    plan,
    loading,
    error,
    pickLocation,
    submitProfile,
    resetProfile,
    rebuildForLanguage,
  };
}
