import assert from 'node:assert/strict';
import { test } from 'node:test';
import { products } from '../data/products';
import { buildBom } from './bom';
import { technicalDocsForQuote } from './pdf';
import { assessConnection } from './engine';
import { createObject, deviceLabel, emptyScene } from './library';
import { defaultSettings } from './settings';
import { hoseCountOf, installProbe, migrateScene, nearestTank, possibleLinks, presentScene, probeVisual, rotateObject, suggestConnections, syncFuelLinks, visibleConnectionIds, withHoses } from './scene/logic';
import { portsFor } from './scene/ports';
import type { SceneConnection, SceneState, StoredQuote } from './types';
import type { Product } from '../types';

const settings = defaultSettings();

function tank(name: string, x: number, z: number, height: number | null = 2500) {
  return createObject({
    kind: 'tank-underground',
    role: 'tank',
    name,
    x,
    z,
    props: { capacityLiters: 20000, heightMm: height, product: 'Gasoil', comms: 'wired', probeCount: null },
  });
}

test('A: la sonda queda en el tanque después de girarlo y de conectarla', () => {
  let scene: SceneState = emptyScene();
  const host = tank('T1', 0, 0);
  scene = { ...scene, objects: [host] };
  const installed = installProbe(scene, host.id, settings, products);
  scene = installed.scene;
  const probe = scene.objects.find((object) => object.role === 'probe');
  assert.ok(probe);
  assert.equal(probe?.attachedTo, host.id);
  assert.equal(probeVisual(scene, host.id), 'unlinked');

  const consoleObject = createObject({ kind: 'console', role: 'console-telemetry', name: 'CTL1', x: 4, z: 0, serviceKey: 'console-telemetry' });
  const link: SceneConnection = { id: 'c1', fromId: probe!.id, toId: consoleObject.id, type: 'sensor', layer: 'data' };
  scene = { ...scene, objects: [...scene.objects, consoleObject], connections: [link] };
  assert.equal(probeVisual(scene, host.id), 'linked');

  const before = scene.connections.length;
  scene = rotateObject(scene, host.id, Math.PI / 2);
  const turned = scene.objects.find((object) => object.id === host.id);
  const turnedProbe = scene.objects.find((object) => object.id === probe!.id);
  assert.ok(Math.abs((turned?.rotation ?? 0) - Math.PI / 2) < 0.001);
  assert.equal(turnedProbe?.attachedTo, host.id);
  assert.equal(scene.connections.length, before);
  assert.equal(scene.connections[0].fromId, probe!.id);
});

test('B: pasar de 2 a 4 mangueras actualiza el surtidor', () => {
  const pump = withHoses(createObject({
    kind: 'dispenser',
    role: 'dispenser',
    name: 'S1',
    x: 0,
    z: 0,
    props: { hoseCount: 2, outlets: [{ product: 'Gasoil', tankId: null }, { product: 'Nafta Súper', tankId: null }] },
  }), 4);
  assert.equal(hoseCountOf(pump), 4);
  assert.equal(pump.props.outlets?.length, 4);
  assert.equal(pump.props.outlets?.[0].product, 'Gasoil');
});

test('C: cada manguera conserva el tanque de origen', () => {
  const first = tank('T1', -2, 0);
  const second = tank('T2', -2, 2);
  const pump = withHoses(createObject({ kind: 'dispenser', role: 'dispenser', name: 'S1', x: 2, z: 1 }), 2);
  pump.props.outlets = [
    { product: 'Gasoil', tankId: first.id },
    { product: 'Nafta Súper', tankId: second.id },
  ];
  const scene = syncFuelLinks({ ...emptyScene(), objects: [first, second, pump] });
  const fuel = scene.connections.filter((connection) => connection.type === 'process');
  assert.equal(fuel.length, 2);
  assert.deepEqual(fuel.map((connection) => connection.fromId).sort(), [first.id, second.id].sort());
  assert.ok(fuel.every((connection) => connection.provisional));
});

