import type { Product } from '../types';

export function parseCapacity(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const match = raw.match(/(\d+)/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0 || value > 10000) return null;
  return value;
}

export function parseProtocols(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[/|,;]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 1 && part.length < 80);
}

/** Reads ranges such as "1.5m a 4.0m" or "Hasta 12 metros" into millimeters. */
export function parseRangeMm(raw: string | undefined | null): { minMm: number | null; maxMm: number | null } | null {
  if (!raw) return null;
  const text = raw.toLowerCase().replace(',', '.');
  const meters = [...text.matchAll(/(\d+(?:\.\d+)?)\s*m(?!m)/g)].map((match) => Number(match[1]) * 1000);
  if (meters.length >= 2) {
    return { minMm: Math.round(Math.min(meters[0], meters[1])), maxMm: Math.round(Math.max(meters[0], meters[1])) };
  }
  if (meters.length === 1) {
    const hasMin = /desde|min/.test(text);
    return hasMin
      ? { minMm: Math.round(meters[0]), maxMm: null }
      : { minMm: null, maxMm: Math.round(meters[0]) };
  }
  const mm = [...text.matchAll(/(\d+(?:\.\d+)?)\s*mm/g)].map((match) => Number(match[1]));
  if (mm.length >= 2) {
    return { minMm: Math.round(Math.min(mm[0], mm[1])), maxMm: Math.round(Math.max(mm[0], mm[1])) };
  }
  if (mm.length === 1) return { minMm: null, maxMm: Math.round(mm[0]) };
  return null;
}

export function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export function protocolMatch(deviceProtocol: string, supported: string[]): 'match' | 'unknown' | 'mismatch' {
  const device = deviceProtocol.trim();
  if (!device) return 'unknown';
  if (supported.length === 0) return 'unknown';
  const needle = normalizeToken(device);
  if (!needle) return 'unknown';
  const hit = supported.some((item) => {
    const token = normalizeToken(item);
    if (!token) return false;
    return needle.includes(token) || token.includes(needle);
  });
  return hit ? 'match' : 'mismatch';
}

export function catalogPrice(product: Product | null | undefined): number | null {
  if (!product) return null;
  const price = typeof product.price === 'number' ? product.price : Number(product.price);
  if (!Number.isFinite(price)) return null;
  return price;
}

export function fingerprintProducts(products: Product[]): string {
  return products
    .map((product) => `${product.id}:${catalogPrice(product) ?? 'na'}`)
    .sort()
    .join('|');
}

export function money(value: number, currency: string): string {
  const formatted = value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${currency} ${formatted}`;
}
