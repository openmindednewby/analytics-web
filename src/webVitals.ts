import { track } from './track';

import type { EventProps } from './types';
import type {
  WebVitalMetric,
  WebVitalReporter,
  WebVitalsConfig,
  WebVitalsSource,
  WebVitalsTracker,
} from './webVitalsTypes';

/** Default event name for a Core Web Vitals measurement. */
export const WEB_VITAL_EVENT_NAME = 'web_vital';

/**
 * CLS is a unitless ratio reported to a few decimal places; the others are
 * milliseconds. Round CLS to keep its precision, round the rest to whole ms.
 */
const CLS_METRIC_NAME = 'CLS';
const CLS_DECIMAL_PLACES = 4;
const DECIMAL_BASE = 10;
const DNT_ENABLED = '1';

function roundMetricValue(metric: WebVitalMetric): number {
  if (metric.name === CLS_METRIC_NAME) {
    const factor = DECIMAL_BASE ** CLS_DECIMAL_PLACES;
    return Math.round(metric.value * factor) / factor;
  }
  return Math.round(metric.value);
}

function toProps(metric: WebVitalMetric): EventProps {
  return {
    metric: metric.name,
    value: roundMetricValue(metric),
    rating: metric.rating,
    id: metric.id,
  };
}

/** Browser with a DOM — false on SSR (no `window`) and React Native (no `document`). */
function hasBrowserDom(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function isDoNotTrack(): boolean {
  return typeof navigator !== 'undefined' && navigator.doNotTrack === DNT_ENABLED;
}

/** The reporter to use, or `undefined` when nothing is configured to receive vitals. */
function resolveReporter(config: WebVitalsConfig): WebVitalReporter | undefined {
  if (config.reporter !== undefined) {
    return config.reporter;
  }
  const websiteId = config.websiteId ?? '';
  return websiteId.trim() === '' ? undefined : track;
}

function loadWebVitals(): Promise<WebVitalsSource> {
  return import('web-vitals');
}

function isAllowed(config: WebVitalsConfig): boolean {
  if (!(config.enabled ?? true) || !hasBrowserDom()) {
    return false;
  }
  if (config.respectDoNotTrack === true && isDoNotTrack()) {
    return false;
  }
  return config.canReport?.() ?? true;
}

function subscribeAll(source: WebVitalsSource, handler: (metric: WebVitalMetric) => void): void {
  source.onCLS(handler);
  source.onINP(handler);
  source.onLCP(handler);
  source.onFCP(handler);
  source.onTTFB(handler);
}

/**
 * Build a Core Web Vitals reporter (CLS, INP, LCP, FCP, TTFB).
 *
 * Off by construction: `start()` does nothing when `enabled` is `false`, when
 * no reporter is configured (no `reporter` and no `websiteId`), when
 * `canReport()` returns `false`, under Do-Not-Track (if `respectDoNotTrack`),
 * or outside a browser DOM (SSR, React Native). `web-vitals` is imported only
 * after every gate passes, so a disabled build never loads it. A throwing
 * reporter or a failed import is swallowed — measurement never breaks the page.
 *
 *   const vitals = createWebVitals({ websiteId: env.UMAMI_ID, enabled });
 *   useEffect(() => { vitals.start(); }, []);
 */
export function createWebVitals(config: WebVitalsConfig = {}): WebVitalsTracker {
  let started = false;
  const eventName = config.eventName ?? WEB_VITAL_EVENT_NAME;
  const load = config.loadMetrics ?? loadWebVitals;

  const start = (): boolean => {
    const reporter = resolveReporter(config);
    if (started || reporter === undefined || !isAllowed(config)) {
      return false;
    }
    started = true;
    const handler = (metric: WebVitalMetric): void => {
      try {
        reporter(eventName, toProps(metric));
      } catch {
        // A failed report must never interrupt the page it measures.
      }
    };
    load()
      .then((source) => subscribeAll(source, handler))
      .catch(() => {
        // web-vitals missing or blocked: stay silent, the app keeps working.
      });
    return true;
  };

  return {
    start,
    get started(): boolean {
      return started;
    },
  };
}
