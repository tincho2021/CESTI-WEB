import { clampQuantity, uid } from './ids';
import type { LibraryItem, ObjectProps, SceneObject } from './types';

export const LIBRARY: LibraryItem[] = [
  {
    id: 'tank-underground',
    category: 'infrastructure',
    kind: 'tank-underground',
    role: 'tank',
    title: 'Tanque subterráneo',
    description: 'Tanque enterrado del cliente, en corte de terreno. No se cotiza.',
    namePrefix: 'T',
  },
  {
    id: 'tank-vertical',
    category: 'infrastructure',
    kind: 'tank-vertical',
    role: 'tank',
    title: 'Tanque vertical agropecuario',
    description: 'Tanque cilíndrico de superficie. Infraestructura existente del cliente.',
    namePrefix: 'TV',
  },
  {
    id: 'dispenser',
    category: 'infrastructure',
    kind: 'dispenser',
    role: 'dispenser',
    title: 'Surtidor de combustible',
    description: 'Punto de despacho del cliente. El precio no entra en la cotización.',
    namePrefix: 'S',
  },
  {
    id: 'loading-point',
    category: 'infrastructure',
    kind: 'loading-point',
    role: 'loading-point',
    title: 'Punto de carga industrial',
    description: 'Isla de carga propia. Se dibuja, no se vende.',
    namePrefix: 'PC',
  },
  {
    id: 'fuel-pump',
    category: 'infrastructure',
    kind: 'fuel-pump',
    role: 'fuel-pump',
    title: 'Bomba de combustible',
    description: 'Bomba del cliente. La succión sale del tanque y la descarga sigue hacia el medidor o el surtidor.',
    namePrefix: 'B',
  },
  {
    id: 'flow-meter',
    category: 'infrastructure',
    kind: 'flow-meter',
    role: 'flow-meter',
    title: 'Caudalímetro',
    description: 'Medidor de caudal del cliente. No se cotiza.',
    namePrefix: 'Q',
  },
  {
    id: 'mechanical-meter',
    category: 'infrastructure',
    kind: 'mechanical-meter',
    role: 'mechanical-meter',
    title: 'Aforador mecánico',
    description: 'Si no hay surtidor, cuenta los litros y se vincula al tarjetero para mostrarlos en el display.',
    namePrefix: 'AF',
  },
  {
    id: 'office',
    category: 'infrastructure',
    kind: 'office',
    role: 'office',
    title: 'Oficina / sala de control',
    description: 'Nodo posible de red, consola y acceso remoto.',
    namePrefix: 'OF',
  },
  {
    id: 'console',
    category: 'equipment',
    kind: 'console',
    role: 'console-telemetry',
    title: 'Consola de telemedición',
    description: 'Precio y cantidad de tanques según la ficha vigente del catálogo.',
    namePrefix: 'CTL',
  },
  {
    id: 'leak-console',
    category: 'equipment',
    kind: 'console',
    role: 'leak-console',
    title: 'Consola de fugas',
    description: 'Monitorea sensores de fuga. El máximo de canales sale de su ficha.',
    namePrefix: 'CF',
  },
  {
    id: 'probe',
    category: 'equipment',
    kind: 'probe',
    role: 'probe',
    title: 'Sonda de nivel',
    description: 'Cableada: USD 650. Con módulo inalámbrico: USD 850, módulo incluido.',
    namePrefix: 'SD',
  },
  {
    id: 'controller',
    category: 'equipment',
    kind: 'controller',
    role: 'dispenser-controller',
    title: 'Controlador de surtidor',
    description: 'La capacidad de mangueras sale de la ficha. No se copia una unidad por pico.',
    namePrefix: 'CS',
  },
  {
    id: 'rfid',
    category: 'equipment',
    kind: 'rfid',
    role: 'rfid-rlcd',
    title: 'Terminal RFID con display RLCD',
    description: 'Sin ficha publicada: queda A COTIZAR hasta vincularla en el administrador.',
    namePrefix: 'RF',
  },
  {
    id: 'fleet',
    category: 'equipment',
    kind: 'service',
    role: 'fleet',
    title: 'Sistema de control de flotas',
    description: 'Producto de catálogo con RFID/NFC/QR. No reemplaza a la terminal RLCD.',
    namePrefix: 'FL',
  },
  {
    id: 'leak-liquid',
    category: 'equipment',
    kind: 'leak-liquid',
    role: 'leak-liquid',
    title: 'Sensor de fugas de líquidos',
    description: 'Detección de líquido en cámara o bandeja, según la ficha del catálogo.',
    namePrefix: 'FLQ',
  },
  {
    id: 'leak-gas',
    category: 'equipment',
    kind: 'leak-gas',
    role: 'leak-gas',
    title: 'Sensor de fugas de gases',
    description: 'Detección de vapores de hidrocarburo, según la ficha del catálogo.',
    namePrefix: 'FG',
  },
  {
    id: 'overflow',
    category: 'equipment',
    kind: 'overflow',
    role: 'overflow',
    title: 'Alarma de sobrellenado',
    description: 'Sin producto publicado. Se lista A COTIZAR.',
    namePrefix: 'AS',
  },
  {
    id: 'comms',
    category: 'equipment',
    kind: 'comms',
    role: 'comms-modbus',
    title: 'Módulo de comunicaciones',
    description: 'Pasarela Modbus del catálogo. No se presenta como radio de campo.',
    namePrefix: 'CM',
  },
  {
    id: 'cloud',
    category: 'service',
    kind: 'cloud',
    role: 'cloud-platform',
    title: 'Plataforma C.E.S.T.I. Cloud',
    description: 'Servicio en la nube. Sin precio de catálogo: abono A COTIZAR.',
    namePrefix: 'CLD',
    billing: 'recurring',
  },
  {
    id: 'api',
    category: 'service',
    kind: 'service',
    role: 'api-integration',
    title: 'Integración API',
    description: 'Adaptación de intercambio de datos. Precio pendiente.',
    namePrefix: 'API',
    billing: 'once',
  },
  {
    id: 'software',
    category: 'service',
    kind: 'service',
    role: 'software-adaptation',
    title: 'Adaptación de software',
    description: 'Ajuste de software existente. Precio pendiente.',
    namePrefix: 'SW',
    billing: 'once',
  },
  {
    id: 'dev-4h',
    category: 'service',
    kind: 'service',
    role: 'dev-4h',
    title: 'Paquete de desarrollo de 4 horas',
    description: 'Bloque de desarrollo. Sin tarifa publicada.',
    namePrefix: 'DEV',
    billing: 'once',
  },
  {
    id: 'alerts',
    category: 'service',
    kind: 'service',
    role: 'alerts-messaging',
    title: 'Alertas Telegram / WhatsApp',
    description: 'Módulo de avisos. Sin precio de catálogo.',
    namePrefix: 'MSG',
    billing: 'once',
  },
  {
    id: 'solar',
    category: 'service',
    kind: 'receiver',
    role: 'solar-wireless',
    title: 'Transmisor inalámbrico',
    description: 'Se apoya en el lomo del tanque. El módulo ya está incluido en la sonda de USD 850.',
    namePrefix: 'SOL',
    billing: 'once',
  },
  {
    id: 'install',
    category: 'service',
    kind: 'service',
    role: 'installation',
    title: 'Instalación y puesta en marcha',
    description: 'Servicio de obra y arranque. Precio a convenir.',
    namePrefix: 'INST',
    billing: 'once',
  },
  {
    id: 'custom',
    category: 'service',
    kind: 'service',
    role: 'custom-service',
    title: 'Servicio adicional',
    description: 'Ítem libre para una necesidad que todavía no está en el catálogo.',
    namePrefix: 'SRV',
    billing: 'once',
  },
];

