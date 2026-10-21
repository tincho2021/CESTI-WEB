import type { Product } from '../types';
import type { BomLine, StoredQuote } from './types';

const CACHE_KEY = 'cesti-technical-docs';

export type CachedDoc = {
  technicalDoc: string;
  technicalDocName: string;
  technicalDocKind: 'image' | 'pdf';
};

function readCache(): Record<string, CachedDoc> {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) as Record<string, CachedDoc> : {};
  } catch {
    return {};
  }
}

export function cacheTechnicalDoc(productId: string, doc: CachedDoc | null) {
  if (typeof localStorage === 'undefined') return;
  const all = readCache();
  if (!doc?.technicalDoc) delete all[productId];
  else all[productId] = doc;
  localStorage.setItem(CACHE_KEY, JSON.stringify(all));
}

function fold(value: string | null | undefined): string {
  return (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function words(value: string): string[] {
  return fold(value).split(/[^a-z0-9]+/).filter((word) => word.length > 4);
}

function lineUsesProduct(line: BomLine, product: Product): boolean {
  if (line.section === 'infrastructure') return false;
  if (line.productId && line.productId === product.id) return true;
  const productWords = words(product.name);
  const lineWords = words(line.name);
  const shared = productWords.filter((word) => lineWords.includes(word));
  if (shared.length >= 2) return true;
  return productWords.includes('sonda') && lineWords.includes('sonda');
}

export function productsWithDocs(quote: StoredQuote, products: Product[]): Product[] {
  const cache = readCache();
  const merged = new Map<string, Product>();
  products.forEach((product) => {
    const stored = cache[product.id];
    merged.set(product.id, stored?.technicalDoc ? { ...product, ...stored } : product);
  });
  Object.entries(cache).forEach(([id, stored]) => {
    if (!merged.has(id) && stored.technicalDoc) {
      merged.set(id, {
        id,
        name: stored.technicalDocName || id,
        price: 0,
        category: '',
        image: '',
        specs: {},
        description: '',
        smartReady: false,
        stock: 0,
        ...stored,
      });
    }
  });
  const lines = quote.bom?.lines ?? [];
  const sceneIds = new Set((quote.scene?.objects ?? []).map((object) => object.productId).filter(Boolean));
  const chosen: Product[] = [];
  const seen = new Set<string>();
  merged.forEach((product) => {
    if (!product.technicalDoc || !product.technicalDocKind || seen.has(product.id)) return;
    const used = sceneIds.has(product.id) || lines.some((line) => lineUsesProduct(line, product));
    if (!used) return;
    seen.add(product.id);
    chosen.push(product);
  });
  return chosen;
}
