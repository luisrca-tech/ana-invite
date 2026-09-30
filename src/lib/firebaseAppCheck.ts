export type AppCheckMode = { type: 'emulator' } | { type: 'recaptcha-v3'; siteKey: string };

export function resolveAppCheckMode({ useEmulators, siteKey }: { useEmulators: boolean; siteKey?: string }): AppCheckMode {
  if (useEmulators) return { type: 'emulator' };

  const normalizedSiteKey = siteKey?.trim();
  if (!normalizedSiteKey) {
    throw new Error('A reCAPTCHA v3 site key is required for production Firebase access.');
  }

  return { type: 'recaptcha-v3', siteKey: normalizedSiteKey };
}
