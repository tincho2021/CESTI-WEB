import type { Product } from '../types';
import { createObject, emptyScene, LIBRARY, nextName } from './library';
import { installProbe, presentScene, withHoses } from './scene/logic';
import { uid } from './ids';
import type { Customer, InstallationType, Kind, SceneConnection, SceneState, TechnicalSettings } from './types';

export type PromptDispenser = {
  brand: string;
  model: string;
  hoseCount: number;
  label: string;
};

export type PromptTank = {
  kind: 'tank-vertical' | 'tank-underground';
  heightMm: number | null;
};

export type PromptSite = {
  name: string;
  fleet: boolean;
  telemetry: boolean;
  tanks: PromptTank[];
  dispensers: PromptDispenser[];
};

export type PromptPlan = {
  sites: PromptSite[];
  notes: string;
  summary: string;
  installationType: InstallationType;
};

const BRANDS = ['gilbarco', 'wayne', 'bertotto', 'tokheim', 'tatsuno', 'bennett', 'pec', 'midco', 'coptron'];

function fold(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function titleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function hoseCountFrom(text: string): number {
  if (/cuadruple|cuatruple|4\s*(picos|mangueras|productos)?/.test(text)) return 4;
  if (/triple|3\s*(picos|mangueras)/.test(text)) return 3;
  if (/doble|2\s*(picos|mangueras)/.test(text)) return 2;
  if (/simple|un pico|1\s*(pico|manguera)/.test(text)) return 1;
  if (/alto caudal/.test(text)) return 1;
  return 2;
}

function brandFrom(text: string): string {
  const hit = BRANDS.find((brand) => text.includes(brand));
  return hit ? titleCase(hit) : '';
}

function heightMmFrom(text: string): number | null {
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*(?:m|mts|metros)\b/);
  if (!match) return null;
  const meters = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(meters) || meters <= 0) return null;
  return Math.round(meters * 1000);
}

function countFrom(text: string, noun: string): number {
  const match = text.match(new RegExp(`(?:en\\s+)?(\\d+)\\s+${noun}`));
  if (match) return Math.max(1, Math.min(12, Number(match[1])));
  if (new RegExp(`\\b(un|una)\\s+${noun}`).test(text)) return 1;
  if (new RegExp(`\\b(dos)\\s+${noun}`).test(text)) return 2;
  if (new RegExp(`\\b(tres)\\s+${noun}`).test(text)) return 3;
  return 0;
}

function isEquipmentLine(text: string): boolean {
  return /surtidor|tanque|telemedic|sonda|consola|gilbarco|wayne|bertotto|tokheim|manguera|pico|caudal/.test(text);
}

function isSiteHeader(line: string, hasItems: boolean): boolean {
  const text = fold(line).replace(/^[\d.)-]+\s*/, '');
  if (!text || text.length > 42) return false;
  if (isEquipmentLine(text)) return false;
  if (/^\d/.test(text)) return false;
  if (!hasItems) return false;
  if (/sistema|planta|playa|predio|establecimiento/.test(text)) return true;
  return text.split(' ').length <= 5;
}

function parseTanks(text: string): PromptTank[] {
  const vertical = /vertical/.test(text);
  const buried = /subterraneo|enterrado/.test(text);
  const noun = vertical || !buried ? 'tanques?' : 'tanques?';
  const counted = countFrom(text, noun);
  const kind: PromptTank['kind'] = buried && !vertical ? 'tank-underground' : 'tank-vertical';
  const heightMm = heightMmFrom(text);
  const n = counted || (/(tanque|cisterna)/.test(text) ? 1 : 0);
  return Array.from({ length: n }, () => ({ kind, heightMm }));
}

function parseDispenser(text: string): PromptDispenser | null {
  if (!/surtidor/.test(text) && !BRANDS.some((brand) => text.includes(brand))) return null;
  if (/tanque/.test(text) && !/surtidor/.test(text)) return null;
  const brand = brandFrom(text);
  const model = /alto caudal/.test(text) ? 'Alto caudal' : '';
  return {
    brand,
    model,
    hoseCount: hoseCountFrom(text),
    label: [brand, model].filter(Boolean).join(' ') || 'Surtidor',
  };
}

