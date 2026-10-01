import { describe, expect, it } from 'vitest';
import { resolveAppCheckMode } from './firebaseAppCheck';

describe('Firebase App Check configuration', () => {
  it('lets local emulator development run without reCAPTCHA', () => {
    expect(resolveAppCheckMode({ useEmulators: true })).toEqual({ type: 'emulator' });
  });

  it('lets production use Firebase without App Check when no Enterprise site key is configured', () => {
    expect(resolveAppCheckMode({ useEmulators: false })).toEqual({ type: 'disabled' });
  });

  it('configures the reCAPTCHA Enterprise site key for production', () => {
    expect(resolveAppCheckMode({ useEmulators: false, siteKey: 'public-site-key' })).toEqual({
      type: 'recaptcha-enterprise',
      siteKey: 'public-site-key',
    });
  });
});