export const LIBRARY_GROUPS = [
  { id: 'infrastructure', title: 'Infraestructura del cliente' },
  { id: 'equipment', title: 'Equipamiento C.E.S.T.I.' },
  { id: 'service', title: 'Servicios y software' },
] as const;

export function emptyScene() {
  return {
    objects: [] as SceneObject[],
    connections: [],
    dismissedSuggestionIds: [] as string[],
    installationType: null,
    showLabels: true,
    showConnections: false,
    viewMode: 'installation' as const,
    routeSeed: 0,
    schemaVersion: 2,
  };
}

const DEVICE_TITLES: Record<string, string> = {
  T: 'Tanque subterráneo',
  TV: 'Tanque vertical',
  S: 'Surtidor',
  PC: 'Punto de carga',
  B: 'Bomba',
  Q: 'Caudalímetro',
  AF: 'Aforador',
  OF: 'Oficina',
  CTL: 'Consola de telemedición',
  CF: 'Consola de fugas',
  SD: 'Sonda',
  CS: 'Controlador de surtidor',
  RF: 'Terminal RFID',
  FL: 'Control de flotas',
  FLQ: 'Sensor de líquidos',
  FG: 'Sensor de gases',
  AS: 'Alarma de sobrellenado',
  CM: 'Módulo de comunicaciones',
  CLD: 'Plataforma cloud',
  API: 'Integración API',
  SW: 'Adaptación de software',
  DEV: 'Desarrollo',
  MSG: 'Alertas',
  SOL: 'Transmisor inalámbrico',
  INST: 'Instalación',
  SRV: 'Servicio',
};

