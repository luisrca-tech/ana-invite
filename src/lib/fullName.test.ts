import { describe, expect, it } from 'vitest';
import { normalizeFullName, resetFullNameValidationOnInput } from './fullName';

class TestInput extends EventTarget {
  customValidity = 'Informe pelo menos seu nome e sobrenome.';

  setCustomValidity(message: string): void {
    this.customValidity = message;
  }
}

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

  it('clears stale custom and inline errors as the guest edits the name', () => {
    const input = new TestInput();
    const error = { textContent: 'Conte seu nome e sobrenome para que possamos identificar sua escolha.' };

    resetFullNameValidationOnInput(input as unknown as HTMLInputElement, error as HTMLElement);
    input.dispatchEvent(new Event('input'));

    expect(input.customValidity).toBe('');
    expect(error.textContent).toBe('');
  });
});
