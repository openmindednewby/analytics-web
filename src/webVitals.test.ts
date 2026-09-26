import { createWebVitals, WEB_VITAL_EVENT_NAME } from './webVitals';

import type { WindowWithUmami } from './types';
import type { WebVitalMetric, WebVitalsSource, WebVitalSubscribe } from './webVitalsTypes';

type Emit = (metric: WebVitalMetric) => void;

/** A fake `web-vitals` whose listeners the test fires by hand. */
function fakeSource(): { source: WebVitalsSource; emit: Emit; subscribed: string[] } {
  const listeners: Array<(metric: WebVitalMetric) => void> = [];
  const subscribed: string[] = [];
  const sub =
    (name: string): WebVitalSubscribe =>
    (callback): void => {
      subscribed.push(name);
      listeners.push(callback);
    };
  const source: WebVitalsSource = {
    onCLS: sub('CLS'),
    onFCP: sub('FCP'),
    onINP: sub('INP'),
    onLCP: sub('LCP'),
    onTTFB: sub('TTFB'),
  };
  const emit: Emit = (metric) => listeners[0]?.(metric);
  return { source, emit, subscribed };
}

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const lcp: WebVitalMetric = { name: 'LCP', value: 1234.56, rating: 'good', id: 'v5-1' };

describe('createWebVitals gating (off by construction)', () => {
  it('is a no-op with no reporter and no websiteId (client without Umami)', () => {
    const loadMetrics = jest.fn();

    expect(createWebVitals({ loadMetrics }).start()).toBe(false);
    expect(createWebVitals().start()).toBe(false);
    expect(loadMetrics).not.toHaveBeenCalled();
  });

  it('treats a blank websiteId as not configured', () => {
    const loadMetrics = jest.fn();

    expect(createWebVitals({ websiteId: '  ', loadMetrics }).start()).toBe(false);
    expect(loadMetrics).not.toHaveBeenCalled();
  });

  it('is a no-op when disabled, even with a reporter', () => {
    const loadMetrics = jest.fn();
    const vitals = createWebVitals({ enabled: false, reporter: jest.fn(), loadMetrics });

    expect(vitals.start()).toBe(false);
    expect(vitals.started).toBe(false);
    expect(loadMetrics).not.toHaveBeenCalled();
  });

  it('re-evaluates canReport on every start and starts once it allows', async () => {
    const { source } = fakeSource();
    let consent = false;
    const vitals = createWebVitals({
      reporter: jest.fn(),
      canReport: () => consent,
      loadMetrics: () => Promise.resolve(source),
    });

    expect(vitals.start()).toBe(false);
    consent = true;
    expect(vitals.start()).toBe(true);
    await flush();
    expect(vitals.started).toBe(true);
  });

  describe('Do-Not-Track', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true });
    });
    afterEach(() => {
      Object.defineProperty(navigator, 'doNotTrack', { value: null, configurable: true });
    });

    it('blocks when respectDoNotTrack is set', () => {
      const loadMetrics = jest.fn();

      expect(createWebVitals({ reporter: jest.fn(), respectDoNotTrack: true, loadMetrics }).start()).toBe(false);
      expect(loadMetrics).not.toHaveBeenCalled();
    });

    it('is ignored when respectDoNotTrack is not set', () => {
      const { source } = fakeSource();
      const vitals = createWebVitals({ reporter: jest.fn(), loadMetrics: () => Promise.resolve(source) });

      expect(vitals.start()).toBe(true);
    });
  });

  it('allows when respectDoNotTrack is set but DNT is off', () => {
    const { source } = fakeSource();
    const vitals = createWebVitals({
      reporter: jest.fn(),
      respectDoNotTrack: true,
      loadMetrics: () => Promise.resolve(source),
    });

    expect(vitals.start()).toBe(true);
  });
});

describe('createWebVitals reporting', () => {
  it('subscribes all five metrics exactly once across repeated starts', async () => {
    const { source, subscribed } = fakeSource();
    const vitals = createWebVitals({ reporter: jest.fn(), loadMetrics: () => Promise.resolve(source) });

    expect(vitals.start()).toBe(true);
    expect(vitals.start()).toBe(false);
    await flush();

    expect(subscribed.sort()).toEqual(['CLS', 'FCP', 'INP', 'LCP', 'TTFB']);
  });

  it('sends whole-ms values under the default event name', async () => {
    const { source, emit } = fakeSource();
    const reporter = jest.fn();
    createWebVitals({ reporter, loadMetrics: () => Promise.resolve(source) }).start();
    await flush();

    emit(lcp);

    expect(reporter).toHaveBeenCalledWith(WEB_VITAL_EVENT_NAME, {
      metric: 'LCP',
      value: 1235,
      rating: 'good',
      id: 'v5-1',
    });
  });

  it('keeps four decimal places for CLS and honours a custom event name', async () => {
    const { source, emit } = fakeSource();
    const reporter = jest.fn();
    createWebVitals({ reporter, eventName: 'perf', loadMetrics: () => Promise.resolve(source) }).start();
    await flush();

    emit({ name: 'CLS', value: 0.123456, rating: 'needs-improvement', id: 'c1' });

    expect(reporter).toHaveBeenCalledWith('perf', expect.objectContaining({ metric: 'CLS', value: 0.1235 }));
  });

  it('swallows a throwing reporter', async () => {
    const { source, emit } = fakeSource();
    const reporter = jest.fn(() => {
      throw new Error('beacon blocked');
    });
    createWebVitals({ reporter, loadMetrics: () => Promise.resolve(source) }).start();
    await flush();

    expect(() => emit(lcp)).not.toThrow();
  });

  it('swallows a failed metrics import', async () => {
    const vitals = createWebVitals({ reporter: jest.fn(), loadMetrics: () => Promise.reject(new Error('missing')) });

    expect(vitals.start()).toBe(true);
    await expect(flush()).resolves.toBeUndefined();
  });
});

describe('createWebVitals default Umami reporter', () => {
  const umamiWindow = window as unknown as WindowWithUmami;

  afterEach(() => {
    delete umamiWindow.umami;
  });

  it('forwards to window.umami when a websiteId is configured', async () => {
    const { source, emit } = fakeSource();
    const umamiTrack = jest.fn();
    umamiWindow.umami = { track: umamiTrack };
    createWebVitals({ websiteId: 'site-1', loadMetrics: () => Promise.resolve(source) }).start();
    await flush();

    emit(lcp);

    expect(umamiTrack).toHaveBeenCalledWith(WEB_VITAL_EVENT_NAME, expect.objectContaining({ metric: 'LCP' }));
  });

  it('is a no-op without loadMetrics, even with a websiteId (package never imports web-vitals)', () => {
    const vitals = createWebVitals({ websiteId: 'site-1' });

    expect(vitals.start()).toBe(false);
    expect(vitals.started).toBe(false);
  });
});
