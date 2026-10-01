import type { Gift } from '../data/gifts';

export type GiftFilter = 'all' | 'available' | 'mine';

export interface ReservationSummary {
  guestUid: string;
  fullName: string;
}

export type ReservationMap = Readonly<Record<string, ReservationSummary>>;

export function getVisibleCategoryIds(matchingGifts: readonly Gift[]): Set<string> {
  return new Set(matchingGifts.map(({ categoryId }) => categoryId));
}

function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

export function filterGifts(
  gifts: readonly Gift[],
  reservations: ReservationMap,
  guestUid: string | null,
  filter: GiftFilter,
  search: string,
): Gift[] {
  const query = normalizeSearch(search);

  return gifts.filter((gift) => {
    const reservation = reservations[gift.id];
    const matchesFilter =
      filter === 'all' ||
      (filter === 'available' && !reservation) ||
      (filter === 'mine' && guestUid !== null && reservation?.guestUid === guestUid);
    const matchesSearch = query.length === 0 || normalizeSearch(gift.label).includes(query);

    return matchesFilter && matchesSearch;
  });
}

export function countAvailable(
  gifts: readonly Gift[],
  reservations: ReservationMap,
  categoryId: string,
): number {
  return gifts.filter((gift) => gift.categoryId === categoryId && !reservations[gift.id]).length;
}
