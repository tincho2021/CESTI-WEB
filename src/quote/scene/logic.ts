import type { Product } from '../../types';
import { assessConnection, connectionLayer } from '../engine';
import { createObject, emptyScene, nextName, plainLabel } from '../library';
import { resolveRole } from '../settings';
import type { ConnectionType, SceneConnection, SceneObject, SceneState, TechnicalSettings } from '../types';

export type ProbeVisual = 'none' | 'unlinked' | 'linked';
export type LayerFilter = 'all' | 'fuel' | 'telemetry' | 'control' | 'network';

export interface WorldPoint {
  x: number;
  y: number;
  z: number;
}

const DATA_LINK = new Set<ConnectionType>(['sensor', 'wireless', 'rs485', 'ethernet']);

export function rotateLocal(x: number, z: number, rotation: number): { x: number; z: number } {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return { x: x * cos + z * sin, z: -x * sin + z * cos };
}

export function anchorOf(object: SceneObject, objects: SceneObject[], port: 'body' | 'mouth' | 'fuel' | 'data' | 'hose' = 'body', hoseIndex = 0): WorldPoint {
  const parent = object.attachedTo ? objects.find((item) => item.id === object.attachedTo) : undefined;
  const host = parent ?? object;
  const rotation = host.rotation || 0;
  let local = { x: 0, y: 0.4, z: 0 };
  if (object.role === 'probe' || port === 'mouth') {
    local = host.kind === 'tank-vertical' ? { x: 0, y: 2.7, z: 0 } : { x: 0.05, y: 1.58, z: 0 };
  } else if (port === 'fuel') {
    local = host.kind === 'tank-underground' ? { x: 0.72, y: 0.46, z: 0.72 } : { x: 0.55, y: 0.55, z: 0 };
  } else if (port === 'hose') {
    const row = hoseIndex % 2;
    const col = Math.floor(hoseIndex / 2);
    local = { x: -1.05, y: 0.38, z: -0.18 + row * 0.22 + col * 0.02 };
  } else if (port === 'data') {
    local = { x: -0.35, y: 0.7, z: 0 };
  }
  const rotated = rotateLocal(local.x, local.z, rotation);
  return { x: host.x + rotated.x, y: local.y, z: host.z + rotated.z };
}

export function probesOn(scene: SceneState, tankId: string): SceneObject[] {
  return scene.objects.filter((object) => object.role === 'probe' && object.attachedTo === tankId);
}

export function probeVisual(scene: SceneState, tankId: string): ProbeVisual {
  const probes = probesOn(scene, tankId);
  if (probes.length === 0) return 'none';
  const linked = probes.some((probe) => scene.connections.some((connection) => {
    const touches = connection.fromId === probe.id || connection.toId === probe.id || connection.fromId === tankId || connection.toId === tankId;
    return touches && DATA_LINK.has(connection.type);
  }));
  return linked ? 'linked' : 'unlinked';
}

export function hoseCountOf(object: SceneObject): number {
  const declared = object.props.hoseCount;
  if (typeof declared === 'number' && declared > 0) return Math.max(1, Math.min(8, Math.round(declared)));
  const outlets = object.props.outlets?.length ?? 0;
  return Math.max(1, Math.min(8, outlets || 2));
}

export function withHoses(object: SceneObject, count: number): SceneObject {
  const hoseCount = Math.max(1, Math.min(8, Math.round(count)));
  const outlets = [...(object.props.outlets ?? [])];
  while (outlets.length < hoseCount) outlets.push({ product: '', tankId: null });
  return { ...object, props: { ...object.props, hoseCount, productCount: hoseCount, outlets: outlets.slice(0, hoseCount) } };
}

export function syncFuelLinks(scene: SceneState): SceneState {
  const manual = scene.connections.filter((connection) => !connection.id.startsWith('fuel-'));
  const generated: SceneConnection[] = [];
  scene.objects.forEach((pump) => {
    if (pump.role !== 'dispenser' && pump.role !== 'loading-point') return;
    (pump.props.outlets ?? []).forEach((outlet, index) => {
      if (!outlet.tankId) return;
      const already = manual.some((connection) => connection.type === 'process'
        && ((connection.fromId === outlet.tankId && connection.toId === pump.id) || (connection.toId === outlet.tankId && connection.fromId === pump.id)));
      if (already) return;
      generated.push({
        id: `fuel-${pump.id}-${index}`,
        fromId: outlet.tankId,
        toId: pump.id,
        type: 'process',
        layer: 'process',
        hoseIndex: index,
        provisional: true,
      });
    });
  });
  return { ...scene, connections: [...manual, ...generated] };
}

