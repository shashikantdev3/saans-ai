/**
 * Number guard: checks that every number in an AI answer appears in the data the tools
 * returned. Labels like N95, PM2.5 and the 112 helpline are allowed. Clock times are checked
 * against tool output as well, by hour.
 */
const ALLOWED_TOKENS =
  /\b(N95|FFP2|KN95|MERV-?1[34]|PM2\.5|PM10|PM 2\.5|NO2|SO2|O3|CO2|112|24h|24-hour|8-hour)\b/gi;
const NUMBER = /\d+(?:[.,]\d+)?/g;

function normalise(n: string): number {
  return Number(n.replace(',', '.'));
}

/** All numbers mentioned anywhere in the tool results (including nested JSON). */
export function numbersIn(data: unknown): Set<number> {
  const found = new Set<number>();
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  for (const m of text.match(NUMBER) ?? []) {
    const n = normalise(m);
    found.add(n);
    found.add(Math.round(n));
  }
  return found;
}

/** Numbers in `answer` that do not appear in `known`. Small counts (0 to 10) are allowed. */
export function unverifiedNumbers(answer: string, known: Set<number>): string[] {
  const cleaned = answer.replace(ALLOWED_TOKENS, ' ');
  const out: string[] = [];
  for (const m of cleaned.match(NUMBER) ?? []) {
    const n = normalise(m);
    if (n <= 10 || known.has(n) || known.has(Math.round(n))) continue;
    out.push(m);
  }
  return [...new Set(out)];
}
