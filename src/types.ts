/**
 * Public types for `@dloizides/analytics-web`.
 *
 * The package is product-agnostic: the consuming app supplies its own Umami
 * `websiteId`, the `scriptSrc` of the self-hosted Umami instance, and an
 * `enabled` flag. Nothing here references a product, realm, or hardcoded id.
 */

/**
 * Properties attached to a tracked event. Primitive values only — never PII.
 * (PII keys are additionally stripped at send time; see `sanitizeProps`.)
 */
export type EventProps = Record<string, string | number | boolean>;

/**
 * Minimal shape of the Umami tracker the browser snippet attaches to `window`.
 * We only depend on `track(name, data?)`.
 */
export interface UmamiTracker {
  track: (eventName: string, eventData?: EventProps) => void;
}

/** `window` augmented with the optional Umami global the snippet installs. */
export type WindowWithUmami = Window & { umami?: UmamiTracker };

/**
 * App-supplied configuration. The only required field is `websiteId`; an app
 * disables analytics entirely by passing `enabled: false` (default `true`),
 * which yields a no-op facade that still satisfies the full API.
 */
export interface AnalyticsConfig {
  /** The per-app Umami website id (from the Umami dashboard). */
  websiteId: string;
  /**
   * URL of the Umami browser script. Defaults to the portfolio instance
   * (`https://analytics.dloizides.com/script.js`).
   */
  scriptSrc?: string;
  /**
   * Master switch. When `false`, `track`/`captureAttribution`/`injectSnippet`
   * are all no-ops. Defaults to `true`. Apps typically wire this to an env flag
   * so dev/preview builds don't pollute production analytics.
   */
  enabled?: boolean;
}

/** The facade returned by `createAnalytics`. */
export interface Analytics {
  /** Fire a named Umami event. Guarded — never throws, never blocks nav. */
  track: (event: string, props?: EventProps) => void;
  /** Snapshot first-touch UTM/ref/referrer into sessionStorage (idempotent). */
  captureAttribution: () => void;
  /** Read back the persisted first-touch attribution snapshot. */
  getAttribution: () => Record<string, string>;
  /** Inject the Umami `<script>` for this app's `websiteId` (idempotent). */
  injectSnippet: () => void;
  /** Whether analytics is active for this config. */
  readonly enabled: boolean;
}
