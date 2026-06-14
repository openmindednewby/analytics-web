/**
 * `@dloizides/analytics-web` — product-agnostic web analytics layer.
 *
 * Generalizes the kefi-marketing `track.ts` (guarded `track()` + first-touch
 * UTM/ref attribution) and the legacy BaseClient `UmamiClient` into a single
 * shared vehicle, so all 4 product web apps (erevna-web, katalogos-web,
 * kefi-web, poueni dashboard) instrument analytics identically. The app supplies
 * its `websiteId` + an `enabled` flag; this package owns the Umami plumbing.
 * Nothing here imports a product, realm, or hardcoded id.
 *
 * Surface:
 *   • `createAnalytics(config)` — the app-facing facade (no-op when disabled)
 *   • `track(event, props?)` — standalone guarded event helper, never throws
 *   • `captureAttribution()` / `getAttribution()` / `getRef()` — UTM/ref/referrer
 *   • `injectSnippet(opts)` / `isSnippetInjected(id)` — Umami `<script>` for SPAs
 *   • `sanitizeProps(props)` — PII redaction for event props
 *   • the config / event / Umami types + constants
 */

export { createAnalytics } from './createAnalytics';
export { track } from './track';
export { captureAttribution, getAttribution, getRef } from './attribution';
export { injectSnippet, isSnippetInjected } from './snippet';
export { sanitizeProps } from './sanitizeProps';

export {
  DEFAULT_SCRIPT_SRC,
  ATTRIBUTION_KEY,
  UTM_KEYS,
  SENSITIVE_KEY_PATTERNS,
  REDACTED_VALUE,
  WEBSITE_ID_ATTR,
} from './constants';

export type { InjectSnippetOptions } from './snippet';
export type {
  Analytics,
  AnalyticsConfig,
  EventProps,
  UmamiTracker,
  WindowWithUmami,
} from './types';
