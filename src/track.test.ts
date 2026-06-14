import { track } from './track';

import type { WindowWithUmami } from './types';

describe('track', () => {
  const umamiWindow = window as unknown as WindowWithUmami;

  afterEach(() => {
    delete umamiWindow.umami;
  });

  it('no-ops when the umami global is absent', () => {
    expect(() => track('event_no_tracker')).not.toThrow();
  });

  it('forwards the event name only when no props are given', () => {
    const trackSpy = jest.fn();
    umamiWindow.umami = { track: trackSpy };

    track('signup_submitted');

    expect(trackSpy).toHaveBeenCalledTimes(1);
    expect(trackSpy).toHaveBeenCalledWith('signup_submitted');
  });

  it('forwards sanitized props when provided', () => {
    const trackSpy = jest.fn();
    umamiWindow.umami = { track: trackSpy };

    track('signup_submitted', { plan: 'pro', userEmail: 'a@b.com' });

    expect(trackSpy).toHaveBeenCalledWith('signup_submitted', {
      plan: 'pro',
      userEmail: '[REDACTED]',
    });
  });

  it('swallows a throw from the underlying tracker', () => {
    umamiWindow.umami = {
      track: (): void => {
        throw new Error('beacon blocked');
      },
    };

    expect(() => track('event_that_throws', { a: 1 })).not.toThrow();
  });
});

describe('track without a window (SSR/native)', () => {
  let originalWindow: typeof globalThis.window;

  beforeAll(() => {
    originalWindow = globalThis.window;
    // @ts-expect-error — simulate a non-browser global for the SSR guard.
    delete globalThis.window;
  });

  afterAll(() => {
    globalThis.window = originalWindow;
  });

  it('no-ops when window is undefined', () => {
    expect(() => track('ssr_event')).not.toThrow();
  });
});
