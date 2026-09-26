/**
 * @jest-environment node
 */
import { captureAttribution, getAttribution } from './attribution';

/** Minimal in-memory Storage for a window that has storage but no document/location. */
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length(): number {
      return data.size;
    },
    clear: (): void => data.clear(),
    getItem: (key: string): string | null => data.get(key) ?? null,
    key: (): string | null => null,
    removeItem: (key: string): void => {
      data.delete(key);
    },
    setItem: (key: string, value: string): void => {
      data.set(key, value);
    },
  };
}

describe('attribution with storage but no document or location', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'window');
  });

  it('captures nothing when there is no referrer and no query string', () => {
    const storage = memoryStorage();
    Reflect.set(globalThis, 'window', { sessionStorage: storage });

    captureAttribution();

    expect(storage.length).toBe(0);
  });

  it('treats a throwing sessionStorage getter as no storage', () => {
    const throwingWindow = {};
    Object.defineProperty(throwingWindow, 'sessionStorage', {
      get: (): Storage => {
        throw new Error('SecurityError');
      },
    });
    Reflect.set(globalThis, 'window', throwingWindow);

    expect(() => captureAttribution()).not.toThrow();
    expect(getAttribution()).toEqual({});
  });
});