export function installProbe(scene: SceneState, tankId: string, settings: TechnicalSettings, products: Product[]): { scene: SceneState; message: string } {
  const tank = scene.objects.find((object) => object.id === tankId);
  if (!tank) return { scene, message: 'No encuentro ese tanque.' };
  if (probesOn(scene, tankId).length > 0) {
    return { scene, message: 'Este tanque ya tiene una sonda instalada. Conectala a una consola o a un receptor.' };
  }
  const height = tank.props.heightMm;
  const rigid = resolveRole('probe-rigid', settings, products);
  const flex = resolveRole('probe-flex', settings, products);
  const fits = (range: { minMm: number | null; maxMm: number | null } | null) => {
    if (height == null || !range || (range.minMm == null && range.maxMm == null)) return false;
    if (range.minMm != null && height < range.minMm) return false;
    if (range.maxMm != null && height > range.maxMm) return false;
    return true;
  };
  const chosen = fits(rigid.range) ? rigid : fits(flex.range) ? flex : null;
  const probe = createObject({
    kind: 'probe',
    role: 'probe',
    name: nextName(scene.objects, 'SD'),
    x: tank.x,
    z: tank.z,
    rotation: tank.rotation,
    attachedTo: tank.id,
    quantity: tank.props.probeCount && tank.props.probeCount > 0 ? tank.props.probeCount : 1,
    serviceKey: 'probe',
    productId: chosen?.product?.id ?? null,
  });
  const objects = scene.objects.map((object) => object.id === tank.id ? { ...object, props: { ...object.props, probeCount: probe.quantity } } : object);
  const wireless = tank.props.comms === 'wireless' || tank.props.comms === 'wireless-solar';
  const message = wireless
    ? `Sonda instalada en ${tank.name}: USD 850, con el módulo inalámbrico incluido. Conectala a una consola.`
    : `Sonda instalada en ${tank.name}: USD 650, cableada. Conectala a una consola.`;
  return { scene: { ...scene, objects: [...objects, probe] }, message };
}

export function rotateObject(scene: SceneState, objectId: string, delta: number): SceneState {
  return {
    ...scene,
    objects: scene.objects.map((object) => {
      if (object.id !== objectId && object.attachedTo !== objectId) return object;
      const rotation = object.id === objectId ? object.rotation + delta : object.rotation + delta;
      return { ...object, rotation };
    }),
  };
}

export function detachOrRemove(scene: SceneState, objectId: string, removeChildren: boolean): SceneState {
  const children = scene.objects.filter((object) => object.attachedTo === objectId);
  const childIds = new Set(children.map((object) => object.id));
  const drop = new Set<string>([objectId]);
  if (removeChildren) children.forEach((object) => drop.add(object.id));
  return {
    ...scene,
    objects: scene.objects
      .filter((object) => !drop.has(object.id))
      .map((object) => object.attachedTo === objectId ? { ...object, attachedTo: null, x: object.x + 1.6, z: object.z } : object),
    connections: scene.connections.filter((connection) => {
      if (drop.has(connection.fromId) || drop.has(connection.toId)) return false;
      if (!removeChildren && (childIds.has(connection.fromId) || childIds.has(connection.toId))) return true;
      return true;
    }),
  };
}

export function layerOf(type: ConnectionType): LayerFilter {
  if (type === 'process') return 'fuel';
  if (type === 'sensor' || type === 'wireless') return 'telemetry';
  if (type === 'dispenser-control' || type === 'alarm' || type === 'association') return 'control';
  return 'network';
}

export function connectionVisible(type: ConnectionType, filter: LayerFilter, showConnections: boolean): boolean {
  if (filter !== 'all') return layerOf(type) === filter;
  return showConnections;
}

export function familyIds(scene: SceneState, id: string): string[] {
  const ids = new Set<string>([id]);
  const object = scene.objects.find((item) => item.id === id);
  if (object?.attachedTo) ids.add(object.attachedTo);
  scene.objects.forEach((item) => {
    if (item.attachedTo && (item.attachedTo === id || item.attachedTo === object?.attachedTo)) ids.add(item.id);
  });
  return [...ids];
}

