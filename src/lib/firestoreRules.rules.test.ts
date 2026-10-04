import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const projectId = 'demo-ana-luisa';
let testEnvironment: RulesTestEnvironment;

async function seedProfile(uid: string, fullName: string): Promise<void> {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'guests', uid), { fullName });
  });
}

function asGuest(uid: string) {
  return testEnvironment.authenticatedContext(uid, {
    firebase: { sign_in_provider: 'anonymous' },
  }).firestore();
}

describe('Firestore reservation rules', () => {
  beforeAll(async () => {
    const rules = await readFile(new URL('../../firestore.rules', import.meta.url), 'utf8');
    testEnvironment = await initializeTestEnvironment({
      projectId,
      firestore: { rules },
    });
  });

  beforeEach(async () => {
    await testEnvironment.clearFirestore();
  });

  afterAll(async () => {
    await testEnvironment.cleanup();
  });

  it('allows public gift-name visibility but keeps guest profiles private', async () => {
    await seedProfile('guest-a', 'Ana Luísa');
    await seedProfile('guest-b', 'Eduardo Miguel');
    const publicDatabase = testEnvironment.unauthenticatedContext().firestore();

    await assertSucceeds(getDocs(collection(publicDatabase, 'reservations')));
    await assertFails(getDocs(collection(publicDatabase, 'guests')));
    await assertFails(getDocs(collection(asGuest('guest-b'), 'guests')));
  });

  it('lets a guest create one valid profile and never overwrite it', async () => {
    const profile = doc(asGuest('guest-a'), 'guests', 'guest-a');

    await assertSucceeds(setDoc(profile, { fullName: 'Ana Luísa' }));
    await assertFails(setDoc(profile, { fullName: 'Outro Nome' }));
    await assertFails(setDoc(doc(asGuest('guest-b'), 'guests', 'guest-b'), { fullName: 'Guest' }));
    await assertFails(setDoc(doc(asGuest('guest-a'), 'guests', 'other-guest'), { fullName: 'Outra Pessoa' }));
  });

  it('permits only one create for each catalog item and denies edits', async () => {
    const guestA = asGuest('guest-a');
    const guestB = asGuest('guest-b');
    await seedProfile('guest-a', 'Ana Luísa');
    await seedProfile('guest-b', 'Eduardo Miguel');

    const tv = doc(guestA, 'reservations', 'sala-01');
    await assertSucceeds(
      setDoc(tv, {
        giftId: 'sala-01',
        guestUid: 'guest-a',
        fullName: 'Ana Luísa',
        reservedAt: serverTimestamp(),
      }),
    );
    await assertFails(updateDoc(tv, { fullName: 'Ana Outro Nome' }));
    await assertFails(deleteDoc(doc(guestB, 'reservations', 'sala-01')));
    await assertSucceeds(deleteDoc(tv));

    for (const giftId of ['cozinha-41', 'cozinha-42', 'cozinha-43']) {
      await assertSucceeds(
        setDoc(doc(guestA, 'reservations', giftId), {
          giftId,
          guestUid: 'guest-a',
          fullName: 'Ana Luísa',
          reservedAt: serverTimestamp(),
        }),
      );
    }
    await assertFails(
      setDoc(doc(guestA, 'reservations', 'cozinha-44'), {
        giftId: 'cozinha-44',
        guestUid: 'guest-a',
        fullName: 'Ana Luísa',
        reservedAt: serverTimestamp(),
      }),
    );
  });

  it('rejects unlisted gifts, altered names, incomplete reservations, and non-anonymous accounts', async () => {
    await seedProfile('guest-a', 'Ana Luísa');
    const guest = asGuest('guest-a');
    const validReservation = {
      giftId: 'sala-01',
      guestUid: 'guest-a',
      fullName: 'Ana Luísa',
      reservedAt: serverTimestamp(),
    };

    await assertFails(setDoc(doc(guest, 'reservations', 'fake-gift'), { ...validReservation, giftId: 'fake-gift' }));
    await assertFails(
      setDoc(doc(guest, 'reservations', 'sala-01'), { ...validReservation, fullName: 'Nome Alterado' }),
    );
    await assertFails(setDoc(doc(guest, 'reservations', 'sala-01'), { ...validReservation, guestUid: 'guest-b' }));
    await assertFails(
      setDoc(doc(testEnvironment.authenticatedContext('guest-a').firestore(), 'reservations', 'sala-01'),
        validReservation),
    );
  });

  it('allows only one guest to reserve a contested gift', async () => {
    await seedProfile('guest-a', 'Ana Luísa');
    await seedProfile('guest-b', 'Eduardo Miguel');

    const attempts = await Promise.allSettled(
      [
        { database: asGuest('guest-a'), uid: 'guest-a', fullName: 'Ana Luísa' },
        { database: asGuest('guest-b'), uid: 'guest-b', fullName: 'Eduardo Miguel' },
      ].map(({ database, uid, fullName }) =>
        setDoc(doc(database, 'reservations', 'cozinha-01'), {
          giftId: 'cozinha-01',
          guestUid: uid,
          fullName,
          reservedAt: serverTimestamp(),
        }),
      ),
    );

    expect(attempts.filter(({ status }) => status === 'fulfilled')).toHaveLength(1);
    expect(attempts.filter(({ status }) => status === 'rejected')).toHaveLength(1);
  });
});
