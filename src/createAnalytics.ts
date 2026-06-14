import { getAttribution as readAttribution, captureAttribution as captureAttr } from './attribution';
import { injectSnippet as injectUmamiSnippet } from './snippet';
import { track as trackEvent } from './track';

import type { Analytics, AnalyticsConfig, EventProps } from './types';

/** A fully inert facade — every method is a no-op. */
function createNoOpAnalytics(): Analytics {
  return {
    track: (): void => {
      /* disabled */
    },
    captureAttribution: (): void => {
      /* disabled */
    },
    getAttribution: (): Record<string, string> => ({}),
    injectSnippet: (): void => {
      /* disabled */
    },
    enabled: false,
  };
}

/**
 * Build the app-facing analytics facade from app config.
 *
 * The app owns its `websiteId` (from the Umami dashboard) and its `enabled`
 * flag; the package owns the guarded Umami plumbing. When `enabled` is `false`
 * (e.g. dev/preview builds), a no-op facade is returned that still satisfies the
 * full API so call sites never need their own guards.
 *
 * Typical wiring (run once at app bootstrap):
 *   const analytics = createAnalytics({ websiteId: env.UMAMI_ID, enabled });
 *   analytics.injectSnippet();      // SPA: add <script> (skip if static HTML already has it)
 *   analytics.captureAttribution(); // snapshot first-touch UTM/ref
 *   analytics.track('signup_submitted', { ...analytics.getAttribution() });
 */
export function createAnalytics(config: AnalyticsConfig): Analytics {
  const enabled = config.enabled ?? true;
  if (!enabled) {
    return createNoOpAnalytics();
  }

  return {
    track: (event: string, props?: EventProps): void => trackEvent(event, props),
    captureAttribution: (): void => captureAttr(),
    getAttribution: (): Record<string, string> => readAttribution(),
    injectSnippet: (): void => {
      injectUmamiSnippet({ websiteId: config.websiteId, scriptSrc: config.scriptSrc });
    },
    enabled: true,
  };
}
