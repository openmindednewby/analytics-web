/**
 * @jest-environment node
 */
import { createWebVitals } from './webVitals';

describe('createWebVitals outside a browser DOM', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'window');
  });

  it('is a no-op on SSR (no window)', () => {
    const loadMetrics = jest.fn();

    expect(createWebVitals({ reporter: jest.fn(), loadMetrics }).start()).toBe(false);
    expect(loadMetrics).not.toHaveBeenCalled();
  });

  it('is a no-op on React Native (window without document)', () => {
    Reflect.set(globalThis, 'window', {});
    const loadMetrics = jest.fn();

    expect(createWebVitals({ reporter: jest.fn(), loadMetrics }).start()).toBe(false);
    expect(loadMetrics).not.toHaveBeenCalled();
  });
});
