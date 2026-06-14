import { sanitizeProps } from './sanitizeProps';

import type { EventProps, WindowWithUmami } from './types';

/**
 * Fire a named Umami event through the browser snippet's `window.umami.track`.
 *
 * Guarded by design — analytics must NEVER break a user flow:
 *  - no-ops during SSR / native (no `window`)
 *  - no-ops when the snippet is absent (ad-blocker, CSP, local dev, not yet
 *    injected) so `window.umami` is undefined
 *  - PII-looking props are redacted before they leave the page
 *  - any throw from the beacon is swallowed
 *
 * The website id is carried by the injected `<script data-website-id>` snippet,
 * so callers only pass the event name + props.
 */
export function track(event: string, props?: EventProps): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const { umami } = window as WindowWithUmami;
    if (umami === undefined) {
      return;
    }
    const data = sanitizeProps(props);
    if (data === undefined) {
      umami.track(event);
    } else {
      umami.track(event, data);
    }
  } catch {
    // A failed beacon must never interrupt the flow it measures.
  }
}
