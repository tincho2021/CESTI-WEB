import type { Product } from '../types';
import { RULES_VERSION, type Billing, type ResolvedRole, type RoleBinding, type TechnicalSettings } from './types';
import { parseCapacity, parseProtocols, parseRangeMm } from './specs';

function binding(partial: RoleBinding): RoleBinding {
  return partial;
}

export const DEFAULT_BINDINGS: RoleBinding[] = [
  binding({
    role: 'console-telemetry',
    label: 'Consola de telemedición',
    productId: 'prod-004',
    capacitySpecKey: 'Tanques max',
    capacityOverride: null,
    protocolSpecKey: 'Protocolo',
    protocolsOverride: null,
    rangeSpecKey: null,
    incompatibleWith: [],
    notes: 'La cantidad de tanques se lee de la ficha del producto vinculado. Si el dato no está, la capacidad queda pendiente.',
    billing: 'once',
    section: 'equipment',
  }),
  binding({
    role: 'probe-rigid',
    label: 'Sonda rígida de telemedición',
    productId: 'prod-011',
    capacitySpecKey: null,
    capacityOverride: null,
    protocolSpecKey: null,
    protocolsOverride: null,
    rangeSpecKey: 'Rango',
    incompatibleWith: ['dispenser', 'loading-point'],
    notes: 'Se usa solo si la altura útil del tanque entra en el rango publicado en la ficha.',
    billing: 'once',
    section: 'equipment',
  }),
  binding({
    role: 'probe-flex',
    label: 'Sonda flexible de telemedición',
    productId: 'prod-010',
    capacitySpecKey: null,
    capacityOverride: null,
    protocolSpecKey: null,
    protocolsOverride: null,
    rangeSpecKey: 'Longitud',
    incompatibleWith: ['dispenser', 'loading-point'],
    notes: 'Se usa solo si la altura útil supera la sonda rígida y entra en la longitud publicada.',
    billing: 'once',
    section: 'equipment',
  }),
  binding({
    role: 'dispenser-controller',
    label: 'Controlador de surtidores',
    productId: 'prod-005',
    capacitySpecKey: 'Mangueras',
    capacityOverride: null,
    protocolSpecKey: 'Comunicación',
    protocolsOverride: null,
    rangeSpecKey: null,
    incompatibleWith: [],
    notes: 'La cantidad de mangueras y los protocolos salen de la ficha. No se asume un controlador por manguera.',
    billing: 'once',
    section: 'equipment',
  }),
  binding({
    role: 'fleet',
    label: 'Sistema de control de flotas',
    productId: 'prod-006',
    capacitySpecKey: null,
    capacityOverride: null,
    protocolSpecKey: 'Tecnología',
    protocolsOverride: null,
    rangeSpecKey: null,
    incompatibleWith: [],
    notes: 'El catálogo lo describe con RFID/NFC/QR. No está declarado como terminal con display RLCD.',
    billing: 'once',
    section: 'equipment',
  }),
  binding({
    role: 'leak-gas',
    label: 'Sensor de fugas de gases',
    productId: 'prod-008',
    capacitySpecKey: null,
    capacityOverride: null,
    protocolSpecKey: 'Señal',
    protocolsOverride: null,
    rangeSpecKey: null,
    incompatibleWith: [],
    notes: '',
    billing: 'once',
    section: 'equipment',
  }),
  binding({
    role: 'leak-liquid',
    label: 'Sensor de fugas de líquidos',
    productId: 'prod-009',
    capacitySpecKey: null,
    capacityOverride: null,
    protocolSpecKey: null,
    protocolsOverride: null,
    rangeSpecKey: null,
    incompatibleWith: [],
    notes: '',
    billing: 'once',
    section: 'equipment',
  }),
  binding({
    role: 'leak-console',
    label: 'Consola de monitoreo de fugas',
    productId: 'prod-003',
    capacitySpecKey: 'Sensores max',
    capacityOverride: null,
    protocolSpecKey: null,
    protocolsOverride: null,
    rangeSpecKey: null,
    incompatibleWith: [],
    notes: 'La cantidad de sensores se lee de la ficha. No se reutiliza la consola de telemedición para este rol.',
    billing: 'once',
    section: 'equipment',
  }),
  binding({
    role: 'comms-modbus',
    label: 'Módulo de comunicaciones Modbus',
    productId: 'prod-016',
    capacitySpecKey: null,
    capacityOverride: null,
    protocolSpecKey: 'Protocolos IP',
    protocolsOverride: null,
    rangeSpecKey: null,
    incompatibleWith: [],
    notes: 'Es una pasarela serie/Ethernet del catálogo. No está declarada como radio de campo ni como enlace solar.',
    billing: 'once',
    section: 'equipment',
  }),
  binding({
    role: 'rfid-rlcd',
    label: 'Terminal RFID con display RLCD',
    productId: null,
    capacitySpecKey: null,
    capacityOverride: null,
    protocolSpecKey: null,
    protocolsOverride: null,
    rangeSpecKey: null,
    incompatibleWith: [],
    notes: 'No hay un producto de catálogo identificado como terminal RLCD. Se muestra A COTIZAR hasta que se vincule una ficha.',
    billing: 'once',
    section: 'equipment',
  }),
  binding({
    role: 'overflow',
    label: 'Alarma de sobrellenado',
    productId: null,
    capacitySpecKey: null,
    capacityOverride: null,
    protocolSpecKey: null,
    protocolsOverride: null,
    rangeSpecKey: null,
    incompatibleWith: [],
    notes: 'No hay una ficha propia en el catálogo. La mención dentro de la consola no se toma como producto separado ni como canal medible.',
    billing: 'once',
    section: 'equipment',
  }),
  binding({
    role: 'solar-wireless',
    label: 'Conjunto inalámbrico con alimentación solar',
    productId: null,
    capacitySpecKey: null,
    capacityOverride: null,
    protocolSpecKey: null,
    protocolsOverride: null,
    rangeSpecKey: null,
    incompatibleWith: [],
    notes: 'No hay un kit solar publicado. Cobertura de radio pendiente de verificación en campo.',
    billing: 'once',
    section: 'service',
  }),
  binding({
    role: 'cloud-platform',
    label: 'Plataforma en la nube C.E.S.T.I.',
    productId: null,
    capacitySpecKey: null,
    capacityOverride: null,
    protocolSpecKey: null,
    protocolsOverride: null,
    rangeSpecKey: null,
    incompatibleWith: [],
    notes: 'Sin precio de catálogo. Se trata como abono hasta que se publique un valor.',
    billing: 'recurring',
    section: 'service',
  }),
  binding({
    role: 'api-integration',
    label: 'Integración API',
    productId: null,
    capacitySpecKey: null,
    capacityOverride: null,
    protocolSpecKey: null,
    protocolsOverride: null,
    rangeSpecKey: null,
    incompatibleWith: [],
    notes: '',
    billing: 'once',
    section: 'service',
  }),
  binding({
    role: 'software-adaptation',
    label: 'Adaptación de software',
    productId: null,
    capacitySpecKey: null,
    capacityOverride: null,
    protocolSpecKey: null,
    protocolsOverride: null,
    rangeSpecKey: null,
    incompatibleWith: [],
    notes: '',
    billing: 'once',
    section: 'service',
  }),
  binding({
    role: 'dev-4h',
    label: 'Paquete de desarrollo de software (4 horas)',
    productId: null,
    capacitySpecKey: null,
    capacityOverride: null,
    protocolSpecKey: null,
    protocolsOverride: null,
    rangeSpecKey: null,
    incompatibleWith: [],
    notes: '',
    billing: 'once',
    section: 'service',
  }),
  binding({
    role: 'alerts-messaging',
    label: 'Módulo de comunicaciones Telegram / WhatsApp',
    productId: null,
    capacitySpecKey: null,
    capacityOverride: null,
    protocolSpecKey: null,
    protocolsOverride: null,
    rangeSpecKey: null,
    incompatibleWith: [],
    notes: '',
    billing: 'once',
    section: 'service',
  }),
  binding({
    role: 'installation',
    label: 'Instalación y puesta en marcha',
    productId: null,
    capacitySpecKey: null,
    capacityOverride: null,
    protocolSpecKey: null,
    protocolsOverride: null,
    rangeSpecKey: null,
    incompatibleWith: [],
    notes: 'Servicio configurable. Sin precio hasta que se cargue en el catálogo o lo defina el área comercial.',
    billing: 'once',
    section: 'service',
  }),
  binding({
    role: 'custom-service',
    label: 'Servicio adicional',
    productId: null,
    capacitySpecKey: null,
    capacityOverride: null,
    protocolSpecKey: null,
    protocolsOverride: null,
    rangeSpecKey: null,
    incompatibleWith: [],
    notes: '',
    billing: 'once',
    section: 'service',
  }),
];

