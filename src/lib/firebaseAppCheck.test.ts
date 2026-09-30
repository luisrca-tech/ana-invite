import { describe, expect, it } from 'vitest';
import { resolveAppCheckMode } from './firebaseAppCheck';

describe('Firebase App Check configuration', () => {
  it('lets local emulator development run without reCAPTCHA', () => {
    expect(resolveAppCheckMode({ useEmulators: true })).toEqual({ type: 'emulator' });
  });

  it('requires attestation before a production Firebase client can start', () => {
    expect(() => resolveAppCheckMode({ useEmulators: false })).toThrow(
      'A reCAPTCHA v3 site key is required for production Firebase access.',
    );
  });

  it('configures the reCAPTCHA v3 site key for production', () => {
    expect(resolveAppCheckMode({ useEmulators: false, siteKey: 'public-site-key' })).toEqual({
      type: 'recaptcha-v3',
      siteKey: 'public-site-key',
    });
  });
});
