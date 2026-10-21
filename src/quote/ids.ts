const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function chunk(size: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  let out = '';
  for (let i = 0; i < size; i += 1) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export function newQuoteNumber(): string {
  return `CT-${chunk(4)}-${chunk(4)}`;
}

export function newRecoveryCode(): string {
  return `RC-${chunk(4)}-${chunk(4)}-${chunk(4)}`;
}

export function uid(): string {
  return crypto.randomUUID();
}

export function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(30, Math.round(value)));
}
