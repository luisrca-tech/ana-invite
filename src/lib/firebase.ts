import { browserLocalPersistence, getAuth, setPersistence, signInAnonymously } from 'firebase/auth';
import { FirebaseError, getApps, initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore';
import { connectAuthEmulator } from 'firebase/auth';
import type { ReservationMap, ReservationSummary } from './giftCollection';
import { resolveAppCheckMode } from './firebaseAppCheck';

export interface GuestProfile {
  uid: string;
  fullName: string;
}

export class GiftAlreadyReservedError extends Error {
  constructor() {
    super('This gift has already been reserved.');
    this.name = 'GiftAlreadyReservedError';
  }
}

let appCheckInitialized = false;

function getFirebase() {
  const {
    DEV,
    PUBLIC_FIREBASE_API_KEY,
    PUBLIC_FIREBASE_APP_CHECK_SITE_KEY,
    PUBLIC_FIREBASE_APP_ID,
    PUBLIC_FIREBASE_PROJECT_ID,
    PUBLIC_USE_FIREBASE_EMULATORS,
  } = import.meta.env;

  if (!PUBLIC_FIREBASE_API_KEY || !PUBLIC_FIREBASE_APP_ID || !PUBLIC_FIREBASE_PROJECT_ID) {
    return null;
  }

  const app =
    getApps()[0] ??
    initializeApp({
      apiKey: PUBLIC_FIREBASE_API_KEY,
      appId: PUBLIC_FIREBASE_APP_ID,
      projectId: PUBLIC_FIREBASE_PROJECT_ID,
      authDomain: `${PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    });
  const useEmulators = DEV && PUBLIC_USE_FIREBASE_EMULATORS === 'true';
  const appCheckMode = resolveAppCheckMode({
    useEmulators,
    siteKey: PUBLIC_FIREBASE_APP_CHECK_SITE_KEY,
  });

  if (appCheckMode.type === 'recaptcha-v3' && !appCheckInitialized) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckMode.siteKey),
      isTokenAutoRefreshEnabled: true,
    });
    appCheckInitialized = true;
  }

  const auth = getAuth(app);
  const firestore = getFirestore(app);

  if (useEmulators) {
    try {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes('already been initialized')) {
        throw error;
      }
    }
  }

  return { auth, firestore };
}

export function hasFirebaseConfig(): boolean {
  return getFirebase() !== null;
}

export function observeReservations(
  onUpdate: (reservations: ReservationMap, isFresh: boolean) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe | null {
  const client = getFirebase();

  if (!client) return null;

  return onSnapshot(
    collection(client.firestore, 'reservations'),
    { includeMetadataChanges: true },
    (snapshot) => {
      const reservations: Record<string, ReservationSummary> = {};

      snapshot.forEach((reservation) => {
        const value = reservation.data();

        if (typeof value.guestUid === 'string' && typeof value.fullName === 'string') {
          reservations[reservation.id] = { guestUid: value.guestUid, fullName: value.fullName };
        }
      });

      onUpdate(reservations, !snapshot.metadata.fromCache);
    },
    onError,
  );
}

async function readyClient() {
  const client = getFirebase();

  if (!client) throw new Error('Firebase is not configured.');

  await setPersistence(client.auth, browserLocalPersistence);
  await client.auth.authStateReady();

  return client;
}

export async function getCurrentGuest(): Promise<GuestProfile | null> {
  const client = await readyClient();
  const user = client.auth.currentUser;

  if (!user) return null;

  const profile = await getDoc(doc(client.firestore, 'guests', user.uid));

  if (!profile.exists() || typeof profile.data().fullName !== 'string') return null;

  return { uid: user.uid, fullName: profile.data().fullName };
}

export async function createGuestProfile(fullName: string): Promise<GuestProfile> {
  const client = await readyClient();
  const user = client.auth.currentUser ?? (await signInAnonymously(client.auth)).user;
  const profileRef = doc(client.firestore, 'guests', user.uid);

  return runTransaction(client.firestore, async (transaction) => {
    const profile = await transaction.get(profileRef);

    if (profile.exists()) {
      const savedName = profile.data().fullName;
      if (typeof savedName !== 'string') throw new Error('The guest profile is invalid.');
      return { uid: user.uid, fullName: savedName };
    }

    transaction.set(profileRef, { fullName });
    return { uid: user.uid, fullName };
  });
}

export async function reserveGift(giftId: string, guest: GuestProfile): Promise<void> {
  const { firestore } = await readyClient();
  const reservationRef = doc(firestore, 'reservations', giftId);
  const profileRef = doc(firestore, 'guests', guest.uid);

  await runTransaction(firestore, async (transaction) => {
    const [existingReservation, profile] = await Promise.all([
      transaction.get(reservationRef),
      transaction.get(profileRef),
    ]);

    if (existingReservation.exists()) throw new GiftAlreadyReservedError();
    if (!profile.exists() || profile.data().fullName !== guest.fullName) {
      throw new Error('The guest identity could not be verified.');
    }

    transaction.set(reservationRef, {
      giftId,
      guestUid: guest.uid,
      fullName: guest.fullName,
      reservedAt: serverTimestamp(),
    });
  });
}

export async function cancelReservation(giftId: string, guestUid: string): Promise<void> {
  const { firestore, auth } = await readyClient();

  if (!auth.currentUser || auth.currentUser.uid !== guestUid) {
    throw new Error('The current browser does not own this reservation.');
  }

  const reservationRef = doc(firestore, 'reservations', giftId);

  await runTransaction(firestore, async (transaction) => {
    const reservation = await transaction.get(reservationRef);

    if (!reservation.exists()) return;
    if (reservation.data().guestUid !== guestUid) throw new Error('This reservation belongs to another guest.');

    transaction.delete(reservationRef);
  });
}

export function getReservationError(error: unknown): string {
  if (error instanceof GiftAlreadyReservedError) {
    return 'Alguém acabou de escolher esse presente. A lista foi atualizada — que tal escolher outro?';
  }

  if (error instanceof FirebaseError && error.code === 'permission-denied') {
    return 'Não foi possível atualizar a lista. Tente novamente em instantes.';
  }

  if (error instanceof FirebaseError && (error.code === 'unavailable' || error.code === 'deadline-exceeded')) {
    return 'Estamos sem conexão com a lista agora. Suas escolhas continuam seguras; tente novamente quando a internet voltar.';
  }

  return 'Não conseguimos concluir essa ação agora. Sua reserva não foi alterada; tente novamente em instantes.';
}
