import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { Product } from '../types';
import { db } from '../lib/firebase';
import { buildBom } from './bom';
import { migrateScene } from './scene/logic';
import { newQuoteNumber, newRecoveryCode } from './ids';
import { defaultSettings, sanitizeSettings } from './settings';
import { MAX_CONNECTIONS, MAX_OBJECTS, type Customer, type QuoteStatus, type SceneState, type StoredQuote, type TechnicalSettings } from './types';

const LOCAL_QUOTES = 'cesti-quotes-local';

function isPermission(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /permission|insufficient/i.test(message);
}

function readLocalQuotes(): Record<string, StoredQuote> {
  try {
    const raw = localStorage.getItem(LOCAL_QUOTES);
    return raw ? JSON.parse(raw) as Record<string, StoredQuote> : {};
  } catch {
    return {};
  }
}

export const VISTA_KEY = 'cesti-vista-3d';

function rememberQuote(quote: StoredQuote) {
  const all = readLocalQuotes();
  all[quote.recoveryCode] = quote;
  all[`public:${quote.quoteNumber}`] = { ...quote, recoveryCode: '' };
  localStorage.setItem(LOCAL_QUOTES, JSON.stringify(all));
  localStorage.setItem(VISTA_KEY, quote.quoteNumber);
  window.dispatchEvent(new Event('cesti-vista'));
}

export function lastVistaQuoteNumber(): string {
  const marked = localStorage.getItem(VISTA_KEY);
  if (marked) return marked;
  const publics = Object.entries(readLocalQuotes()).filter(([key]) => key.startsWith('public:'));
  publics.sort((left, right) => (right[1].updatedAt || '').localeCompare(left[1].updatedAt || ''));
  return publics[0] ? publics[0][0].slice('public:'.length) : '';
}

export function assertScene(scene: SceneState) {
  if (!scene || !Array.isArray(scene.objects) || !Array.isArray(scene.connections)) {
    throw new Error('El escenario no es válido.');
  }
  if (scene.objects.length > MAX_OBJECTS) throw new Error('El escenario admite hasta 60 elementos.');
  if (scene.connections.length > MAX_CONNECTIONS) throw new Error('El escenario admite hasta 120 conexiones.');
}

export function validateCustomer(customer: Customer): string | null {
  if (!customer.name.trim()) return 'Indicá el nombre, apellido o razón social.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) return 'El correo electrónico no es válido.';
  if (customer.phone.replace(/\D/g, '').length < 6) return 'Indicá un teléfono de contacto.';
  if (!customer.activity) return 'Elegí el tipo de actividad.';
  return null;
}

export function emptyCustomer(): Customer {
  return { name: '', company: '', email: '', phone: '', location: '', activity: '', notes: '' };
}

function compact<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function previewOrUndefined(preview?: string): string | undefined {
  if (!preview || !preview.startsWith('data:image/')) return undefined;
  if (preview.length > 700000) return undefined;
  return preview;
}

export async function loadSettings(): Promise<TechnicalSettings> {
  try {
    const snap = await getDoc(doc(db, ...SETTINGS_DOC));
    if (!snap.exists()) return defaultSettings();
    return sanitizeSettings(snap.data());
  } catch {
    return defaultSettings();
  }
}

export async function saveSettings(settings: TechnicalSettings): Promise<void> {
  await setDoc(doc(db, ...SETTINGS_DOC), compact(sanitizeSettings(settings)));
}

function quoteFromParts(input: {
  recoveryCode: string;
  quoteNumber: string;
  revision: number;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
  scene: SceneState;
  customer: Customer;
  settings: TechnicalSettings;
  products: Product[];
  priceOverrides: Record<string, number>;
  previewImage?: string;
}): StoredQuote {
  const bom = buildBom(input.scene, input.settings, input.products, input.priceOverrides);
  const preview = previewOrUndefined(input.previewImage);
  return {
    id: input.recoveryCode,
    quoteNumber: input.quoteNumber,
    recoveryCode: input.recoveryCode,
    revision: input.revision,
    status: input.status,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    installationType: input.scene.installationType,
    customer: input.customer,
    scene: input.scene,
    rulesVersion: input.settings.rulesVersion,
    catalogFingerprint: bom.catalogFingerprint,
    bom,
    ...(preview ? { previewImage: preview } : {}),
    priceOverrides: input.priceOverrides,
  };
}

async function writeQuote(quote: StoredQuote): Promise<void> {
  const privateDoc = compact(quote);
  const publicDoc = compact({ ...quote, recoveryCode: '' });
  delete (publicDoc as { previewImage?: string }).previewImage;
  if (quote.previewImage) {
    (publicDoc as StoredQuote).previewImage = quote.previewImage;
  }
  const indexDoc = {
    quoteNumber: quote.quoteNumber,
    recoveryHint: false,
    revision: quote.revision,
    status: quote.status,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
    customer: quote.customer,
    installationType: quote.installationType,
    scene: quote.scene,
    bom: quote.bom,
    rulesVersion: quote.rulesVersion,
    catalogFingerprint: quote.catalogFingerprint,
    priceOverrides: quote.priceOverrides,
    previewImage: quote.previewImage ?? null,
  };
  await setDoc(doc(db, 'quotes', quote.recoveryCode), privateDoc);
  await setDoc(doc(db, 'quotePublic', quote.quoteNumber), publicDoc);
  await setDoc(doc(db, 'quoteIndex', quote.quoteNumber), compact(indexDoc));
  await setDoc(doc(db, 'quotes', quote.recoveryCode, 'versions', String(quote.revision)), compact({
    revision: quote.revision,
    savedAt: quote.updatedAt,
    scene: quote.scene,
    customer: quote.customer,
    bom: quote.bom,
    status: quote.status,
    rulesVersion: quote.rulesVersion,
  }));
}