test('D: no deja conectar una sonda directo a un surtidor', () => {
  const host = tank('T1', 0, 0);
  const pump = createObject({ kind: 'dispenser', role: 'dispenser', name: 'S1', x: 3, z: 0 });
  let scene: SceneState = { ...emptyScene(), objects: [host, pump] };
  scene = installProbe(scene, host.id, settings, products).scene;
  const probe = scene.objects.find((object) => object.role === 'probe')!;
  const options = possibleLinks(probe.id, pump.id, scene, settings, products);
  assert.equal(options.some((option) => option.type === 'sensor'), false);
  const forcedLink: SceneConnection = { id: 'bad', fromId: probe.id, toId: pump.id, type: 'sensor', layer: 'data' };
  const forced = assessConnection(forcedLink, { ...scene, connections: [forcedLink] }, settings, products);
  assert.equal(forced.status, 'incompatible');
});

test('E: un proyecto viejo recupera la sonda pegada al tanque', () => {
  const host = tank('T1', 1, 1);
  const probe = createObject({ kind: 'probe', role: 'probe', name: 'SD1', x: 1.2, z: 1.1, serviceKey: 'probe' });
  const legacy = { objects: [host, probe], connections: [], routeSeed: 3 };
  const scene = migrateScene(legacy);
  const moved = scene.objects.find((object) => object.id === probe.id);
  assert.equal(moved?.attachedTo, host.id);
  assert.equal(scene.objects.find((object) => object.id === host.id)?.x, 1);
  assert.equal(scene.schemaVersion, 2);
  assert.equal(scene.routeSeed, 3);
});

test('F: la sonda instalada entra una sola vez en la cotización', () => {
  const host = tank('T1', 0, 0, 2500);
  const scene = installProbe({ ...emptyScene(), objects: [host] }, host.id, settings, products).scene;
  const bom = buildBom(scene, settings, products);
  const probes = bom.lines.filter((line) => line.section === 'equipment' && /sonda/i.test(line.name));
  assert.equal(probes.length, 1);
  assert.equal(probes[0].quantity, 1);
  assert.equal(probes[0].name, 'Sonda de telemedición cableada');
  assert.equal(probes[0].unitPrice, 650);

  const wirelessHost = { ...host, props: { ...host.props, comms: 'wireless' as const } };
  const wireless = installProbe({ ...emptyScene(), objects: [wirelessHost] }, wirelessHost.id, settings, products).scene;
  const wirelessLine = buildBom(wireless, settings, products).lines.find((line) => /sonda/i.test(line.name));
  assert.equal(wirelessLine?.name, 'Sonda de telemedición con módulo inalámbrico');
  assert.equal(wirelessLine?.unitPrice, 850);
});

test('sugerir conexiones no inventa una consola paga', () => {
  const host = tank('T1', 0, 0, 2500);
  const scene = installProbe({ ...emptyScene(), objects: [host] }, host.id, settings, products).scene;
  const proposal = suggestConnections(scene, settings, products);
  assert.equal(proposal.links.length, 0);
  assert.match(proposal.note, /biblioteca/i);
});

