/**
 * Deterministic checks that run before Gemini. They make the critical cases (emergencies,
 * obvious prompt injection, requests for diagnosis) predictable and free of model error.
 * Everything else is handled by the system prompt, which treats user text as data.
 */
export type SafetyVerdict = 'emergency' | 'injection' | 'medical' | 'ok';

const EMERGENCY = [
  /can'?t\s+breathe/i,
  /cannot\s+breathe/i,
  /unable\s+to\s+breathe/i,
  /not\s+able\s+to\s+breathe/i,
  /chest\s+pain/i,
  /\bfaint(ed|ing)?\b/i,
  /unconscious/i,
  /blue\s+lips/i,
  /lips\s+(are\s+|turning\s+)?blue/i,
  /choking/i,
  /saans\s+nahi/i,
  /सांस\s*नहीं/,
  /साँस\s*नहीं/,
  /सीने\s*में\s*दर्द/,
  /बेहोश/,
];

const INJECTION = [
  /ignore\s+(all\s+|any\s+|your\s+|the\s+|previous\s+|prior\s+)*(instructions|rules|prompt)/i,
  /disregard\s+(all\s+|your\s+|the\s+|previous\s+)*(instructions|rules)/i,
  /system\s+prompt/i,
  /you\s+are\s+now\s+/i,
  /developer\s+mode/i,
  /jailbreak/i,
  /reveal\s+(your\s+)?(instructions|prompt|api\s*key)/i,
];

const MEDICAL = [
  /\bdiagnos/i,
  /which\s+(medicine|medication|drug|inhaler)/i,
  /what\s+(medicine|medication|dose)/i,
  /prescri/i,
  /\bdosage\b/i,
  /कौन\s*सी\s*दवा/,
];

export function classifyMessage(text: string): SafetyVerdict {
  if (EMERGENCY.some((r) => r.test(text))) return 'emergency';
  if (INJECTION.some((r) => r.test(text))) return 'injection';
  if (MEDICAL.some((r) => r.test(text))) return 'medical';
  return 'ok';
}
