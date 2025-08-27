export function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined && value !== '' && value !== '-';
}

export function tokens(value: string): string[] {
  return value
    .split('|')
    .map((token) => token.trim())
    .filter((token) => isPresent(token));
}
