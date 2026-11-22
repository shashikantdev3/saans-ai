'use client';

import { useState, type FormEvent } from 'react';
import { searchPlaces, type Location } from '@/lib/client/api';
import type { Place } from '@/lib/data/types';
import type { MessageKey } from '@/lib/i18n';
import { useI18n } from '../ui/I18n';
import { ErrorNote, buttonPrimary, buttonQuiet, inputClass } from '../ui/Section';
import { errorKey } from '../ui/errors';

const QUICK: Location[] = [
  { name: 'Delhi', lat: 28.65, lon: 77.23 },
  { name: 'Noida', lat: 28.58, lon: 77.33 },
  { name: 'Gurugram', lat: 28.46, lon: 77.03 },
  { name: 'Lucknow', lat: 26.84, lon: 80.92 },
  { name: 'Patna', lat: 25.59, lon: 85.14 },
  { name: 'Bengaluru', lat: 12.97, lon: 77.59 },
];

const VALID_NAME = /^[\p{L}\p{M}\s.,'-]+$/u;

export function LocationPicker({ onPick }: { onPick: (loc: Location) => void }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [message, setMessage] = useState<{
    key: MessageKey;
    params?: Record<string, string>;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    setResults([]);
    if (q.length < 2) return setMessage({ key: 'searchTooShort' });
    if (!VALID_NAME.test(q)) return setMessage({ key: 'searchInvalid' });
    setBusy(true);
    setMessage(null);
    try {
      const places = await searchPlaces(q);
      if (places.length === 0) setMessage({ key: 'noPlaceFound', params: { query: q } });
      setResults(places);
    } catch (error) {
      setMessage({ key: errorKey(error) });
    } finally {
      setBusy(false);
    }
  }

  function useMyLocation() {
    setMessage(null);
    if (!('geolocation' in navigator)) return setMessage({ key: 'geoUnavailable' });
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        onPick({ name: t('myLocation'), lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      (err) => {
        setBusy(false);
        setMessage({ key: err.code === err.PERMISSION_DENIED ? 'geoDenied' : 'geoUnavailable' });
      },
      { timeout: 10_000, maximumAge: 600_000 },
    );
  }

  return (
    <div>
      <form onSubmit={onSearch} className="flex flex-col gap-2 sm:flex-row sm:items-end" noValidate>
        <div className="flex-1">
          <label htmlFor="city" className="mb-1 block font-semibold">
            {t('searchLabel')}
          </label>
          <input
            id="city"
            name="city"
            className={inputClass}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            autoComplete="address-level2"
            maxLength={80}
            aria-describedby={message ? 'city-status' : undefined}
          />
        </div>
        <button type="submit" className={buttonPrimary} disabled={busy}>
          {t('searchButton')}
        </button>
        <button type="button" className={buttonQuiet} onClick={useMyLocation} disabled={busy}>
          {t('useMyLocation')}
        </button>
      </form>

      <div id="city-status" aria-live="polite">
        {busy ? <p className="mt-3 text-muted">{t('loading')}</p> : null}
        {message ? <ErrorNote>{t(message.key, message.params)}</ErrorNote> : null}
      </div>

      {results.length > 0 ? (
        <fieldset className="mt-4">
          <legend className="font-semibold">{t('chooseResult')}</legend>
          <ul className="mt-2 flex flex-col gap-2">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`${buttonQuiet} w-full justify-start text-left`}
                  onClick={() => {
                    setResults([]);
                    onPick({ name: p.name, lat: p.lat, lon: p.lon });
                  }}
                >
                  {[p.name, p.admin1, p.country].filter(Boolean).join(', ')}
                </button>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : null}

      <p className="mt-5 text-sm font-semibold text-muted">{t('quickCities')}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {QUICK.map((c) => (
          <li key={c.name}>
            <button
              type="button"
              className={`${buttonQuiet} min-h-11 rounded-full px-4 py-1`}
              onClick={() => onPick(c)}
            >
              {c.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
