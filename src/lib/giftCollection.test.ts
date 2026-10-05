import { describe, expect, it } from 'vitest';
import {
  filterGifts,
  countAvailable,
  countMatchingGiftsInCategory,
  getVisibleCategoryIds,
} from './giftCollection';
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

  it('counts only gifts in a category that match the active search or filter', () => {
    const searchMatches = filterGifts(sampleGifts, reservations, null, 'all', 'TV');
    const guestMatches = filterGifts(sampleGifts, reservations, 'ana-guest', 'mine', '');

    expect(countMatchingGiftsInCategory(searchMatches, 'sala')).toBe(1);
    expect(countMatchingGiftsInCategory(searchMatches, 'cozinha')).toBe(0);
    expect(countMatchingGiftsInCategory(guestMatches, 'sala')).toBe(1);
    expect(countMatchingGiftsInCategory(guestMatches, 'cozinha')).toBe(0);
  });

  it('keeps one stable catalog entry for every gift in the invitation', () => {
    expect(giftCategories.map(({ id }) => id)).toEqual(['sala', 'cozinha', 'banheiros', 'quartos', 'lavanderia']);
    expect(gifts).toHaveLength(69);
    expect(giftCatalogByCategory).toEqual({ sala: 2, cozinha: 43, banheiros: 3, quartos: 10, lavanderia: 11 });
    expect(gifts.filter(({ categoryId }) => categoryId === 'sala')).toEqual([
      { id: 'sala-01', label: 'TV', categoryId: 'sala' },
      { id: 'sala-02', label: 'Porta-retrato 10x15', categoryId: 'sala' },
    ]);
    expect(gifts.some(({ label }) => label === 'Colher medidora')).toBe(true);
    expect(gifts.filter(({ categoryId }) => categoryId === 'cozinha').slice(-3)).toEqual([
      { id: 'cozinha-41', label: 'Talheres de plástico infantil', categoryId: 'cozinha' },
      { id: 'cozinha-42', label: 'Copos de plástico infantil', categoryId: 'cozinha' },
      { id: 'cozinha-43', label: 'Pratos de plástico infantil', categoryId: 'cozinha' },
    ]);
    expect(new Set(gifts.map(({ id }) => id)).size).toBe(gifts.length);
  });
});
