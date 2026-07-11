import { ATTRIBUTION_KEY, UTM_KEYS } from './constants';

/**
 * First-touch channel attribution. Umami has no native UTM model, so we snapshot
 * `utm_*` + `ref` query params and the document referrer on the first landing
 * into sessionStorage. Later funnel steps read it back and attach it to the
 * terminal conversion event. All operations are best-effort and never throw
 * (sessionStorage can throw in private/incognito modes).
 */

/**
 * Resolve `sessionStorage`, or `null` where the browser API does not exist.
 *
 * NOTE — `typeof window === 'undefined'` is NOT a native guard: React Native's
 * `setUpGlobals` does `global.window = global`, so on a device `window` EXISTS
 * while `sessionStorage` / `document` do NOT. The old guard fell straight
 * through on native and every call threw a TypeError into the `catch` below.
 * Probing the API keeps native a true no-op instead of a swallowed throw.
 */
function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const storage: Storage | undefined = (window as Partial<Window>).sessionStorage;
    return storage ?? null;
  } catch {
    // Accessing sessionStorage can throw (sandboxed iframes, privacy modes).
    return null;
  }
}

/** The document referrer, or `''` off-web (native / SSR have no `document`). */
function getReferrer(): string {
  if (typeof document === 'undefined') {
    return '';
  }
  return document.referrer;
}

/** The current query string, or `''` off-web (native / SSR have no `location`). */
function getSearch(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  const browserLocation: Location | undefined = (window as Partial<Window>).location;
  return browserLocation?.search ?? '';
}

/**
 * Persist UTM + ref + referrer on first touch. Idempotent within a session:
 * the FIRST snapshot wins — a later same-session navigation does not overwrite
 * it. Stores nothing when there's no attribution signal at all.
 */
export function captureAttribution(): void {
  const storage = getSessionStorage();
  if (storage === null) {
    return;
  }
  try {
    if (storage.getItem(ATTRIBUTION_KEY) !== null) {
      return;
    }

    const params = new URLSearchParams(getSearch());
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

    const referrer = getReferrer();
    if (referrer !== '') {
      snapshot.referrer = referrer;
    }

    if (Object.keys(snapshot).length > 0) {
      storage.setItem(ATTRIBUTION_KEY, JSON.stringify(snapshot));
    }
  } catch {
    // Attribution is best-effort; storage may be unavailable.
  }
}

/** Read back the persisted first-touch snapshot (empty object if none). */
export function getAttribution(): Record<string, string> {
  const storage = getSessionStorage();
  if (storage === null) {
    return {};
  }
  try {
    const raw = storage.getItem(ATTRIBUTION_KEY);
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
