import { REDACTED_VALUE, SENSITIVE_KEY_PATTERNS } from './constants';

import type { EventProps } from './types';

/**
 * Strip values of keys that look like PII (email, token, password, …) before
 * an event leaves the browser. Key matching is case-insensitive substring.
 * Returns `undefined` for an absent/empty input so the beacon stays compact.
 */
export function sanitizeProps(props?: EventProps): EventProps | undefined {
  if (props === undefined) {
    return undefined;
  }

  const sanitized: EventProps = {};
  for (const [key, value] of Object.entries(props)) {
    const lowered = key.toLowerCase();
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => lowered.includes(pattern));
    sanitized[key] = isSensitive ? REDACTED_VALUE : value;
  }
  return sanitized;
}