export function connectionTouches(scene: SceneState, connection: SceneConnection, id: string): boolean {
  const family = new Set(familyIds(scene, id));
  return family.has(connection.fromId) || family.has(connection.toId);
}

export function visibleConnectionIds(
  scene: SceneState,
  options: { selectedId: string | null; showAll: boolean; layer: LayerFilter; pinIds?: string[] },
): string[] {
  const pinned = new Set(options.pinIds ?? []);
  return scene.connections.filter((connection) => {
    if (pinned.has(connection.id)) return true;
    if (options.layer !== 'all') return layerOf(connection.type) === options.layer;
    if (options.showAll) return true;
    if (!options.selectedId) return false;
    return connectionTouches(scene, connection, options.selectedId);
  }).map((connection) => connection.id);
}

const OFFERED: ConnectionType[] = ['process', 'sensor', 'rs485', 'wireless', 'ethernet', 'wifi', 'dispenser-control', 'alarm', 'cloud', 'association'];

export function possibleLinks(fromId: string, toId: string, scene: SceneState, settings: TechnicalSettings, products: Product[]) {
  return OFFERED.map((type) => {
    const draft: SceneConnection = { id: 'draft', fromId, toId, type, layer: connectionLayer(type) };
    const trial = { ...scene, connections: [...scene.connections, draft] };
    const finding = assessConnection(draft, trial, settings, products);
    return { type, status: finding.status, message: finding.message };
  }).filter((item) => item.status !== 'incompatible');
}

export function suggestConnections(scene: SceneState, settings: TechnicalSettings, products: Product[]): { links: SceneConnection[]; note: string } {
  const links: SceneConnection[] = [];
  const consoles = scene.objects.filter((object) => object.role === 'console-telemetry');
  const probes = scene.objects.filter((object) => object.role === 'probe' && object.attachedTo);
  const loose = probes.filter((probe) => !scene.connections.some((connection) => (connection.fromId === probe.id || connection.toId === probe.id) && DATA_LINK.has(connection.type)));
  if (loose.length > 0 && consoles.length === 0) {
    return { links: [], note: 'Hay sondas sin comunicación y no hay una consola en la playa. Agregala desde la biblioteca: no la sumo sola.' };
  }
  loose.forEach((probe) => {
    for (const consoleObject of consoles) {
      const draft: SceneConnection = { id: `sug-${probe.id}-${consoleObject.id}`, fromId: probe.id, toId: consoleObject.id, type: 'sensor', layer: 'data' };
      const trial = { ...scene, connections: [...scene.connections, ...links, draft] };
      if (assessConnection(draft, trial, settings, products).status !== 'incompatible') {
        links.push(draft);
        break;
      }
    }
  });
  const controllers = scene.objects.filter((object) => object.role === 'dispenser-controller');
  scene.objects.filter((object) => (object.role === 'dispenser' || object.role === 'loading-point') && object.props.needsControl === true).forEach((pump) => {
    const linked = scene.connections.some((connection) => connection.type === 'dispenser-control' && (connection.fromId === pump.id || connection.toId === pump.id));
    if (linked || controllers.length === 0) return;
    const controller = controllers[0];
    const draft: SceneConnection = { id: `sug-ctl-${pump.id}`, fromId: pump.id, toId: controller.id, type: 'dispenser-control', layer: 'data' };
    const trial = { ...scene, connections: [...scene.connections, ...links, draft] };
    if (assessConnection(draft, trial, settings, products).status !== 'incompatible') links.push(draft);
  });
  if (links.length === 0) return { links, note: 'No hay un enlace nuevo que se pueda proponer con los datos cargados.' };
  return { links, note: `Hay ${links.length} conexión(es) posible(s). Confirmalas para dibujarlas.` };
}

export function nearestTank(objects: SceneObject[], x: number, z: number): SceneObject | undefined {
  return objects.filter((object) => object.role === 'tank').reduce<SceneObject | undefined>((best, tank) => {
    if (!best) return tank;
    return Math.hypot(tank.x - x, tank.z - z) < Math.hypot(best.x - x, best.z - z) ? tank : best;
  }, undefined);
}

export function isTransmitter(object: { role: string; kind: string }): boolean {
  return object.role === 'solar-wireless' || object.kind === 'receiver';
}

