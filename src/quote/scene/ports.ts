import { hoseCountOf, probeVisual, rotateLocal } from './logic';
import type { ConnectionType, SceneObject, SceneState } from '../types';

export interface ScenePort {
  id: string;
  short: string;
  label: string;
  color: string;
  type: ConnectionType;
  index: number;
  x: number;
  y: number;
  z: number;
}

const COLOR = {
  process: '#3b82f6',
  sensor: '#f59e0b',
  control: '#6d28d9',
  ethernet: '#059669',
  wifi: '#06b6d4',
  wireless: '#c026d3',
  association: '#14b8a6',
};

function linksOf(scene: SceneState, id: string, type: ConnectionType) {
  return scene.connections.filter((connection) => connection.type === type && (connection.fromId === id || connection.toId === id)).length;
}

function fuelConsumers(scene: SceneState) {
  return scene.objects.filter((object) => object.role === 'dispenser' || object.role === 'loading-point' || object.role === 'fuel-pump').length;
}

export function portsFor(object: SceneObject, scene: SceneState): ScenePort[] {
  const ports: ScenePort[] = [];
  const add = (port: Omit<ScenePort, 'id'>) => {
    ports.push({ ...port, id: `${object.id}:${port.type}:${port.index}:${port.short}` });
  };

  if (object.role === 'dispenser' || object.role === 'loading-point') {
    add({
      short: 'Control',
      label: 'Comunicación al controlador de surtidores',
      color: COLOR.control,
      type: 'dispenser-control',
      index: 0,
      x: 0.46,
      y: 1.5,
      z: 0.34,
    });
    const hoses = hoseCountOf(object);
    for (let index = 0; index < hoses; index += 1) {
      const row = index % 2;
      const col = Math.floor(index / 2);
      add({
        short: `Surtidor ${index + 1}`,
        label: `Succión ${index + 1}: alimentación de combustible`,
        color: COLOR.process,
        type: 'process',
        index,
        x: -1.18,
        y: 0.5,
        z: -0.18 + row * 0.22 + col * 0.02,
      });
    }
  }

  if (object.role === 'tank') {
    const visual = probeVisual(scene, object.id);
    if (visual !== 'none') {
      const wireless = object.props.comms === 'wireless' || object.props.comms === 'wireless-solar';
      const solar = object.props.comms === 'wireless-solar';
      const vertical = object.kind === 'tank-vertical';
      if (wireless) {
        add({
          short: 'Radio',
          label: 'Transmisor inalámbrico en el lomo del tanque',
          color: COLOR.wireless,
          type: 'wireless',
          index: 0,
          x: vertical ? 0.52 : 0.36,
          y: vertical ? 2.9 : 1.28,
          z: vertical ? 0.48 : 0.08,
        });
      } else {
        add({
          short: 'Consola',
          label: 'Comunicación con la consola de telemedición',
          color: COLOR.sensor,
          type: 'sensor',
          index: 0,
          x: vertical ? 0.22 : 0.42,
          y: vertical ? 2.72 : 1.52,
          z: vertical ? 0.16 : 0.22,
        });
      }
      const consumers = Math.max(fuelConsumers(scene), linksOf(scene, object.id, 'process'));
      const count = Math.min(6, Math.max(1, consumers));
      for (let index = 0; index < count; index += 1) {
        add({
          short: `Salida ${index + 1}`,
          label: `Conexión ${index + 1} hacia surtidor, bomba o punto de carga`,
          color: COLOR.process,
          type: 'process',
          index,
          x: vertical ? 1.05 : 1.22,
          y: vertical ? 0.58 + (index % 3) * 0.2 : 0.55,
          z: vertical ? 0.12 + Math.floor(index / 3) * 0.22 : -0.28 + index * 0.18,
        });
      }
    }
  }

  if (object.role === 'console-telemetry') {
    add({
      short: 'Red',
      label: 'Comunicación de red Ethernet',
      color: COLOR.ethernet,
      type: 'ethernet',
      index: 0,
      x: 0.55,
      y: 1.02,
      z: 0.24,
    });
    const probes = scene.objects.filter((item) => item.role === 'tank' && probeVisual(scene, item.id) !== 'none').length;
    const count = Math.min(8, Math.max(probes, linksOf(scene, object.id, 'sensor')));
    for (let index = 0; index < count; index += 1) {
      const row = index % 4;
      const col = Math.floor(index / 4);
      add({
        short: `Sonda ${index + 1}`,
        label: `Sonda de telemedición ${index + 1}`,
        color: COLOR.sensor,
        type: 'sensor',
        index,
        x: 0.58 + col * 0.16,
        y: 0.78 - row * 0.18,
        z: 0.28,
      });
    }
    add({
      short: 'Control',
      label: 'Vinculación al controlador de surtidores',
      color: COLOR.control,
      type: 'dispenser-control',
      index: 0,
      x: -0.55,
      y: 0.82,
      z: 0.24,
    });
  }

  if (object.role === 'dispenser-controller') {
    const wifi = object.props.wifi === true;
    const ethernet = object.props.ethernet === true || (object.props.ethernet == null && !wifi) || (!wifi && object.props.ethernet === false);
    if (ethernet) {
      add({
        short: 'Red',
        label: 'Vínculo Ethernet',
        color: COLOR.ethernet,
        type: 'ethernet',
        index: 0,
        x: 0.52,
        y: wifi ? 0.58 : 0.72,
        z: 0.24,
      });
    }
    if (wifi) {
      add({
        short: 'Wi-Fi',
        label: 'Vínculo Wi-Fi',
        color: COLOR.wifi,
        type: 'wifi',
        index: 0,
        x: 0.52,
        y: 0.92,
        z: 0.24,
      });
    }
    const dispensers = scene.objects.filter((item) => item.role === 'dispenser' || item.role === 'loading-point');
    const controllers = scene.objects.filter((item) => item.role === 'dispenser-controller');
    const mine = linksOf(scene, object.id, 'dispenser-control');
    const unlinked = dispensers.filter((item) => !scene.connections.some((connection) => connection.type === 'dispenser-control' && (connection.fromId === item.id || connection.toId === item.id))).length;
    const count = controllers.length <= 1
      ? Math.min(8, Math.max(1, dispensers.length, mine))
      : Math.min(8, Math.max(1, mine + (unlinked > 0 ? 1 : 0)));
    for (let index = 0; index < count; index += 1) {
      const row = index % 4;
      const col = Math.floor(index / 4);
      add({
        short: `Surtidor ${index + 1}`,
        label: `Surtidor ${index + 1}`,
        color: COLOR.control,
        type: 'dispenser-control',
        index,
        x: -0.54 - col * 0.16,
        y: 0.28 + row * 0.2,
        z: 0.24,
      });
    }
  }

  if (object.role === 'rfid-rlcd') {
    add({
      short: 'Punto',
      label: 'Asociación al punto de carga',
      color: COLOR.association,
      type: 'association',
      index: 0,
      x: 0.36,
      y: 0.92,
      z: 0.18,
    });
    add({
      short: 'Litros',
      label: 'Vínculo al aforador: el display cuenta litros',
      color: COLOR.association,
      type: 'association',
      index: 1,
      x: 0.36,
      y: 0.48,
      z: 0.18,
    });
  }

  if (object.role === 'fuel-pump') {
    add({ short: 'Entrada', label: 'Succión desde el tanque', color: COLOR.process, type: 'process', index: 0, x: -0.78, y: 0.46, z: 0 });
    add({ short: 'Salida', label: 'Descarga hacia caudalímetro, aforador o surtidor', color: COLOR.process, type: 'process', index: 1, x: 0.78, y: 0.46, z: 0 });
  }

  if (object.role === 'flow-meter') {
    add({ short: 'Entrada', label: 'Entrada de combustible', color: COLOR.process, type: 'process', index: 0, x: -0.72, y: 0.38, z: 0 });
    add({ short: 'Salida', label: 'Salida de combustible', color: COLOR.process, type: 'process', index: 1, x: 0.72, y: 0.38, z: 0 });
  }

  if (object.role === 'mechanical-meter') {
    add({ short: 'Entrada', label: 'Entrada de combustible', color: COLOR.process, type: 'process', index: 0, x: -0.62, y: 0.36, z: 0 });
    add({
      short: 'Tarjeta',
      label: 'Vínculo al tarjetero para contar litros en el display',
      color: COLOR.association,
      type: 'association',
      index: 0,
      x: 0.28,
      y: 0.78,
      z: 0.22,
    });
  }

  return ports;
}

export function endpoint(object: SceneObject, scene: SceneState, type: ConnectionType | null, index = 0) {
  const parent = object.attachedTo ? scene.objects.find((item) => item.id === object.attachedTo) : undefined;
  const host = parent ?? object;
  const ports = portsFor(host, scene);
  const matching = type ? ports.filter((port) => port.type === type) : ports;
  const port = matching[Math.min(Math.max(0, index), Math.max(0, matching.length - 1))];
  const local = port ?? { x: 0, y: 0.7, z: 0 };
  const rotated = rotateLocal(local.x, local.z, host.rotation || 0);
  return { x: host.x + rotated.x, y: local.y, z: host.z + rotated.z };
}
