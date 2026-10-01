# Ana Luísa and Eduardo's invitation

A mobile-first, static Astro invitation in Brazilian Portuguese for Ana Luísa's birthday and Eduardo Miguel and Ana Luísa's housewarming. The gift catalog is versioned in `src/data/gifts.ts`; shared reservations use anonymous Firebase Authentication and Cloud Firestore.

## Local development

Requirements: Node.js 22 or newer and Java 21 or newer for the Firebase Emulator Suite.

```sh
npm ci
cp .env.example .env
```

The example file uses these demo values in `.env`; they point the client at local emulators and do not require real Firebase credentials:

```dotenv
PUBLIC_FIREBASE_API_KEY=demo-api-key
PUBLIC_FIREBASE_APP_CHECK_SITE_KEY=
PUBLIC_FIREBASE_APP_ID=demo-app-id
PUBLIC_FIREBASE_PROJECT_ID=demo-ana-luisa
PUBLIC_USE_FIREBASE_EMULATORS=true
```

These app identifiers are public client configuration; Firestore security rules protect the data. Start the emulators and Astro in separate terminals:

```sh
npm run emulators
npm run dev
```

Run the unit tests, Firestore rules tests, static checks, and production build with:

```sh
npm test
npm run test:rules
npm run check
npm run build
```

## Firebase setup

Create a Firebase project on the no-cost Spark plan. In the Firebase console:

1. Register a Web app and copy its API key and App ID.
2. Anonymous Authentication is configured in `firebase.json` and enabled with the deploy command below.
3. Create the default **Cloud Firestore** database in production mode in `southamerica-east1` (São Paulo).
4. Register a reCAPTCHA v3 site and its secret in **Firebase Console → App Check** for the Web app. The site key is public and goes in Cloudflare's build variables; keep the reCAPTCHA secret in Firebase only.
5. Add `localhost` and the deployed site's hostname to Authentication's authorized domains.
6. Set `PUBLIC_FIREBASE_API_KEY`, `PUBLIC_FIREBASE_APP_ID`, `PUBLIC_FIREBASE_PROJECT_ID`, `PUBLIC_FIREBASE_APP_CHECK_SITE_KEY`, `PUBLIC_SITE_URL`, and `PUBLIC_USE_FIREBASE_EMULATORS=false` in Cloudflare's **build environment**. Astro embeds `PUBLIC_*` values into the static site during the build, so updating them requires a new build and deploy. The production client deliberately stays unavailable if the App Check site key is missing.
7. Deploy anonymous Authentication and the repository's Firestore rules:

   ```sh
   npx firebase deploy --only auth,firestore:rules --project YOUR_FIREBASE_PROJECT_ID
   ```

Never put a Firebase Admin SDK key or service-account credential in this site. The client configuration is public; the rules enforce the allowed gift IDs, write-once guest names, single reservation per item, and owner-only cancellation.

Before sharing the site, monitor App Check traffic and enable enforcement for Cloud Firestore and Authentication in the Firebase console. The browser sends invisible reCAPTCHA v3 App Check tokens; the site key alone does not enable server enforcement. App Check helps reduce unauthorized automated access, but anonymous sign-in still does not prove that someone was invited.

Names on reservations are public to visitors. Anonymous Firebase accounts identify one browser installation, not a verified person. Clearing that browser's site data or changing devices removes the ability to cancel its existing reservations. Do not enable automatic deletion of inactive anonymous accounts, because doing so can remove cancellation access. Reservations do not expire and there is no admin panel or RSVP flow in this version.

Firebase Spark has usage quotas. When a quota is exhausted, reservation service may be unavailable until quota resets; the page does not claim a reservation succeeded unless Firestore confirms it.

## Cloudflare Workers

This Astro site builds to the static `dist` directory and can be served as Worker assets on a `workers.dev` hostname. Connect the repository to Workers Builds and configure:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Worker static assets directory: `dist`
- Build variables: the four `PUBLIC_FIREBASE_*` values above, `PUBLIC_USE_FIREBASE_EMULATORS=false`, and `PUBLIC_SITE_URL=https://convite.ana-luisa.workers.dev/`.

Set these as Workers Builds build variables, not only as Worker runtime variables. The static Astro bundle reads them while it is being built.

The build is static and uses Astro's image service to generate responsive image formats. The Firebase client bundle is loaded only as visitors approach the gift registry. Google Maps links and the lazy-loaded map search for the condominium entrance (portaria); confirm the exact gate pin with the hosts before distributing the invitation.

## Documentation

- [Astro client-side scripts](https://docs.astro.build/en/guides/client-side-scripts/)
- [Firebase anonymous authentication](https://firebase.google.com/docs/auth/web/anonymous-auth)
- [Firebase App Check with reCAPTCHA v3](https://firebase.google.com/docs/app-check/web/recaptcha-provider)
- [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Deploy Astro to Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/)
- [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
