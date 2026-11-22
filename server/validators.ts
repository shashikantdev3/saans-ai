// ============================================================
// server/validators.ts
// Strict boundary type guards and input sanitization
// ============================================================

export function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export function sanitizeText(text: unknown, maxLen = 2000): string {
  if (typeof text !== 'string') return '';
  const controlCharPattern = new RegExp(
    '[' + String.fromCharCode(0) + '-' + String.fromCharCode(31) + ']',
    'g',
  );
  return text.replace(controlCharPattern, '').trim().slice(0, maxLen);
}

export interface ValidatedZone {
  zoneId: string;
  zoneName: string;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  temperatureC: number;
  windSpeedKmh: number;
  inversionRisk: boolean;
}

export function validateZone(z: unknown): z is ValidatedZone {
  if (typeof z !== 'object' || z === null) return false;
  const obj = z as Record<string, unknown>;

  if (typeof obj.zoneId !== 'string' || obj.zoneId.length === 0 || obj.zoneId.length > 50)
    return false;
  if (typeof obj.zoneName !== 'string' || obj.zoneName.length === 0 || obj.zoneName.length > 100)
    return false;
  if (!isFiniteNumber(obj.aqi) || obj.aqi < 0 || obj.aqi > 2000) return false;
  if (!isFiniteNumber(obj.pm25) || obj.pm25 < 0 || obj.pm25 > 2000) return false;
  if (!isFiniteNumber(obj.pm10) || obj.pm10 < 0 || obj.pm10 > 2000) return false;
  if (!isFiniteNumber(obj.no2) || obj.no2 < 0 || obj.no2 > 1000) return false;
  if (!isFiniteNumber(obj.temperatureC) || obj.temperatureC < -50 || obj.temperatureC > 60)
    return false;
  if (!isFiniteNumber(obj.windSpeedKmh) || obj.windSpeedKmh < 0 || obj.windSpeedKmh > 250)
    return false;

  return true;
}

export interface ValidatedPersona {
  id: string;
  name: string;
  subCategory: string;
  sensitivityLevel: string;
  preferredStartHour: number;
  preferredEndHour: number;
}

export function validatePersona(p: unknown): p is ValidatedPersona {
  if (typeof p !== 'object' || p === null) return false;
  const obj = p as Record<string, unknown>;

  if (typeof obj.id !== 'string' || obj.id.length === 0 || obj.id.length > 50) return false;
  if (typeof obj.name !== 'string' || obj.name.length === 0 || obj.name.length > 100) return false;
  if (typeof obj.subCategory !== 'string' || obj.subCategory.length === 0) return false;
  if (
    !isFiniteNumber(obj.preferredStartHour) ||
    obj.preferredStartHour < 0 ||
    obj.preferredStartHour > 23
  )
    return false;
  if (
    !isFiniteNumber(obj.preferredEndHour) ||
    obj.preferredEndHour < 0 ||
    obj.preferredEndHour > 23
  )
    return false;

  return true;
}
