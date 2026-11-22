import { ApiError } from '@/lib/client/api';
import type { MessageKey } from '@/lib/i18n';

/** Map an API failure to a message that says what happened and what to do. */
export function errorKey(error: unknown): MessageKey {
  if (error instanceof ApiError) {
    if (error.code === 'rate_limited') return 'errorRateLimited';
    if (error.code === 'upstream') return 'errorUpstream';
  }
  return 'errorGeneric';
}
