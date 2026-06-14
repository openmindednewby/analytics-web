import { DEFAULT_SCRIPT_SRC, WEBSITE_ID_ATTR } from './constants';

/** Options for {@link injectSnippet}. */
export interface InjectSnippetOptions {
  /** The per-app Umami website id (from the Umami dashboard). Required. */
  websiteId: string;
  /** Umami browser script URL. Defaults to the portfolio instance. */
  scriptSrc?: string;
}

/**
 * Whether the Umami snippet for a given website id is already in the document.
 * Used to keep {@link injectSnippet} idempotent across HMR / re-renders.
 */
export function isSnippetInjected(websiteId: string): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  const selector = `script[${WEBSITE_ID_ATTR}="${websiteId}"]`;
  return document.querySelector(selector) !== null;
}

/**
 * Inject the Umami tracking snippet into the document head for this app's
 * `websiteId`. Equivalent to hand-placing
 * `<script defer src=".../script.js" data-website-id="...">` before `</head>`,
 * but for SPAs (poueni dashboard / Vite) that don't have a static HTML template
 * to edit. Idempotent — a second call with the same id is a no-op.
 *
 * Never throws (guarded for SSR/native where `document` is absent). Returns the
 * injected (or pre-existing) element, or `null` when there is no DOM.
 */
export function injectSnippet(options: InjectSnippetOptions): HTMLScriptElement | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const scriptSrc = options.scriptSrc ?? DEFAULT_SCRIPT_SRC;

  const existing = document.querySelector<HTMLScriptElement>(
    `script[${WEBSITE_ID_ATTR}="${options.websiteId}"]`,
  );
  if (existing !== null) {
    return existing;
  }

  const script = document.createElement('script');
  script.defer = true;
  script.src = scriptSrc;
  script.setAttribute(WEBSITE_ID_ATTR, options.websiteId);

  const target = document.head ?? document.body ?? document.documentElement;
  target.appendChild(script);
  return script;
}
