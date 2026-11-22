/**
 * Keeps Saans inside the Gemini free tier (15 requests/minute, 500/day for Flash-Lite on the
 * project used to build this). We stop a little short of the limits and switch to rule-based
 * text instead of letting users see errors. After a 429 from Google we pause Gemini for a minute.
 * Counters are per server instance; see README for the trade-off.
 */
export class GeminiQuota {
  private minute: number[] = [];
  private day: number[] = [];
  private pausedUntil = 0;

  constructor(
    private readonly perMinute = 12,
    private readonly perDay = 450,
    private readonly now: () => number = Date.now,
  ) {}

  /** Reserve one request. Returns false when Gemini should not be called now. */
  tryAcquire(): boolean {
    const t = this.now();
    if (t < this.pausedUntil) return false;
    this.minute = this.minute.filter((x) => t - x < 60_000);
    this.day = this.day.filter((x) => t - x < 86_400_000);
    if (this.minute.length >= this.perMinute || this.day.length >= this.perDay) return false;
    this.minute.push(t);
    this.day.push(t);
    return true;
  }

  pause(ms = 60_000): void {
    this.pausedUntil = this.now() + ms;
  }
}

export const geminiQuota = new GeminiQuota();
