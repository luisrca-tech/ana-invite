import { describe, expect, it } from 'vitest';
import { filterGifts, countAvailable, getVisibleCategoryIds } from './giftCollection';
import { giftCategories, giftCatalogByCategory, gifts, type Gift } from '../data/gifts';

const sampleGifts: Gift[] = [
  { id: 'sala-tv', label: 'TV', categoryId: 'sala' },
  { id: 'cozinha-taca', label: 'Jogo de xícaras de café', categoryId: 'cozinha' },
  { id: 'cozinha-copo', label: 'Copo medidor', categoryId: 'cozinha' },
];

const reservations = {
  'sala-tv': { guestUid: 'ana-guest', fullName: 'João da Silva' },
  'cozinha-taca': { guestUid: 'outro-guest', fullName: 'Maria Souza' },
};

describe('gift collection', () => {
  it('filters available gifts and gifts owned by the current guest', () => {
    expect(filterGifts(sampleGifts, reservations, 'ana-guest', 'available', '').map(({ id }) => id)).toEqual([
      'cozinha-copo',
    ]);
    expect(filterGifts(sampleGifts, reservations, 'ana-guest', 'mine', '').map(({ id }) => id)).toEqual([
      'sala-tv',
    ]);
    expect(filterGifts(sampleGifts, reservations, null, 'mine', '')).toEqual([]);
  });

  it('searches without case or accent differences and reports available counts by category', () => {
    expect(filterGifts(sampleGifts, reservations, null, 'all', 'XICARAS')).toHaveLength(1);
    expect(filterGifts(sampleGifts, reservations, null, 'all', 'xícaras')).toHaveLength(1);
    expect(countAvailable(sampleGifts, reservations, 'cozinha')).toBe(1);
    expect(countAvailable(sampleGifts, reservations, 'sala')).toBe(0);
  });

  it('returns only categories containing gifts that match the active search and filters', () => {
    const matches = filterGifts(sampleGifts, reservations, null, 'all', 'TV');

    expect([...getVisibleCategoryIds(matches)]).toEqual(['sala']);
    expect(getVisibleCategoryIds([])).toEqual(new Set());
  });

  it('keeps one stable catalog entry for every gift in the invitation', () => {
    expect(giftCategories.map(({ id }) => id)).toEqual(['sala', 'cozinha', 'banheiros', 'quartos', 'lavanderia']);
    expect(gifts).toHaveLength(65);
    expect(giftCatalogByCategory).toEqual({ sala: 1, cozinha: 40, banheiros: 3, quartos: 10, lavanderia: 11 });
    expect(gifts.some(({ label }) => label === 'Colher medidora')).toBe(true);
    expect(new Set(gifts.map(({ id }) => id)).size).toBe(gifts.length);
  });
});