function parseLine(site: PromptSite, raw: string) {
  const text = fold(raw).replace(/^[\d.)-]+\s*/, '');
  if (!text) return;
  if (/telemedic|sonda/.test(text)) site.telemetry = true;
  if (/control de flota|identificacion|rfid/.test(text)) site.fleet = true;
  const tanks = parseTanks(text);
  if (tanks.length) site.tanks.push(...tanks);
  const dispenser = parseDispenser(text);
  if (dispenser) site.dispensers.push(dispenser);
}

export function parseInstallPrompt(input: string): PromptPlan {
  const notes = input.trim();
  const lines = notes.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const sites: PromptSite[] = [];
  let fleetAll = /control de flota|identificacion de vehiculos|\brfid\b/.test(fold(notes));
  let current: PromptSite = { name: 'Instalación', fleet: fleetAll, telemetry: false, tanks: [], dispensers: [] };

  lines.forEach((line, index) => {
    const text = fold(line);
    if (index === 0 && /control de flota|sistema/.test(text)) {
      fleetAll = fleetAll || /control de flota/.test(text);
      const location = line.replace(/.*(?:flota|sistemas?)/i, '').trim();
      if (location && !isEquipmentLine(fold(location))) current.name = titleCase(location);
      current.fleet = fleetAll;
      return;
    }
    if (isSiteHeader(line, current.tanks.length + current.dispensers.length > 0)) {
      sites.push(current);
      current = { name: titleCase(line), fleet: fleetAll, telemetry: false, tanks: [], dispensers: [] };
      return;
    }
    parseLine(current, line);
  });
  if (current.tanks.length || current.dispensers.length || current.telemetry) sites.push(current);

  const usable = sites.filter((site) => site.tanks.length || site.dispensers.length);
  const filled = (usable.length ? usable : sites).map((site) => ({ ...site, fleet: site.fleet || fleetAll }));
  const summary = filled.length
    ? filled.map((site) => {
      const bits = [
        site.tanks.length ? `${site.tanks.length} tanque(s)` : '',
        site.dispensers.length ? `${site.dispensers.length} surtidor(es)` : '',
        site.telemetry ? 'telemedición' : '',
        site.fleet ? 'control de flota' : '',
      ].filter(Boolean);
      return `${site.name}: ${bits.join(', ')}`;
    }).join(' · ')
    : '';

  const installationType: InstallationType = fleetAll || filled.some((site) => site.fleet)
    ? 'fleet'
    : filled.some((site) => site.tanks.some((tank) => tank.kind === 'tank-vertical'))
      ? 'agro'
      : 'station';

  return { sites: filled, notes, summary, installationType };
}

function add(scene: SceneState, input: Parameters<typeof createObject>[0]): SceneState {
  if (scene.objects.length >= 60) return scene;
  const object = createObject({ ...input, name: input.name || nextName(scene.objects, 'X') });
  return { ...scene, objects: [...scene.objects, object] };
}