export function defaultSettings(): TechnicalSettings {
  return {
    rulesVersion: RULES_VERSION,
    currency: 'USD',
    taxPercent: null,
    validityDays: null,
    bindings: DEFAULT_BINDINGS.map((item) => ({ ...item, incompatibleWith: [...item.incompatibleWith] })),
  };
}

function cleanBilling(value: unknown, fallback: Billing): Billing {
  return value === 'once' || value === 'recurring' || value === 'none' ? value : fallback;
}

function cleanBinding(value: unknown, fallback: RoleBinding): RoleBinding {
  const raw = (value && typeof value === 'object' ? value : {}) as Partial<RoleBinding>;
  const capacityOverride = typeof raw.capacityOverride === 'number' && raw.capacityOverride > 0 ? raw.capacityOverride : null;
  const protocolsOverride = Array.isArray(raw.protocolsOverride)
    ? raw.protocolsOverride.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim())
    : null;
  return {
    ...fallback,
    productId: raw.productId === null ? null : typeof raw.productId === 'string' ? raw.productId : fallback.productId,
    capacityOverride,
    protocolsOverride: protocolsOverride && protocolsOverride.length > 0 ? protocolsOverride : raw.protocolsOverride === null ? null : fallback.protocolsOverride,
    incompatibleWith: Array.isArray(raw.incompatibleWith)
      ? raw.incompatibleWith.filter((item) => typeof item === 'string')
      : fallback.incompatibleWith,
    notes: typeof raw.notes === 'string' ? raw.notes.slice(0, 500) : fallback.notes,
    billing: cleanBilling(raw.billing, fallback.billing),
    label: typeof raw.label === 'string' && raw.label.trim() ? raw.label.slice(0, 120) : fallback.label,
  };
}

