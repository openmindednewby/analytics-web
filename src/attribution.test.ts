import { captureAttribution, getAttribution, getRef } from './attribution';
import { ATTRIBUTION_KEY } from './constants';

function setSearch(search: string): void {
  window.history.replaceState({}, '', `/${search}`);
}

describe('attribution', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    setSearch('');
    Object.defineProperty(document, 'referrer', { value: '', configurable: true });
  });

  describe('captureAttribution', () => {
    it('snapshots utm params + ref + referrer', () => {
      setSearch('?utm_source=newsletter&utm_medium=email&ref=partnerA');
      Object.defineProperty(document, 'referrer', {
        value: 'https://news.example.com/',
        configurable: true,
      });

      captureAttribution();

      expect(getAttribution()).toEqual({
        utm_source: 'newsletter',
        utm_medium: 'email',
        ref: 'partnerA',
        referrer: 'https://news.example.com/',
      });
    });

    it('ignores empty-string param values', () => {
      setSearch('?utm_source=&ref=');
      captureAttribution();
      expect(getAttribution()).toEqual({});
    });

    it('stores nothing when there is no attribution signal', () => {
      captureAttribution();
      expect(window.sessionStorage.getItem(ATTRIBUTION_KEY)).toBeNull();
    });

    it('is first-touch: a later same-session capture does not overwrite', () => {
      setSearch('?utm_source=first');
      captureAttribution();

      setSearch('?utm_source=second');
      captureAttribution();

      expect(getAttribution()).toEqual({ utm_source: 'first' });
    });

    it('swallows a sessionStorage failure', () => {
      const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('private mode');
      });
      setSearch('?utm_source=x');

      expect(() => captureAttribution()).not.toThrow();
      spy.mockRestore();
    });
  });

  describe('getAttribution', () => {
    it('returns an empty object when nothing is stored', () => {
      expect(getAttribution()).toEqual({});
    });

    it('returns an empty object when the stored value is not JSON', () => {
      window.sessionStorage.setItem(ATTRIBUTION_KEY, 'not-json{');
      expect(getAttribution()).toEqual({});
    });

    it('returns an empty object when the stored JSON is not an object', () => {
      window.sessionStorage.setItem(ATTRIBUTION_KEY, '"a string"');
      expect(getAttribution()).toEqual({});
    });

    it('returns an empty object when the stored JSON is null', () => {
      window.sessionStorage.setItem(ATTRIBUTION_KEY, 'null');
      expect(getAttribution()).toEqual({});
    });
  });

  describe('getRef', () => {
    it('returns the persisted ref when present', () => {
      setSearch('?ref=partnerB');
      captureAttribution();
      expect(getRef()).toBe('partnerB');
    });

    it('returns undefined when no ref was captured', () => {
      expect(getRef()).toBeUndefined();
    });
  });
});

describe('attribution without a window (SSR/native)', () => {
  let originalWindow: typeof globalThis.window;

  beforeAll(() => {
    originalWindow = globalThis.window;
    // @ts-expect-error — simulate a non-browser global for the SSR guard.
    delete globalThis.window;
  });

  afterAll(() => {
    globalThis.window = originalWindow;
  });

  it('captureAttribution no-ops', () => {
    expect(() => captureAttribution()).not.toThrow();
  });

  it('getAttribution returns an empty object', () => {
    expect(getAttribution()).toEqual({});
  });
});

/**
 * Native safety — the case a `typeof window === 'undefined'` guard MISSES.
 *
 * React Native's `setUpGlobals` does `global.window = global`, so on a device
 * `window` EXISTS while `sessionStorage` / `document` do NOT. The old guard fell
 * straight through and every call threw a TypeError (swallowed by the catch).
 * These lock a true no-op via capability probes.
 */
describe('attribution — React Native (window exists, storage/document do not)', () => {
  const storageDescriptor = Object.getOwnPropertyDescriptor(window, 'sessionStorage');

  beforeEach(() => {
    Object.defineProperty(window, 'sessionStorage', { value: undefined, configurable: true });
  });

  afterEach(() => {
    if (storageDescriptor !== undefined) {
      Object.defineProperty(window, 'sessionStorage', storageDescriptor);
    }
  });

  it('captureAttribution no-ops without throwing', () => {
    expect(typeof window).not.toBe('undefined'); // the old guard would pass here
    expect(() => captureAttribution()).not.toThrow();
  });

  it('getAttribution returns an empty object without throwing', () => {
    expect(() => getAttribution()).not.toThrow();
    expect(getAttribution()).toEqual({});
  });

  it('getRef returns undefined without throwing', () => {
    expect(getRef()).toBeUndefined();
  });
});
