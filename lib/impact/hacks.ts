/**
 * Low-cost indoor hacks with an estimated effect from the same mass-balance model.
 * Effects are steady-state estimates for the main room, not measurements.
 */
import { FACTORS, type Confidence } from './factors';
import { indoorPm25, percentCut, roomVolume, sourceIncrement } from './indoor';

export interface Hack {
  id: 'close_windows' | 'run_purifier' | 'fan_filter' | 'no_incense' | 'cook_smart' | 'wet_mop';
  /** Indoor PM2.5 (µg/m³) before and after, when we can quantify it */
  before?: number;
  after?: number;
  /** Percentage cut in indoor PM2.5, or the µg/m³ avoided for source hacks */
  percent?: number;
  avoided?: number;
  confidence: Confidence;
  factors: (keyof typeof FACTORS)[];
}

export interface HackContext {
  outdoorPm25: number;
  roomSizeM2: number;
  hasPurifier: boolean;
}

const round = (n: number) => Math.round(n);

export function indoorHacks(ctx: HackContext): Hack[] {
  const v = roomVolume(ctx.roomSizeM2);
  const open = indoorPm25({
    outdoor: ctx.outdoorPm25,
    airExchange: FACTORS.airExchangeOpen.value,
    volumeM3: v,
  });
  const closed = indoorPm25({
    outdoor: ctx.outdoorPm25,
    airExchange: FACTORS.airExchangeClosed.value,
    volumeM3: v,
  });
  const hacks: Hack[] = [
    {
      id: 'close_windows',
      before: round(open),
      after: round(closed),
      percent: percentCut(open, closed),
      confidence: 'low',
      factors: ['airExchangeOpen', 'airExchangeClosed', 'penetration', 'deposition'],
    },
  ];

  const filterKey = ctx.hasPurifier ? 'purifierCadr' : 'boxFanFilterCadr';
  const filtered = indoorPm25({
    outdoor: ctx.outdoorPm25,
    airExchange: FACTORS.airExchangeClosed.value,
    volumeM3: v,
    cadrM3h: FACTORS[filterKey].value,
  });
  hacks.push({
    id: ctx.hasPurifier ? 'run_purifier' : 'fan_filter',
    before: round(closed),
    after: round(filtered),
    percent: percentCut(closed, filtered),
    confidence: ctx.hasPurifier ? 'low' : 'medium',
    factors: [filterKey, 'airExchangeClosed'],
  });

  hacks.push({
    id: 'no_incense',
    avoided: round(
      sourceIncrement(FACTORS.incenseMgPerHour.value, FACTORS.airExchangeClosed.value, v),
    ),
    confidence: 'medium',
    factors: ['incenseMgPerHour', 'airExchangeClosed'],
  });

  const frying = FACTORS.fryingMgPerMin.value * 60;
  const fryingIncrement = sourceIncrement(frying, FACTORS.airExchangeClosed.value, v);
  hacks.push({
    id: 'cook_smart',
    avoided: round(fryingIncrement * FACTORS.rangeHoodCapture.value),
    confidence: 'medium',
    factors: ['fryingMgPerMin', 'rangeHoodCapture'],
  });

  hacks.push({ id: 'wet_mop', confidence: 'low', factors: [] });
  return hacks;
}