test('nodos del surtidor, de la sonda y bomba sin precio', () => {
  let scene: SceneState = emptyScene();
  const host = tank('T1', 0, 0);
  const dispenser = withHoses(createObject({ kind: 'dispenser', role: 'dispenser', name: 'S1', x: 3, z: 1 }), 4);
  scene = { ...scene, objects: [host, dispenser] };
  assert.equal(portsFor(host, scene).length, 0);

  scene = installProbe(scene, host.id, settings, products).scene;
  const liveTank = scene.objects.find((object) => object.id === host.id)!;
  const tankPorts = portsFor(liveTank, scene);
  assert.equal(tankPorts.some((port) => port.type === 'sensor'), true);
  assert.equal(tankPorts.filter((port) => port.type === 'process').length, 1);

  const liveDispenser = scene.objects.find((object) => object.role === 'dispenser')!;
  const dispenserPorts = portsFor(liveDispenser, scene);
  assert.equal(dispenserPorts.filter((port) => port.type === 'process').length, 4);
  assert.equal(dispenserPorts.filter((port) => port.type === 'dispenser-control').length, 1);

  const wirelessPorts = portsFor({ ...liveTank, props: { ...liveTank.props, comms: 'wireless' } }, scene);
  assert.equal(wirelessPorts.some((port) => port.type === 'wireless'), true);
  assert.equal(wirelessPorts.some((port) => port.type === 'sensor'), false);

  const consoleObject = createObject({ kind: 'console', role: 'console-telemetry', name: 'CTL1', x: 5, z: 0, serviceKey: 'console-telemetry' });
  const controller = createObject({ kind: 'controller', role: 'dispenser-controller', name: 'CS1', x: 5, z: 2, serviceKey: 'dispenser-controller' });
  const withGear = { ...scene, objects: [...scene.objects, consoleObject, controller] };
  const consolePorts = portsFor(consoleObject, withGear);
  assert.equal(consolePorts.filter((port) => port.type === 'ethernet').length, 1);
  assert.equal(consolePorts.filter((port) => port.type === 'sensor').length, 1);
  assert.equal(consolePorts.filter((port) => port.type === 'dispenser-control').length, 1);
  const wifiController = { ...controller, props: { ...controller.props, wifi: true, ethernet: false } };
  const controllerPorts = portsFor(wifiController, withGear);
  assert.equal(controllerPorts.some((port) => port.type === 'wifi'), true);
  assert.equal(controllerPorts.some((port) => port.type === 'ethernet'), false);
  assert.equal(controllerPorts.filter((port) => port.type === 'dispenser-control').length, 1);

  const fuelPump = createObject({ kind: 'fuel-pump', role: 'fuel-pump', name: 'B1', x: 1, z: -2 });
  const meter = createObject({ kind: 'mechanical-meter', role: 'mechanical-meter', name: 'AF1', x: 2, z: -2 });
  const rfid = createObject({ kind: 'rfid', role: 'rfid-rlcd', name: 'RF1', x: 3, z: -2, serviceKey: 'rfid-rlcd' });
  const processLink: SceneConnection = { id: 'manual-fuel', fromId: host.id, toId: fuelPump.id, type: 'process', layer: 'process' };
  const association: SceneConnection = { id: 'rf-af', fromId: rfid.id, toId: meter.id, type: 'association', layer: 'data' };
  const trial: SceneState = { ...emptyScene(), objects: [host, fuelPump, meter, rfid], connections: [processLink, association] };
  assert.equal(assessConnection(processLink, trial, settings, products).status, 'pending');
  assert.equal(assessConnection(association, trial, settings, products).status, 'pending');
  assert.equal(portsFor(rfid, trial).map((port) => port.short).join(','), 'Punto,Litros');

  const bom = buildBom({ ...emptyScene(), objects: [fuelPump, meter] }, settings, products);
  const gear = bom.lines.filter((line) => line.sourceObjectIds.some((id) => id === fuelPump.id || id === meter.id));
  assert.equal(gear.length, 2);
  assert.ok(gear.every((line) => line.section === 'infrastructure' && line.unitPrice == null));
});

test('la escena física no muestra cables hasta seleccionar, pedir la capa o la vista general', () => {
  const host = tank('T1', 0, 0);
  const pump = createObject({
    kind: 'dispenser',
    role: 'dispenser',
    name: 'S1',
    x: 4,
    z: 0,
    props: { hoseCount: 1, outlets: [{ product: 'Gasoil', tankId: host.id }] },
  });
  const link: SceneConnection = { id: 'fuel-1', fromId: host.id, toId: pump.id, type: 'process', layer: 'process' };
  const scene: SceneState = { ...emptyScene(), objects: [host, pump], connections: [link] };
  assert.equal(scene.showConnections, false);
  assert.deepEqual(visibleConnectionIds(scene, { selectedId: null, showAll: false, layer: 'all' }), []);
  assert.deepEqual(visibleConnectionIds(scene, { selectedId: host.id, showAll: false, layer: 'all' }), ['fuel-1']);
  assert.deepEqual(visibleConnectionIds(scene, { selectedId: null, showAll: false, layer: 'fuel' }), ['fuel-1']);
  assert.deepEqual(visibleConnectionIds(scene, { selectedId: null, showAll: true, layer: 'all' }), ['fuel-1']);
  assert.deepEqual(visibleConnectionIds(scene, { selectedId: null, showAll: false, layer: 'all', pinIds: ['fuel-1'] }), ['fuel-1']);
});

