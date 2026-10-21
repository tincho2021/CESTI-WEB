import type { Product } from '../types';

export const MAX_OBJECTS = 60;
export const MAX_CONNECTIONS = 120;
export const MAX_QUANTITY = 30;
export const RULES_VERSION = '1.0.0';

export type InstallationType = 'station' | 'agro' | 'fleet' | 'blank';

export type QuoteStatus =
  | 'draft'
  | 'pending_review'
  | 'issued'
  | 'negotiation'
  | 'approved'
  | 'rejected'
  | 'expired';

export type Kind =
  | 'tank-underground'
  | 'tank-vertical'
  | 'dispenser'
  | 'loading-point'
  | 'office'
  | 'console'
  | 'probe'
  | 'controller'
  | 'rfid'
  | 'leak-liquid'
  | 'leak-gas'
  | 'overflow'
  | 'comms'
  | 'cloud'
  | 'receiver'
  | 'fuel-pump'
  | 'flow-meter'
  | 'mechanical-meter'
  | 'service';

export type ConnectionType =
  | 'sensor'
  | 'rs485'
  | 'wireless'
  | 'ethernet'
  | 'wifi'
  | 'cloud'
  | 'dispenser-control'
  | 'alarm'
  | 'process'
  | 'association';

export type ConnectionLayer = 'process' | 'data' | 'alarm';

export type CheckStatus = 'compatible' | 'pending' | 'incompatible';

export type Billing = 'once' | 'recurring' | 'none';

export interface ObjectProps {
  capacityLiters?: number | null;
  heightMm?: number | null;
  diameterMm?: number | null;
  product?: string;
  customProduct?: string;
  comms?: 'unset' | 'wired' | 'wireless' | 'wireless-solar';
  probeCount?: number | null;
  distanceToOfficeM?: number | null;
  brand?: string;
  model?: string;
  hoseCount?: number | null;
  productCount?: number | null;
  outlets?: { product: string; tankId: string | null }[];
  protocol?: string;
  needsControl?: boolean | null;
  needsRfid?: boolean | null;
  wifi?: boolean | null;
  ethernet?: boolean | null;
  internet?: boolean | null;
  distanceTanksM?: number | null;
  distanceDispensersM?: number | null;
  consoleLocation?: string;
  remoteAccess?: boolean | null;
  billing?: 'once' | 'recurring';
  notes?: string;
}

export interface SceneObject {
  id: string;
  kind: Kind;
  role: string;
  name: string;
  x: number;
  z: number;
  rotation: number;
  productId: string | null;
  serviceKey: string | null;
  quantity: number;
  attachedTo: string | null;
  props: ObjectProps;
}

export interface SceneConnection {
  id: string;
  fromId: string;
  toId: string;
  type: ConnectionType;
  layer: ConnectionLayer;
  hoseIndex?: number | null;
  provisional?: boolean;
}

export interface SceneState {
  objects: SceneObject[];
  connections: SceneConnection[];
  dismissedSuggestionIds: string[];
  installationType: InstallationType | null;
  showLabels: boolean;
  showConnections: boolean;
  viewMode: 'installation' | 'technical';
  routeSeed: number;
  schemaVersion?: number;
}

export interface Customer {
  name: string;
  company: string;
  email: string;
  phone: string;
  location: string;
  activity: string;
  notes: string;
}

export interface RoleBinding {
  role: string;
  label: string;
  productId: string | null;
  capacitySpecKey: string | null;
  capacityOverride: number | null;
  protocolSpecKey: string | null;
  protocolsOverride: string[] | null;
  rangeSpecKey: string | null;
  incompatibleWith: string[];
  notes: string;
  billing: Billing;
  section: 'equipment' | 'service';
}

export interface TechnicalSettings {
  rulesVersion: string;
  currency: string;
  taxPercent: number | null;
  validityDays: number | null;
  bindings: RoleBinding[];
}

export interface ResolvedRole {
  binding: RoleBinding | null;
  product: Product | null;
  capacity: number | null;
  protocols: string[];
  range: { minMm: number | null; maxMm: number | null } | null;
  missingProduct: boolean;
}

export interface Finding {
  id: string;
  status: CheckStatus | 'info';
  message: string;
  objectId?: string;
  connectionId?: string;
}

export type SuggestionAction =
  | 'add-probe'
  | 'add-console'
  | 'add-controller'
  | 'add-fleet'
  | 'add-rfid'
  | 'add-cloud'
  | 'add-solar'
  | 'add-leak-console'
  | 'none';

export interface Suggestion {
  id: string;
  tone: 'recommend' | 'warning' | 'info';
  title: string;
  detail: string;
  action: SuggestionAction;
  targetId?: string;
  quantity?: number;
}

export interface BomLine {
  key: string;
  section: 'infrastructure' | 'equipment' | 'service';
  productId: string | null;
  sku: string | null;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number | null;
  billing: Billing;
  priceOrigin: 'catalog' | 'admin' | 'none' | 'unpriced';
  sourceObjectIds: string[];
}

export interface BomResult {
  lines: BomLine[];
  onceSubtotal: number;
  recurringSubtotal: number;
  tax: number | null;
  totalPriced: number;
  pendingCount: number;
  currency: string;
  taxPercent: number | null;
  validityDays: number | null;
  catalogFingerprint: string;
}

export interface StoredQuote {
  id: string;
  quoteNumber: string;
  recoveryCode: string;
  revision: number;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
  installationType: InstallationType | null;
  customer: Customer | null;
  scene: SceneState;
  rulesVersion: string;
  catalogFingerprint: string;
  bom: BomResult;
  previewImage?: string;
  priceOverrides: Record<string, number>;
}

export interface LibraryItem {
  id: string;
  category: 'infrastructure' | 'equipment' | 'service';
  kind: Kind;
  role: string;
  title: string;
  description: string;
  namePrefix: string;
  billing?: 'once' | 'recurring';
}

export const FUEL_PRODUCTS = [
  'Nafta Súper',
  'Nafta Premium',
  'Gasoil',
  'Diésel Premium',
  'Otros combustibles',
  'Producto personalizado',
] as const;

export const DISPENSER_BRANDS = ['Gilbarco', 'Wayne', 'Tokheim', 'Tatsuno', 'Bennett', 'PEC', 'Otra'] as const;

export const ACTIVITIES = [
  { id: 'station', label: 'Estación de servicio' },
  { id: 'agro', label: 'Agroindustria' },
  { id: 'fleet', label: 'Flota propia' },
  { id: 'depot', label: 'Depósito de combustible' },
  { id: 'industry', label: 'Industria' },
  { id: 'other', label: 'Otro' },
] as const;

export const QUOTE_STATUSES: { id: QuoteStatus; label: string }[] = [
  { id: 'draft', label: 'Borrador' },
  { id: 'pending_review', label: 'Pendiente de revisión' },
  { id: 'issued', label: 'Cotización emitida' },
  { id: 'negotiation', label: 'En negociación' },
  { id: 'approved', label: 'Aprobada' },
  { id: 'rejected', label: 'Rechazada' },
  { id: 'expired', label: 'Vencida' },
];
