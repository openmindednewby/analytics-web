import { REDACTED_VALUE } from './constants';
import { sanitizeProps } from './sanitizeProps';

describe('sanitizeProps', () => {
  it('returns undefined for undefined input', () => {
    expect(sanitizeProps(undefined)).toBeUndefined();
  });

  it('returns an empty object for an empty input', () => {
    expect(sanitizeProps({})).toEqual({});
  });

  it('passes through non-sensitive props unchanged', () => {
    const props = { plan: 'pro', count: 3, active: true };
    expect(sanitizeProps(props)).toEqual(props);
  });

  it('redacts sensitive keys (case-insensitive substring match)', () => {
    const result = sanitizeProps({
      userEmail: 'a@b.com',
      authToken: 'xyz',
      PhoneNumber: '+357',
      plan: 'free',
    });
    expect(result).toEqual({
      userEmail: REDACTED_VALUE,
      authToken: REDACTED_VALUE,
      PhoneNumber: REDACTED_VALUE,
      plan: 'free',
    });
  });
});
