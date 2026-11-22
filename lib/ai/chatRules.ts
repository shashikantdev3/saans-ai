/**
 * Rule-based chat answers, used when Gemini is unavailable or over quota.
 * Matches simple intents in English and Hindi and answers from the deterministic plan.
 */
import { t } from '../i18n';
import { bandLabel, describeAlternative, describeHack, describeItem } from '../plan/describe';
import type { PlanItem } from '../plan/rules';
import type { ToolContext } from './tools';

type Intent =
  'outdoor' | 'mask' | 'windows' | 'purifier' | 'commute' | 'aqi' | 'general' | 'off_topic';

const INTENTS: [Intent, RegExp][] = [
  ['outdoor', /(go out|outside|walk|run|jog|exercise|play|park|cricket|बाहर|टहल|खेल|कसरत|दौड़|सैर)/i],
  ['mask', /(mask|n95|ffp2|मास्क)/i],
  ['windows', /(window|ventilat|fresh air|खिड़की|खिड़की)/i],
  ['purifier', /(purifier|filter|incense|agarbatti|fry|cook|प्यूरीफ़ायर|फ़िल्टर|फिल्टर|अगरबत्ती|खाना)/i],
  [
    'commute',
    /(commute|car|metro|bus|office|travel|scooter|bike|auto|सफ़र|सफर|मेट्रो|कार|दफ़्तर|ऑफिस|बस)/i,
  ],
  ['aqi', /(aqi|air quality|pollution|smog|pm2\.?5|हवा|प्रदूषण|स्मॉग)/i],
  ['general', /(today|plan|should i|what can|help|tips|आज|प्लान|क्या करें|सुझाव)/i],
];

export function detectIntent(question: string): Intent {
  return INTENTS.find(([, re]) => re.test(question))?.[0] ?? 'off_topic';
}

function itemText(ctx: ToolContext, ids: PlanItem['id'][]): string {
  const item = ctx.plan.items.find((i) => ids.includes(i.id));
  return item ? describeItem(ctx.lang, item) : '';
}

/** Reads a clock hour from text like "5 pm", "17:00" or "शाम 5". Returns 0..23 or null. */
export function askedHour(question: string): number | null {
  const m = question.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|बजे)?/i);
  if (!m) return null;
  let hour = Number(m[1]);
  const suffix = m[3]?.toLowerCase();
  const evening = /(pm|शाम|रात)/i.test(question) || suffix === 'pm';
  if (!m[2] && !suffix && !/(शाम|सुबह|रात|दोपहर)/.test(question)) return null;
  if (evening && hour < 12) hour += 12;
  if (suffix === 'am' && hour === 12) hour = 0;
  return hour >= 0 && hour <= 23 ? hour : null;
}

function atHour(ctx: ToolContext, question: string): string {
  const hour = askedHour(question);
  const point = hour === null ? undefined : ctx.plan.forecast.find((w) => w.hour === hour);
  return point
    ? `${t(ctx.lang, 'chat_at_hour', { time: point.time, pm25: point.pm25, band: bandLabel(ctx.lang, point.band) })} `
    : '';
}

export function ruleAnswer(ctx: ToolContext, question: string): string {
  const { plan, lang } = ctx;
  const band = bandLabel(lang, plan.aqi?.band.band ?? plan.band);
  const aqi = plan.aqi?.aqi ?? '-';
  switch (detectIntent(question)) {
    case 'outdoor':
      return (
        atHour(ctx, question) +
        t(lang, 'chat_outdoor', {
          time: plan.best.time,
          pm25: plan.best.pm25,
          band: bandLabel(lang, plan.best.band),
          advice: itemText(ctx, ['outdoor_best', 'outdoor_light_only', 'outdoor_indoor_only']),
        })
      );
    case 'mask':
      return t(lang, 'chat_mask', {
        aqi,
        band,
        advice: itemText(ctx, ['mask_none', 'mask_sensitive', 'mask_all', 'mask_stay_in']),
      });
    case 'windows':
      return t(lang, 'chat_windows', {
        advice: itemText(ctx, ['windows_air_out', 'windows_open_ok']),
      });
    case 'purifier': {
      const hack = plan.hacks.find((h) => h.id === 'run_purifier' || h.id === 'fan_filter');
      return hack
        ? t(lang, 'chat_purifier', { ...describeHack(lang, hack) })
        : t(lang, 'safety_refusal');
    }
    case 'commute': {
      const advice = itemText(ctx, [
        'commute_wfh',
        'commute_active',
        'commute_two_wheeler',
        'commute_car',
        'commute_public',
      ]);
      const alt =
        plan.alternative.kind === 'commute'
          ? describeAlternative(lang, plan.alternative).detail
          : '';
      return t(lang, 'chat_commute', { advice, alt }).trim();
    }
    case 'aqi':
      return t(lang, 'chat_aqi', {
        place: ctx.placeName,
        aqi,
        band,
        pollutant: plan.aqi ? t(lang, `pollutant_${plan.aqi.dominant}`) : 'PM2.5',
        pm25: plan.currentPm25 ?? '-',
        time: plan.best.time,
      });
    case 'general':
      return t(lang, 'chat_general', {
        place: ctx.placeName,
        aqi,
        band,
        time: plan.best.time,
        percent: plan.dose.percentCut,
      });
    case 'off_topic':
      return t(lang, 'safety_refusal');
  }
}