const ROLE_TITLES: Record<string, string> = {
  'tank-underground': 'Tanque subterráneo',
  'tank-vertical': 'Tanque vertical',
  dispenser: 'Surtidor',
  'loading-point': 'Punto de carga',
  'fuel-pump': 'Bomba',
  'flow-meter': 'Caudalímetro',
  'mechanical-meter': 'Aforador',
  office: 'Oficina',
  'console-telemetry': 'Consola de telemedición',
  'leak-console': 'Consola de fugas',
  probe: 'Sonda',
  'dispenser-controller': 'Controlador de surtidor',
  'rfid-rlcd': 'Terminal RFID',
  fleet: 'Control de flotas',
  'leak-liquid': 'Sensor de líquidos',
  'leak-gas': 'Sensor de gases',
  overflow: 'Alarma de sobrellenado',
  'comms-modbus': 'Módulo de comunicaciones',
  'cloud-platform': 'Plataforma cloud',
  'api-integration': 'Integración API',
  'software-adaptation': 'Adaptación de software',
  'dev-4h': 'Desarrollo',
  'alerts-messaging': 'Alertas',
  'solar-wireless': 'Transmisor inalámbrico',
  installation: 'Instalación',
  'custom-service': 'Servicio',
};

export function deviceTitle(object: { kind: string; role: string }): string {
  if (object.kind === 'tank-underground' || object.kind === 'tank-vertical') return ROLE_TITLES[object.kind];
  return ROLE_TITLES[object.role] ?? ROLE_TITLES[object.kind] ?? 'Equipo';
}

export function plainLabel(object: { name: string; kind: string; role: string }): string {
  const title = deviceTitle(object);
  if (object.name === title || object.name.startsWith(`${title} `)) return object.name;
  if (/^[A-Z]{1,5}\d+$/.test(object.name)) {
    const number = object.name.match(/(\d+)$/)?.[1] ?? '1';
    return `${title} ${number}`;
  }
  return object.name;
}

export function deviceLabel(
  object: { id?: string; name: string; kind: string; role: string; attachedTo?: string | null },
  scene?: { objects: Array<{ id: string; name: string; kind: string; role: string; attachedTo?: string | null }> },
): string {
  if (object.role === 'probe' && object.attachedTo && scene) {
    const tank = scene.objects.find((item) => item.id === object.attachedTo);
    if (tank) return `Sonda de ${plainLabel(tank)}`;
  }
  return plainLabel(object);
}

export function nextName(objects: SceneObject[], prefix: string): string {
  const title = DEVICE_TITLES[prefix] ?? prefix.trim();
  const legacy = Object.entries(DEVICE_TITLES).find(([, value]) => value === title)?.[0];
  const used = objects.map((object) => {
    if (object.name.startsWith(`${title} `)) {
      const match = object.name.slice(title.length).match(/^\s*(\d+)/);
      return match ? Number(match[1]) : 0;
    }
    if (legacy) {
      const match = object.name.match(new RegExp(`^${legacy}(\\d+)$`));
      if (match) return Number(match[1]);
    }
    return 0;
  });
  return `${title} ${Math.max(0, ...used) + 1}`;
}

const INFRA_PROPS: Record<string, ObjectProps> = {
  tank: {
    capacityLiters: null,
    heightMm: null,
    diameterMm: null,
    product: '',
    customProduct: '',
    comms: 'unset',
    probeCount: null,
    distanceToOfficeM: null,
  },
  dispenser: {
    brand: '',
    model: '',
    hoseCount: null,
    productCount: 1,
    outlets: [{ product: '', tankId: null }],
    protocol: '',
    needsControl: null,
    needsRfid: null,
  },
  'loading-point': {
    brand: '',
    model: '',
    hoseCount: null,
    productCount: 1,
    outlets: [{ product: '', tankId: null }],
    protocol: '',
    needsControl: null,
    needsRfid: null,
  },
  'fuel-pump': {},
  'flow-meter': {},
  'mechanical-meter': {},
  office: {
    wifi: null,
    ethernet: null,
    internet: null,
    distanceTanksM: null,
    distanceDispensersM: null,
    consoleLocation: '',
    remoteAccess: null,
  },
};

export function createObject(input: {
  kind: SceneObject['kind'];
  role: string;
  name: string;
  x: number;
  z: number;
  productId?: string | null;
  serviceKey?: string | null;
  quantity?: number;
  attachedTo?: string | null;
  rotation?: number;
  props?: ObjectProps;
  billing?: 'once' | 'recurring';
}): SceneObject {
  const base = INFRA_PROPS[input.role] ?? INFRA_PROPS[input.kind] ?? {};
  return {
    id: uid(),
    kind: input.kind,
    role: input.role,
    name: input.name,
    x: Math.max(-36, Math.min(36, input.x)),
    z: Math.max(-24, Math.min(24, input.z)),
    rotation: input.rotation ?? 0,
    productId: input.productId ?? null,
    serviceKey: input.serviceKey ?? input.role,
    quantity: clampQuantity(input.quantity ?? 1),
    attachedTo: input.attachedTo ?? null,
    props: {
      ...base,
      ...(input.billing ? { billing: input.billing } : {}),
      ...input.props,
    },
  };
}

export function snap(value: number): number {
  return Math.round(value * 2) / 2;
}
