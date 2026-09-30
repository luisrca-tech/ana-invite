export function normalizeFullName(value: string): string | null {
  const name = value.trim().replace(/\s+/gu, ' ');

  if (name.length > 120 || name.split(' ').filter(Boolean).length < 2) {
    return null;
  }

  return name;
}
