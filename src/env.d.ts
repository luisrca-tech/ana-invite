/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_FIREBASE_API_KEY: string;
  readonly PUBLIC_FIREBASE_APP_CHECK_SITE_KEY?: string;
  readonly PUBLIC_FIREBASE_APP_ID: string;
  readonly PUBLIC_FIREBASE_PROJECT_ID: string;
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_USE_FIREBASE_EMULATORS?: string;
}