export async function saveQuote(input: {
  scene: SceneState;
  customer: Customer;
  settings: TechnicalSettings;
  products: Product[];
  priceOverrides?: Record<string, number>;
  existing?: StoredQuote | null;
  previewImage?: string;
  asRevision?: boolean;
}): Promise<StoredQuote> {
  assertScene(input.scene);
  const problem = validateCustomer(input.customer);
  if (problem) throw new Error(problem);

  const now = new Date().toISOString();
  const recoveryCode = input.existing?.recoveryCode || newRecoveryCode();
  const quoteNumber = input.existing?.quoteNumber || newQuoteNumber();
  const revision = input.existing ? input.existing.revision + (input.asRevision === false ? 0 : 1) : 1;
  const createdAt = input.existing?.createdAt || now;
  const keptOverrides = { ...(input.existing?.priceOverrides ?? {}), ...(input.priceOverrides ?? {}) };
  const status: QuoteStatus = input.existing && input.asRevision === false ? input.existing.status : 'pending_review';

  const localQuote = quoteFromParts({
    recoveryCode,
    quoteNumber,
    revision: input.existing && input.asRevision === false ? input.existing.revision : revision,
    status,
    createdAt,
    updatedAt: now,
    scene: input.scene,
    customer: input.customer,
    settings: input.settings,
    products: input.products,
    priceOverrides: keptOverrides,
    previewImage: input.previewImage,
  });

  try {
    const response = await fetch('/.netlify/functions/quote-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scene: input.scene,
        customer: input.customer,
        recoveryCode,
        quoteNumber,
        revision: localQuote.revision,
        createdAt,
        status,
        priceOverrides: keptOverrides,
        previewImage: localQuote.previewImage ?? null,
      }),
    });
    if (response.ok) {
      const payload = await response.json() as { quote?: StoredQuote };
      if (payload.quote?.recoveryCode && payload.quote.bom) {
        rememberQuote(payload.quote);
        return payload.quote;
      }
    }
  } catch {
    // Local Vite has no function. The same engine writes below.
  }

  try {
    await writeQuote(localQuote);
    rememberQuote(localQuote);
    return localQuote;
  } catch (error) {
    if (!isPermission(error)) throw error;
    rememberQuote(localQuote);
    return { ...localQuote, cloud: false } as StoredQuote & { cloud?: boolean };
  }
}

export async function loadPrivateQuote(recoveryCode: string): Promise<StoredQuote | null> {
  const code = recoveryCode.trim();
  if (!code) return null;
  try {
    const snap = await getDoc(doc(db, 'quotes', code));
    if (!snap.exists()) return readLocalQuotes()[code] ?? null;
    const data = snap.data() as StoredQuote;
    try {
      const published = await getDoc(doc(db, 'quotePublic', data.quoteNumber));
      if (published.exists()) {
        const publicData = published.data() as StoredQuote;
        return {
          ...data,
          scene: migrateScene(data.scene),
          status: publicData.status || data.status,
          priceOverrides: { ...(data.priceOverrides ?? {}), ...(publicData.priceOverrides ?? {}) },
        };
      }
    } catch {
      return { ...data, scene: migrateScene(data.scene) };
    }
    return { ...data, scene: migrateScene(data.scene) };
  } catch (error) {
    if (!isPermission(error)) throw error;
    const local = readLocalQuotes()[code];
    return local ? { ...local, scene: migrateScene(local.scene) } : null;
  }
}

export async function loadPublicQuote(quoteNumber: string): Promise<StoredQuote | null> {
  const code = quoteNumber.trim();
  if (!code) return null;
  try {
    const snap = await getDoc(doc(db, 'quotePublic', code));
    if (!snap.exists()) return readLocalQuotes()[`public:${code}`] ?? null;
    const data = snap.data() as StoredQuote;
    return { ...data, recoveryCode: '', scene: migrateScene(data.scene) };
  } catch (error) {
    if (!isPermission(error)) throw error;
    const local = readLocalQuotes()[`public:${code}`];
    return local ? { ...local, scene: migrateScene(local.scene) } : null;
  }
}

export async function loadQuoteIndex(): Promise<StoredQuote[]> {
  const { getDocs, collection } = await import('firebase/firestore');
  const snap = await getDocs(collection(db, 'quoteIndex'));
  const list: StoredQuote[] = [];
  snap.forEach((item) => {
    const data = item.data() as StoredQuote;
    list.push({ ...data, id: item.id, recoveryCode: '' });
  });
  return list.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function updateIndexedQuote(quoteNumber: string, patch: Partial<StoredQuote>): Promise<void> {
  const ref = doc(db, 'quoteIndex', quoteNumber);
  const current = await getDoc(ref);
  if (!current.exists()) throw new Error('No se encontró la cotización.');
  const next = compact({ ...current.data(), ...patch, updatedAt: new Date().toISOString() });
  await setDoc(ref, next);
  const publicRef = doc(db, 'quotePublic', quoteNumber);
  const publicSnap = await getDoc(publicRef);
  if (publicSnap.exists()) {
    await setDoc(publicRef, compact({ ...publicSnap.data(), ...patch, recoveryCode: '', updatedAt: next.updatedAt }));
  }
}
