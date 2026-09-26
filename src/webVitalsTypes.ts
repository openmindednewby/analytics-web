/**
 * Public types for the shared Core Web Vitals reporter (`createWebVitals`).
 *
 * Kept framework-free: no React, no React Native. A portal wraps `start()` in
 * its own `useEffect`; the package owns the subscription, rounding, gating and
 * the Umami default.
 */
import type { EventProps } from './types';

/**
 * The subset of a `web-vitals` `Metric` the reporter reads. Structural, so the
 * package does not force a `web-vitals` major on its consumers.
 */
export interface WebVitalMetric {
  name: string;
  value: number;
  rating: string;
  id: string;
}

/** A `web-vitals` subscription function (`onCLS`, `onLCP`, ...). */
export type WebVitalSubscribe = (callback: (metric: WebVitalMetric) => void) => void;

/** The five subscriptions the reporter registers — the `web-vitals` module shape. */
export interface WebVitalsSource {
  onCLS: WebVitalSubscribe;
  onFCP: WebVitalSubscribe;
  onINP: WebVitalSubscribe;
  onLCP: WebVitalSubscribe;
  onTTFB: WebVitalSubscribe;
}

/**
 * Where a measurement goes. Same shape as `track(event, props)`, so an app's
 * own analytics facade, the Umami beacon, or a logger adapter all fit.
 */
export type WebVitalReporter = (eventName: string, props: EventProps) => void;

/** Configuration for `createWebVitals`. Every field is optional. */
export interface WebVitalsConfig {
  /** Master switch. `false` makes `start()` a no-op. Defaults to `true`. */
  enabled?: boolean;
  /**
   * Umami website id. Only consulted when no `reporter` is given: the default
   * Umami reporter stays off unless a non-empty id is configured, so a client
   * with no Umami gets a no-op rather than a dependency.
   */
  websiteId?: string;
  /** Custom destination. When set, `websiteId` is not required. */
  reporter?: WebVitalReporter;
  /** Extra gate evaluated on every `start()` (e.g. cookie consent). */
  canReport?: () => boolean;
  /** When `true`, `navigator.doNotTrack === '1'` blocks reporting. Defaults to `false`. */
  respectDoNotTrack?: boolean;
  /** Event name sent per measurement. Defaults to `WEB_VITAL_EVENT_NAME`. */
  eventName?: string;
  /** Loads the metric subscriptions. Defaults to a lazy `import('web-vitals')`. */
  loadMetrics?: () => Promise<WebVitalsSource>;
}

/** The handle returned by `createWebVitals`. */
export interface WebVitalsTracker {
  /**
   * Register the five listeners once. Returns `true` only on the call that
   * registered them; every gated or repeated call returns `false` and does
   * nothing, so it is safe to call from an effect that re-runs on consent.
   */
  start: () => boolean;
  /** Whether listeners have been registered. */
  readonly started: boolean;
}
