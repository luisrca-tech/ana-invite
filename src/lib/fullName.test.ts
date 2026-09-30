import { describe, expect, it } from 'vitest';
import { normalizeFullName } from './fullName';

describe('normalizeFullName', () => {
  it('trims extra spaces while preserving Brazilian names and accents', () => {
    expect(normalizeFullName('  Ana   Luísa   de  Souza ')).toBe('Ana Luísa de Souza');
  });

  it('requires at least a first name and a surname', () => {
    expect(normalizeFullName('Ana')).toBeNull();
    expect(normalizeFullName('  ')).toBeNull();
  });

  it('rejects names longer than Firestore rules allow', () => {
    expect(normalizeFullName(`Ana ${'a'.repeat(120)}`)).toBeNull();
  });
});
