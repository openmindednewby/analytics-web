/**
 * Package-wide constants.
 */

/** Default Umami browser script for the portfolio's self-hosted instance. */
export const DEFAULT_SCRIPT_SRC = 'https://analytics.dloizides.com/script.js';

/** sessionStorage key under which the first-touch attribution snapshot lives. */
export const ATTRIBUTION_KEY = 'dloizides_attribution';

/** UTM query params captured for channel attribution. */
export const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const;

/**
 * Substrings of event-prop keys whose values are redacted before sending.
 * Analytics must never carry PII.
 */
export const SENSITIVE_KEY_PATTERNS = [
  'password',
  'token',
  'secret',
  'apikey',
  'email',
  'phone',
  'creditcard',
] as const;

/** Replacement value for a redacted prop. */
export const REDACTED_VALUE = '[REDACTED]';

/** `data-` attribute the Umami snippet reads for the website id. */
export const WEBSITE_ID_ATTR = 'data-website-id';
