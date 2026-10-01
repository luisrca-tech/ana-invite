export type AppCheckMode =
  | { type: 'emulator' }
  | { type: 'disabled' }
  | { type: 'recaptcha-enterprise'; siteKey: string };

export function resolveAppCheckMode({ useEmulators, siteKey }: { useEmulators: boolean; siteKey?: string }): AppCheckMode {
  if (useEmulators) return { type: 'emulator' };

  const normalizedSiteKey = siteKey?.trim();
  if (!normalizedSiteKey) return { type: 'disabled' };

  return { type: 'recaptcha-enterprise', siteKey: normalizedSiteKey };
}