export function sanitizeSettings(input: unknown): TechnicalSettings {
  const base = defaultSettings();
  if (!input || typeof input !== 'object') return base;
  const raw = input as Partial<TechnicalSettings>;
  const incoming = new Map<string, unknown>();
  if (Array.isArray(raw.bindings)) {
    raw.bindings.forEach((item) => {
      if (item && typeof item === 'object' && typeof (item as RoleBinding).role === 'string') {
        incoming.set((item as RoleBinding).role, item);
      }
    });
  }
  const tax = typeof raw.taxPercent === 'number' && raw.taxPercent >= 0 && raw.taxPercent <= 100 ? raw.taxPercent : null;
  const validity = typeof raw.validityDays === 'number' && raw.validityDays > 0 && raw.validityDays <= 365 ? Math.round(raw.validityDays) : null;
  return {
    rulesVersion: RULES_VERSION,
    currency: typeof raw.currency === 'string' && raw.currency.trim() ? raw.currency.trim().slice(0, 8) : 'USD',
    taxPercent: tax,
    validityDays: validity,
    bindings: base.bindings.map((item) => cleanBinding(incoming.get(item.role), item)),
  };
}

export function resolveRole(role: string, settings: TechnicalSettings, products: Product[]): ResolvedRole {
  const found = settings.bindings.find((item) => item.role === role) ?? null;
  if (!found) {
    return { binding: null, product: null, capacity: null, protocols: [], range: null, missingProduct: false };
  }
  const product = found.productId ? products.find((item) => item.id === found.productId) ?? null : null;
  const capacity = found.capacityOverride ?? (found.capacitySpecKey ? parseCapacity(product?.specs?.[found.capacitySpecKey]) : null);
  const protocols = found.protocolsOverride ?? (found.protocolSpecKey ? parseProtocols(product?.specs?.[found.protocolSpecKey]) : []);
  const range = found.rangeSpecKey ? parseRangeMm(product?.specs?.[found.rangeSpecKey]) : null;
  return {
    binding: found,
    product,
    capacity,
    protocols,
    range,
    missingProduct: Boolean(found.productId) && !product,
  };
}
