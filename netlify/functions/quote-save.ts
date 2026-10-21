import { initializeApp, getApps } from 'firebase/app';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { Product } from '../../src/types';
import { buildBom } from '../../src/quote/bom';
import { assertScene } from '../../src/quote/storage';
import { migrateScene } from '../../src/quote/scene/logic';
import { sanitizeSettings, defaultSettings } from '../../src/quote/settings';
import type { Customer, QuoteStatus, SceneState, StoredQuote } from '../../src/quote/types';

const app = getApps()[0] ?? initializeApp(firebaseConfig);
const database = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const handler = async (event: { httpMethod: string; body: string | null }) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido.' }) };

  try {
    const body = JSON.parse(event.body || '{}') as {
      scene?: SceneState;
      customer?: Customer;
      recoveryCode?: string;
      quoteNumber?: string;
      revision?: number;
      createdAt?: string;
      status?: QuoteStatus;
      priceOverrides?: Record<string, number>;
      previewImage?: string | null;
    };
    if (!body.scene || !body.customer || !body.recoveryCode || !body.quoteNumber) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Faltan datos del proyecto.' }) };
    }
    body.scene = migrateScene(body.scene);
    assertScene(body.scene);

    const productsSnap = await getDoc(doc(database, 'quoteSettings', 'config'));
    const settings = productsSnap.exists() ? sanitizeSettings(productsSnap.data()) : defaultSettings();
    const listed = await import('firebase/firestore').then(({ getDocs, collection }) => getDocs(collection(database, 'products')));
    const products: Product[] = [];
    listed.forEach((item) => products.push(item.data() as Product));

    const overrides: Record<string, number> = {};
    Object.entries(body.priceOverrides ?? {}).forEach(([key, value]) => {
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) overrides[key] = value;
    });

    const bom = buildBom(body.scene, settings, products, overrides);
    const now = new Date().toISOString();
    const preview = typeof body.previewImage === 'string' && body.previewImage.startsWith('data:image/') && body.previewImage.length < 700000
      ? body.previewImage
      : undefined;
    const quote: StoredQuote = {
      id: body.recoveryCode,
      recoveryCode: body.recoveryCode,
      quoteNumber: body.quoteNumber,
      revision: body.revision && body.revision > 0 ? body.revision : 1,
      status: body.status ?? 'pending_review',
      createdAt: body.createdAt || now,
      updatedAt: now,
      installationType: body.scene.installationType,
      customer: body.customer,
      scene: body.scene,
      rulesVersion: settings.rulesVersion,
      catalogFingerprint: bom.catalogFingerprint,
      bom,
      priceOverrides: overrides,
      ...(preview ? { previewImage: preview } : {}),
    };

    const packed = JSON.parse(JSON.stringify(quote)) as StoredQuote;
    await setDoc(doc(database, 'quotes', quote.recoveryCode), packed);
    await setDoc(doc(database, 'quotePublic', quote.quoteNumber), { ...packed, recoveryCode: '' });
    await setDoc(doc(database, 'quoteIndex', quote.quoteNumber), {
      quoteNumber: quote.quoteNumber,
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
    });
    await setDoc(doc(database, 'quotes', quote.recoveryCode, 'versions', String(quote.revision)), {
      revision: quote.revision,
      savedAt: quote.updatedAt,
      scene: quote.scene,
      customer: quote.customer,
      bom: quote.bom,
      status: quote.status,
      rulesVersion: quote.rulesVersion,
    });

    return { statusCode: 200, headers, body: JSON.stringify({ quote: packed }) };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo guardar la cotización.';
    return { statusCode: 400, headers, body: JSON.stringify({ error: message }) };
  }
};
