import { DEFAULT_SCRIPT_SRC, WEBSITE_ID_ATTR } from './constants';
import { injectSnippet, isSnippetInjected } from './snippet';

const WEBSITE_ID = 'abc-123';

function clearScripts(): void {
  document.querySelectorAll('script').forEach((node) => node.remove());
}

describe('injectSnippet', () => {
  afterEach(() => {
    clearScripts();
  });

  it('injects a deferred script with the default src + website id', () => {
    const el = injectSnippet({ websiteId: WEBSITE_ID });

    expect(el).not.toBeNull();
    expect(el?.defer).toBe(true);
    expect(el?.src).toBe(DEFAULT_SCRIPT_SRC);
    expect(el?.getAttribute(WEBSITE_ID_ATTR)).toBe(WEBSITE_ID);
    expect(document.head.contains(el)).toBe(true);
  });

  it('honours a custom scriptSrc', () => {
    const el = injectSnippet({
      websiteId: WEBSITE_ID,
      scriptSrc: 'https://umami.example.com/u.js',
    });
    expect(el?.src).toBe('https://umami.example.com/u.js');
  });

  it('is idempotent: a second call returns the same element', () => {
    const first = injectSnippet({ websiteId: WEBSITE_ID });
    const second = injectSnippet({ websiteId: WEBSITE_ID });

    expect(second).toBe(first);
    expect(document.querySelectorAll(`script[${WEBSITE_ID_ATTR}="${WEBSITE_ID}"]`)).toHaveLength(1);
  });

  it('falls back to body when head is unavailable', () => {
    const headSpy = jest.spyOn(document, 'head', 'get').mockReturnValue(
      null as unknown as HTMLHeadElement,
    );

    const el = injectSnippet({ websiteId: WEBSITE_ID });

    expect(el).not.toBeNull();
    expect(document.body.contains(el)).toBe(true);
    headSpy.mockRestore();
  });

  it('falls back to documentElement when head and body are unavailable', () => {
    const headSpy = jest.spyOn(document, 'head', 'get').mockReturnValue(
      null as unknown as HTMLHeadElement,
    );
    const bodySpy = jest.spyOn(document, 'body', 'get').mockReturnValue(
      null as unknown as HTMLBodyElement,
    );

    const el = injectSnippet({ websiteId: WEBSITE_ID });

    expect(el).not.toBeNull();
    expect(document.documentElement.contains(el)).toBe(true);
    headSpy.mockRestore();
    bodySpy.mockRestore();
  });
});

describe('isSnippetInjected', () => {
  afterEach(() => {
    clearScripts();
  });

  it('is false before injection', () => {
    expect(isSnippetInjected(WEBSITE_ID)).toBe(false);
  });

  it('is true after injection', () => {
    injectSnippet({ websiteId: WEBSITE_ID });
    expect(isSnippetInjected(WEBSITE_ID)).toBe(true);
  });
});

describe('snippet without a document (SSR/native)', () => {
  let originalDocument: PropertyDescriptor | undefined;

  beforeAll(() => {
    clearScripts();
    originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
    Object.defineProperty(globalThis, 'document', {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  afterAll(() => {
    if (originalDocument !== undefined) {
      Object.defineProperty(globalThis, 'document', originalDocument);
    }
  });

  it('injectSnippet returns null', () => {
    expect(injectSnippet({ websiteId: WEBSITE_ID })).toBeNull();
  });

  it('isSnippetInjected returns false', () => {
    expect(isSnippetInjected(WEBSITE_ID)).toBe(false);
  });
});