test('los equipos usan nombre completo y el transmisor queda en el tanque', () => {
  const host = tank('TV1', 2, 1);
  host.kind = 'tank-vertical';
  const radio = createObject({ kind: 'receiver', role: 'solar-wireless', name: 'SOL1', x: 3.2, z: 1.4, serviceKey: 'solar-wireless' });
  const scene = presentScene({ ...emptyScene(), objects: [host, radio] });
  const tankLabel = scene.objects.find((object) => object.id === host.id);
  const stuck = scene.objects.find((object) => object.id === radio.id);
  assert.equal(deviceLabel(tankLabel!, scene), 'Tanque vertical 1');
  assert.equal(stuck?.attachedTo, host.id);
  assert.equal(stuck?.name, 'Transmisor inalámbrico 1');
  assert.equal(tankLabel?.props.comms, 'wireless-solar');
  assert.equal(nearestTank(scene.objects, 3, 1)?.id, host.id);
  const probe = createObject({ kind: 'probe', role: 'probe', name: 'SD1', x: 2, z: 1, attachedTo: host.id, serviceKey: 'probe' });
  assert.equal(deviceLabel(probe, { objects: [...scene.objects, probe] }), 'Sonda de Tanque vertical 1');
});

test('el transmisor queda en el tanque asociado y no en el más cercano', () => {
  const vertical = tank('TV1', -8, -4);
  vertical.kind = 'tank-vertical';
  vertical.props = { ...vertical.props, comms: 'wireless' };
  const buried = tank('T2', 1, 2);
  const radio = createObject({ kind: 'receiver', role: 'solar-wireless', name: 'SOL1', x: 1.3, z: 2.1, serviceKey: 'solar-wireless' });
  const scene = presentScene({ ...emptyScene(), objects: [vertical, buried, radio] });
  const stuck = scene.objects.find((object) => object.id === radio.id);
  const host = scene.objects.find((object) => object.id === vertical.id);
  const other = scene.objects.find((object) => object.id === buried.id);
  assert.equal(stuck?.attachedTo, vertical.id);
  assert.equal(host?.props.comms, 'wireless');
  assert.equal(other?.props.comms, 'wired');
});

test('la ficha técnica se adjunta solo si el producto está en la cotización', () => {
  const quoted = { id: 'prod-004', name: 'CONSOLA', technicalDoc: 'data:application/pdf;base64,QQ==', technicalDocKind: 'pdf' } as Product;
  const probeSheet = { id: 'prod-011', name: 'SONDA RIGIDA', technicalDoc: 'data:application/pdf;base64,QQ==', technicalDocKind: 'pdf' } as Product;
  const unused = { id: 'prod-099', name: 'OTRO', technicalDoc: 'data:image/jpeg;base64,QQ==', technicalDocKind: 'image' } as Product;
  const quote = {
    bom: { lines: [{ section: 'equipment', productId: 'prod-004' }, { section: 'equipment', productId: null, name: 'Sonda de telemedición cableada' }, { section: 'infrastructure', productId: null }] },
    scene: { objects: [] },
  } as unknown as StoredQuote;
  assert.deepEqual(technicalDocsForQuote(quote, [quoted, probeSheet, unused]).map((product) => product.id), ['prod-004', 'prod-011']);
});