function tankUnder(tanks: SceneObject[], x: number, z: number): SceneObject | undefined {
  const hit = tanks
    .map((tank) => ({ tank, distance: Math.hypot(tank.x - x, tank.z - z) }))
    .filter((item) => item.distance < 2.2)
    .sort((a, b) => a.distance - b.distance);
  return hit[0]?.tank;
}

export function transmitterHost(object: SceneObject, objects: SceneObject[], connections: SceneState['connections'] = []): SceneObject | undefined {
  if (!isTransmitter(object)) return undefined;
  const tanks = objects.filter((item) => item.role === 'tank');
  const linked = new Set<string>();
  connections.forEach((connection) => {
    if (connection.fromId !== object.id && connection.toId !== object.id) return;
    const otherId = connection.fromId === object.id ? connection.toId : connection.fromId;
    const other = objects.find((item) => item.id === otherId);
    if (!other) return;
    if (other.role === 'tank') linked.add(other.id);
    if (other.attachedTo) linked.add(other.attachedTo);
  });
  if (linked.size === 1) return tanks.find((tank) => linked.has(tank.id));
  const marked = tanks.filter((tank) => tank.props.comms === 'wireless' || tank.props.comms === 'wireless-solar');
  const under = tankUnder(tanks, object.x, object.z);
  if (marked.length === 1) return marked[0];
  if (under) return under;
  if (object.attachedTo) return tanks.find((tank) => tank.id === object.attachedTo);
  return undefined;
}

export function presentScene(scene: SceneState): SceneState {
  let changed = false;
  const named = scene.objects.map((object) => {
    const label = plainLabel(object);
    if (label === object.name) return object;
    changed = true;
    return { ...object, name: label };
  });
  const stuck = named.map((object) => {
    if (!isTransmitter(object)) return object;
    const host = transmitterHost(object, named, scene.connections);
    if (!host) return object;
    if (object.attachedTo === host.id && object.x === host.x && object.z === host.z) return object;
    changed = true;
    return { ...object, attachedTo: host.id, x: host.x, z: host.z, rotation: host.rotation };
  });
  const hosts = new Set(stuck.filter((object) => isTransmitter(object) && object.attachedTo).map((object) => object.attachedTo));
  const objects = stuck.map((object) => {
    if (object.role !== 'tank') return object;
    if (hosts.has(object.id)) {
      if (object.props.comms === 'wireless' || object.props.comms === 'wireless-solar') return object;
      changed = true;
      return { ...object, props: { ...object.props, comms: 'wireless-solar' as const } };
    }
    if (object.props.comms === 'wireless-solar' && hosts.size > 0 && !hosts.has(object.id)) {
      changed = true;
      return { ...object, props: { ...object.props, comms: 'unset' as const } };
    }
    return object;
  });
  return changed ? { ...scene, objects } : scene;
}

export function migrateScene(input: unknown): SceneState {
  const base = emptyScene();
  if (!input || typeof input !== 'object') return base;
  const raw = input as Partial<SceneState>;
  const objects = Array.isArray(raw.objects) ? raw.objects.filter((item) => item && typeof item === 'object' && typeof item.id === 'string') : [];
  const connections = Array.isArray(raw.connections) ? raw.connections.filter((item) => item && typeof item.id === 'string' && item.fromId && item.toId && item.type) : [];
  const tanks = objects.filter((object) => object.role === 'tank');
  const migrated = objects.map((object) => {
    if (object.role !== 'probe' || object.attachedTo) return object;
    const host = tanks.find((tank) => Math.hypot(tank.x - object.x, tank.z - object.z) < 1.4);
    return host ? { ...object, attachedTo: host.id, x: host.x, z: host.z } : object;
  });
  return presentScene({
    ...base,
    ...raw,
    objects: migrated as SceneObject[],
    connections: connections.map((connection) => ({ ...connection, layer: connection.layer || connectionLayer(connection.type) })),
    dismissedSuggestionIds: Array.isArray(raw.dismissedSuggestionIds) ? raw.dismissedSuggestionIds : [],
    schemaVersion: 2,
    showLabels: raw.showLabels !== false,
    showConnections: raw.showConnections === true,
    viewMode: raw.viewMode === 'technical' ? 'technical' : 'installation',
    routeSeed: typeof raw.routeSeed === 'number' ? raw.routeSeed : 0,
    installationType: raw.installationType ?? null,
  });
}
