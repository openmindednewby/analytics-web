import { ATTRIBUTION_KEY, UTM_KEYS } from './constants';

/**
 * First-touch channel attribution. Umami has no native UTM model, so we snapshot
 * `utm_*` + `ref` query params and the document referrer on the first landing
 * into sessionStorage. Later funnel steps read it back and attach it to the
 * terminal conversion event. All operations are best-effort and never throw
 * (sessionStorage can throw in private/incognito modes).
 */

/**
 * Persist UTM + ref + referrer on first touch. Idempotent within a session:
 * the FIRST snapshot wins — a later same-session navigation does not overwrite
 * it. Stores nothing when there's no attribution signal at all.
 */
export function captureAttribution(): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    if (window.sessionStorage.getItem(ATTRIBUTION_KEY) !== null) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const snapshot: Record<string, string> = {};

    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value !== null && value !== '') {
        snapshot[key] = value;
      }
    }

    const ref = params.get('ref');
    if (ref !== null && ref !== '') {
      snapshot.ref = ref;
    }

    const { referrer } = document;
    if (referrer !== '') {
      snapshot.referrer = referrer;
    }

    if (Object.keys(snapshot).length > 0) {
      window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(snapshot));
    }
  } catch {
    // Attribution is best-effort; storage may be unavailable.
  }
}

/** Read back the persisted first-touch snapshot (empty object if none). */
export function getAttribution(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const raw = window.sessionStorage.getItem(ATTRIBUTION_KEY);
    if (raw === null) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, string>;
    }
    return {};
  } catch {
    return {};
  }
}

/** Convenience: the `ref` param from the persisted snapshot, if any. */
export function getRef(): string | undefined {
  return getAttribution().ref;
}
