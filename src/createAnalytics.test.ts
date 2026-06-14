import { ATTRIBUTION_KEY, WEBSITE_ID_ATTR } from './constants';
import { createAnalytics } from './createAnalytics';

import type { WindowWithUmami } from './types';

const WEBSITE_ID = 'cfg-website-id';

function clearScripts(): void {
  document.querySelectorAll('script').forEach((node) => node.remove());
}

describe('createAnalytics — enabled (default)', () => {
  const umamiWindow = window as unknown as WindowWithUmami;

  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, '', '/');
    clearScripts();
  });

  afterEach(() => {
    delete umamiWindow.umami;
  });

  it('defaults enabled to true', () => {
    const analytics = createAnalytics({ websiteId: WEBSITE_ID });
    expect(analytics.enabled).toBe(true);
  });

  it('track delegates to the guarded tracker', () => {
    const trackSpy = jest.fn();
    umamiWindow.umami = { track: trackSpy };

    createAnalytics({ websiteId: WEBSITE_ID }).track('menu_published', { id: 7 });

    expect(trackSpy).toHaveBeenCalledWith('menu_published', { id: 7 });
  });

  it('captureAttribution + getAttribution round-trip', () => {
    window.history.replaceState({}, '', '/?utm_source=cfg');
    const analytics = createAnalytics({ websiteId: WEBSITE_ID });

    analytics.captureAttribution();

    expect(analytics.getAttribution()).toEqual({ utm_source: 'cfg' });
    expect(window.sessionStorage.getItem(ATTRIBUTION_KEY)).not.toBeNull();
  });

  it('injectSnippet injects the configured website id + custom src', () => {
    createAnalytics({
      websiteId: WEBSITE_ID,
      scriptSrc: 'https://u.example.com/s.js',
    }).injectSnippet();

    const el = document.querySelector<HTMLScriptElement>(
      `script[${WEBSITE_ID_ATTR}="${WEBSITE_ID}"]`,
    );
    expect(el).not.toBeNull();
    expect(el?.src).toBe('https://u.example.com/s.js');
  });
});

describe('createAnalytics — disabled (no-op)', () => {
  const umamiWindow = window as unknown as WindowWithUmami;

  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, '', '/?utm_source=ignored');
    clearScripts();
  });

  afterEach(() => {
    delete umamiWindow.umami;
  });

  it('reports enabled false', () => {
    expect(createAnalytics({ websiteId: WEBSITE_ID, enabled: false }).enabled).toBe(false);
  });

  it('track is inert (never reaches the tracker)', () => {
    const trackSpy = jest.fn();
    umamiWindow.umami = { track: trackSpy };

    const analytics = createAnalytics({ websiteId: WEBSITE_ID, enabled: false });
    analytics.track('should_not_fire', { a: 1 });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('captureAttribution + getAttribution are inert', () => {
    const analytics = createAnalytics({ websiteId: WEBSITE_ID, enabled: false });

    analytics.captureAttribution();

    expect(window.sessionStorage.getItem(ATTRIBUTION_KEY)).toBeNull();
    expect(analytics.getAttribution()).toEqual({});
  });

  it('injectSnippet is inert', () => {
    createAnalytics({ websiteId: WEBSITE_ID, enabled: false }).injectSnippet();

    expect(
      document.querySelector(`script[${WEBSITE_ID_ATTR}="${WEBSITE_ID}"]`),
    ).toBeNull();
  });
});