export function sceneFromPrompt(plan: PromptPlan, settings: TechnicalSettings, products: Product[]): { scene: SceneState; summary: string } {
  let scene = emptyScene();
  scene.installationType = plan.installationType;
  const connections: SceneConnection[] = [];

  plan.sites.forEach((site, siteIndex) => {
    const originX = (siteIndex - (plan.sites.length - 1) / 2) * 22;
    const siteIds = { tanks: [] as string[], dispensers: [] as string[], consoleId: '', controllerId: '' };
    scene = add(scene, {
      kind: 'office',
      role: 'office',
      name: plan.sites.length > 1 ? `Oficina ${site.name}` : nextName(scene.objects, 'OF'),
      x: originX - 10,
      z: 0,
      props: { notes: site.name, internet: true, remoteAccess: true },
    });
    const office = scene.objects[scene.objects.length - 1];

    site.tanks.forEach((tank, index) => {
      const name = plan.sites.length > 1
        ? `${tank.kind === 'tank-vertical' ? 'Tanque vertical' : 'Tanque subterráneo'} ${site.name} ${index + 1}`
        : nextName(scene.objects, tank.kind === 'tank-vertical' ? 'TV' : 'T');
      scene = add(scene, {
        kind: tank.kind,
        role: 'tank',
        name,
        x: originX - 2 + index * 4.2,
        z: -5,
        props: { heightMm: tank.heightMm, comms: 'unset' },
      });
      siteIds.tanks.push(scene.objects[scene.objects.length - 1].id);
    });

    site.dispensers.forEach((pump, index) => {
      const name = plan.sites.length > 1 ? `Surtidor ${pump.label} ${site.name}` : nextName(scene.objects, 'S');
      const draft = createObject({
        kind: 'dispenser',
        role: 'dispenser',
        name,
        x: originX - 2 + index * 4.2,
        z: 4.2,
        props: {
          brand: pump.brand,
          model: pump.model,
          needsControl: true,
          needsRfid: site.fleet,
          notes: site.name,
        },
      });
      scene = { ...scene, objects: [...scene.objects, withHoses(draft, pump.hoseCount)] };
      siteIds.dispensers.push(scene.objects[scene.objects.length - 1].id);
    });

    if (site.telemetry && siteIds.tanks.length) {
      siteIds.tanks.forEach((tankId) => {
        scene = installProbe(scene, tankId, settings, products).scene;
      });
      scene = add(scene, {
        kind: 'console',
        role: 'console-telemetry',
        name: plan.sites.length > 1 ? `Consola de telemedición ${site.name}` : nextName(scene.objects, 'CTL'),
        x: office.x + 2.2,
        z: office.z,
        serviceKey: 'console-telemetry',
      });
      siteIds.consoleId = scene.objects[scene.objects.length - 1].id;
      scene.objects.filter((object) => object.role === 'probe' && object.attachedTo && siteIds.tanks.includes(object.attachedTo)).forEach((probe) => {
        connections.push({
          id: uid(),
          fromId: probe.id,
          toId: siteIds.consoleId,
          type: 'sensor',
          layer: 'data',
        });
      });
    }

    if (siteIds.dispensers.length) {
      scene = add(scene, {
        kind: 'controller',
        role: 'dispenser-controller',
        name: plan.sites.length > 1 ? `Controlador de surtidor ${site.name}` : nextName(scene.objects, 'CS'),
        x: office.x + 2.2,
        z: office.z + 1.6,
        serviceKey: 'dispenser-controller',
      });
      siteIds.controllerId = scene.objects[scene.objects.length - 1].id;
      siteIds.dispensers.forEach((pumpId) => {
        connections.push({
          id: uid(),
          fromId: pumpId,
          toId: siteIds.controllerId,
          type: 'dispenser-control',
          layer: 'data',
        });
      });
    }

    if (site.fleet) {
      const item = LIBRARY.find((entry) => entry.id === 'fleet');
      if (item) {
        scene = add(scene, {
          kind: item.kind as Kind,
          role: item.role,
          name: plan.sites.length > 1 ? `Control de flotas ${site.name}` : nextName(scene.objects, item.namePrefix),
          x: office.x + 2.2,
          z: office.z + 3.2,
          serviceKey: item.role,
          billing: item.billing,
        });
      }
    }
  });

  const built = presentScene({ ...scene, connections: [...scene.connections, ...connections] });
  return { scene: built, summary: plan.summary };
}

export function customerFromPrompt(plan: PromptPlan, current: Customer): Customer {
  return {
    ...current,
    location: current.location || plan.sites.map((site) => site.name).filter((name) => name !== 'Instalación').join(' / '),
    activity: current.activity || (plan.installationType === 'fleet' ? 'fleet' : plan.installationType === 'agro' ? 'agro' : 'station'),
    notes: current.notes || plan.notes,
  };
}
