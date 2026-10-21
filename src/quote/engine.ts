import type { Product } from '../types';
import { resolveRole } from './settings';
import { protocolMatch } from './specs';
import type {
  CheckStatus,
  ConnectionType,
  Finding,
  SceneConnection,
  SceneObject,
  SceneState,
  Suggestion,
  TechnicalSettings,
} from './types';

const DATA_TYPES: ConnectionType[] = ['sensor', 'rs485', 'wireless', 'ethernet', 'wifi', 'cloud', 'dispenser-control', 'alarm'];

function objectById(scene: SceneState, id: string): SceneObject | undefined {
  return scene.objects.find((object) => object.id === id);
}

function layerFor(type: ConnectionType): SceneConnection['layer'] {
  if (type === 'process') return 'process';
  if (type === 'alarm') return 'alarm';
  return 'data';
}

export function connectionLayer(type: ConnectionType): SceneConnection['layer'] {
  return layerFor(type);
}

function tanks(scene: SceneState): SceneObject[] {
  return scene.objects.filter((object) => object.kind === 'tank-underground' || object.kind === 'tank-vertical');
}

function dispensers(scene: SceneState): SceneObject[] {
  return scene.objects.filter((object) => object.kind === 'dispenser' || object.kind === 'loading-point');
}

export function measuredTanks(scene: SceneState): SceneObject[] {
  return tanks(scene).filter((tank) => {
    const probes = scene.objects.filter((object) => object.role === 'probe' && object.attachedTo === tank.id);
    return probes.length > 0 || (tank.props.probeCount ?? 0) > 0;
  });
}

function sensorLoad(consoleObject: SceneObject, scene: SceneState): { channels: number; unknown: boolean } {
  let channels = 0;
  let unknown = false;
  const coveredTanks = new Set<string>();
  scene.connections.forEach((connection) => {
    if (connection.type !== 'sensor' && connection.type !== 'alarm') return;
    const otherId = connection.fromId === consoleObject.id ? connection.toId : connection.toId === consoleObject.id ? connection.fromId : null;
    if (!otherId) return;
    const other = objectById(scene, otherId);
    if (other?.role === 'probe' && other.attachedTo) coveredTanks.add(other.attachedTo);
  });
  scene.connections.forEach((connection) => {
    if (connection.type !== 'sensor' && connection.type !== 'alarm') return;
    const otherId = connection.fromId === consoleObject.id ? connection.toId : connection.toId === consoleObject.id ? connection.fromId : null;
    if (!otherId) return;
    const other = objectById(scene, otherId);
    if (!other) return;
    if (other.role === 'probe' || other.kind === 'probe') {
      channels += other.quantity;
      return;
    }
    if (other.role === 'leak-liquid' || other.role === 'leak-gas' || other.role === 'overflow') {
      channels += other.quantity;
      return;
    }
    if ((other.kind === 'tank-underground' || other.kind === 'tank-vertical') && !coveredTanks.has(other.id)) {
      if (other.props.probeCount == null) unknown = true;
      channels += other.props.probeCount ?? 1;
    }
  });
  return { channels, unknown };
}

function hoseLoad(controller: SceneObject, scene: SceneState): { hoses: number; unknown: boolean } {
  let hoses = 0;
  let unknown = false;
  scene.connections.forEach((connection) => {
    if (connection.type !== 'dispenser-control') return;
    const otherId = connection.fromId === controller.id ? connection.toId : connection.toId === controller.id ? connection.fromId : null;
    if (!otherId) return;
    const other = objectById(scene, otherId);
    if (!other) return;
    if (other.kind !== 'dispenser' && other.kind !== 'loading-point') return;
    if (other.props.hoseCount == null) unknown = true;
    else hoses += other.props.hoseCount;
  });
  return { hoses, unknown };
}

function status(id: string, value: CheckStatus | 'info', message: string, extra?: Partial<Finding>): Finding {
  return { id, status: value, message, ...extra };
}

export function assessConnection(
  connection: Pick<SceneConnection, 'fromId' | 'toId' | 'type' | 'id'>,
  scene: SceneState,
  settings: TechnicalSettings,
  products: Product[],
): Finding {
  const from = objectById(scene, connection.fromId);
  const to = objectById(scene, connection.toId);
  const id = `conn:${connection.id}`;
  if (!from || !to) return status(id, 'pending', 'La conexión apunta a un equipo que ya no está en la playa.', { connectionId: connection.id });
  if (from.id === to.id) return status(id, 'incompatible', 'Un equipo no se conecta consigo mismo.', { connectionId: connection.id });

  const pair = [from, to];
  const blocked = pair.some((object) => {
    const resolved = resolveRole(object.role, settings, products);
    return resolved.binding?.incompatibleWith.includes(pair.find((item) => item !== object)?.role ?? '');
  });
  if (blocked) {
    return status(id, 'incompatible', 'La regla técnica cargada marca esta combinación como incompatible.', { connectionId: connection.id });
  }

  if (connection.type === 'process') {
    const fuel = new Set(['tank', 'dispenser', 'loading-point', 'fuel-pump', 'flow-meter', 'mechanical-meter']);
    if (fuel.has(from.role) && fuel.has(to.role) && from.role !== to.role) {
      const roles = new Set([from.role, to.role]);
      const message = roles.has('mechanical-meter')
        ? 'El aforador mide ese tramo. El vínculo indica el recorrido y no certifica la cañería física.'
        : roles.has('tank') && (roles.has('dispenser') || roles.has('loading-point'))
          ? 'Relación de abastecimiento: el tanque alimenta ese punto. Indica el origen del producto y no certifica la cañería física.'
          : 'Recorrido de combustible entre esos equipos. Indica el origen y no certifica la cañería física.';
      return status(id, 'pending', message, { connectionId: connection.id });
    }
    return status(id, 'incompatible', 'El abastecimiento se traza entre tanque, bomba, caudalímetro, aforador, surtidor o punto de carga.', { connectionId: connection.id });
  }

  const probeSide = pair.find((object) => object.role === 'probe' || object.kind === 'probe');
  const dispenserSide = pair.find((object) => object.role === 'dispenser' || object.role === 'loading-point');
  if (probeSide && dispenserSide) {
    return status(id, 'incompatible', 'No hay un caso técnico definido para conectar una sonda directamente a un surtidor.', { connectionId: connection.id });
  }

  if (connection.type === 'association') {
    const terminal = pair.find((object) => object.role === 'rfid-rlcd');
    const point = pair.find((object) => object.role === 'loading-point' || object.role === 'dispenser' || object.role === 'mechanical-meter');
    if (terminal && point) {
      return status(
        id,
        'pending',
        point.role === 'mechanical-meter'
          ? 'El tarjetero queda vinculado al aforador. El display cuenta los litros despachados.'
          : 'El tarjetero queda asociado a ese punto de carga.',
        { connectionId: connection.id },
      );
    }
    return status(id, 'incompatible', 'El tarjetero se asocia a un punto de carga, un surtidor o un aforador mecánico.', { connectionId: connection.id });
  }

  if (connection.type === 'sensor') {
    const consoleSide = pair.find((object) => object.role === 'console-telemetry' || object.role === 'leak-console');
    const fieldSide = pair.find((object) => object !== consoleSide);
    if (!consoleSide || !fieldSide) {
      return status(id, 'pending', 'Una sonda o sensor necesita una consola declarada en las reglas. Este destino no tiene ese rol.', { connectionId: connection.id });
    }
    if ((fieldSide.role === 'leak-liquid' || fieldSide.role === 'leak-gas') && consoleSide.role === 'console-telemetry') {
      return status(id, 'pending', 'La ficha de la consola de telemedición no declara entradas de sensores de fuga.', { connectionId: connection.id });
    }
    if (fieldSide.role === 'probe' && consoleSide.role === 'leak-console') {
      return status(id, 'pending', 'La consola de fugas no está declarada como entrada de sondas de nivel.', { connectionId: connection.id });
    }
    const resolved = resolveRole(consoleSide.role, settings, products);
    if (resolved.capacity == null) {
      return status(id, 'pending', 'La consola no tiene una capacidad de canales publicada. La conexión queda pendiente de verificación.', { connectionId: connection.id });
    }
    const load = sensorLoad(consoleSide, scene);
    if (load.channels > resolved.capacity) {
      return status(id, 'incompatible', `Supera los ${resolved.capacity} canales publicados en la ficha de ${resolved.binding?.label ?? 'la consola'}.`, { connectionId: connection.id });
    }
    if (load.unknown) {
      return status(id, 'pending', 'Falta indicar cuántas sondas usa el tanque, así que no se puede cerrar la cuenta de canales.', { connectionId: connection.id });
    }
    return status(id, 'compatible', `Entra en los ${resolved.capacity} canales publicados para ${resolved.binding?.label ?? 'la consola'}.`, { connectionId: connection.id });
  }

  if (connection.type === 'dispenser-control') {
    const controller = pair.find((object) => object.role === 'dispenser-controller');
    const pump = pair.find((object) => object.role === 'dispenser' || object.role === 'loading-point');
    if (!controller || !pump) {
      return status(id, 'incompatible', 'El control de despacho se conecta entre un surtidor y un controlador compatible.', { connectionId: connection.id });
    }
    const resolved = resolveRole(controller.role, settings, products);
    const protocol = protocolMatch(pump.props.protocol ?? '', resolved.protocols);
    const load = hoseLoad(controller, scene);
    if (resolved.capacity != null && !load.unknown && load.hoses > resolved.capacity) {
      return status(id, 'incompatible', `El controlador publica hasta ${resolved.capacity} mangueras y esta conexión supera ese cupo.`, { connectionId: connection.id });
    }
    if (protocol === 'unknown' || pump.props.hoseCount == null || resolved.capacity == null || load.unknown) {
      const reason = pump.props.protocol?.trim()
        ? 'El protocolo informado no figura en la ficha del controlador, o falta la cantidad de mangueras. No se lo marca incompatible: falta una regla de exclusión.'
        : 'Falta el protocolo del surtidor o la capacidad publicada del controlador. La compatibilidad queda pendiente.';
      return status(id, 'pending', reason, { connectionId: connection.id });
    }
    return status(id, 'compatible', `Protocolo contemplado en la ficha y dentro de las ${resolved.capacity} mangueras publicadas.`, { connectionId: connection.id });
  }

  if (connection.type === 'alarm') {
    const alarm = pair.find((object) => object.role === 'overflow' || object.role === 'leak-liquid' || object.role === 'leak-gas');
    const consoleSide = pair.find((object) => object.role === 'leak-console' || object.role === 'console-telemetry');
    if (!alarm || !consoleSide) {
      return status(id, 'pending', 'No hay una interfaz de alarma definida entre estos dos equipos.', { connectionId: connection.id });
    }
    if (alarm.role === 'overflow') {
      return status(id, 'pending', 'La alarma de sobrellenado no tiene canales ni interfaz publicados. La conexión queda pendiente.', { connectionId: connection.id });
    }
    if (consoleSide.role === 'console-telemetry') {
      return status(id, 'pending', 'La consola de telemedición no declara una entrada de alarma de fuga como canal propio.', { connectionId: connection.id });
    }
    const resolved = resolveRole('leak-console', settings, products);
    if (resolved.capacity == null) {
      return status(id, 'pending', 'La consola de fugas no tiene un máximo de sensores publicado.', { connectionId: connection.id });
    }
    const load = sensorLoad(consoleSide, scene);
    if (load.channels > resolved.capacity) {
      return status(id, 'incompatible', `Supera los ${resolved.capacity} sensores publicados para la consola de fugas.`, { connectionId: connection.id });
    }
    return status(id, 'compatible', `La señal entra en los ${resolved.capacity} sensores publicados.`, { connectionId: connection.id });
  }

  if (connection.type === 'wireless') {
    return status(id, 'pending', 'El enlace inalámbrico queda pendiente: no hay una cobertura de radio validada ni un gateway de campo en el catálogo.', { connectionId: connection.id });
  }

  if (connection.type === 'cloud') {
    return status(id, 'pending', 'La plataforma cloud no tiene ficha de protocolo. El vínculo se muestra, pero no se da por verificado.', { connectionId: connection.id });
  }

  if (connection.type === 'rs485' || connection.type === 'ethernet' || connection.type === 'wifi') {
    const office = pair.find((object) => object.role === 'office');
    if (office && connection.type === 'wifi' && office.props.wifi === false) {
      return status(id, 'pending', 'La oficina está marcada sin Wi-Fi. Confirmá el medio antes de dar el enlace por válido.', { connectionId: connection.id });
    }
    if (office && connection.type === 'ethernet' && office.props.ethernet === false) {
      return status(id, 'pending', 'La oficina está marcada sin Ethernet. Confirmá el medio antes de dar el enlace por válido.', { connectionId: connection.id });
    }
    const known = pair.map((object) => resolveRole(object.role, settings, products).protocols).flat();
    if (known.length === 0) {
      return status(id, 'pending', 'Ninguna de las fichas declara este medio. La conexión queda pendiente de verificación.', { connectionId: connection.id });
    }
    const token = connection.type === 'rs485' ? 'rs485' : connection.type === 'ethernet' ? 'ethernet' : 'wifi';
    const supported = known.some((item) => item.toLowerCase().includes(token) || (token === 'ethernet' && /tcp|rj45|ip/i.test(item)));
    return status(
      id,
      supported ? 'compatible' : 'pending',
      supported
        ? 'El medio aparece en la ficha de al menos uno de los equipos.'
        : 'El medio no aparece en las fichas cargadas. No se rechaza la conexión: falta información.',
      { connectionId: connection.id },
    );
  }

  if (!DATA_TYPES.includes(connection.type)) {
    return status(id, 'pending', 'Tipo de conexión sin regla.', { connectionId: connection.id });
  }
  return status(id, 'pending', 'No hay una regla técnica cargada para esta combinación. Queda pendiente de verificación.', { connectionId: connection.id });
}

function probeChoice(tank: SceneObject, settings: TechnicalSettings, products: Product[]) {
  const height = tank.props.heightMm;
  const rigid = resolveRole('probe-rigid', settings, products);
  const flex = resolveRole('probe-flex', settings, products);
  if (height == null) {
    return { productRole: null as string | null, message: 'Falta la altura útil. No se elige sonda ni se inventa una longitud.' };
  }
  const fits = (range: { minMm: number | null; maxMm: number | null } | null) => {
    if (!range || (range.minMm == null && range.maxMm == null)) return false;
    if (range.minMm != null && height < range.minMm) return false;
    if (range.maxMm != null && height > range.maxMm) return false;
    return true;
  };
  if (fits(rigid.range) && rigid.product) return { productRole: 'probe-rigid', message: 'La altura entra en el rango publicado de la sonda rígida.' };
  if (fits(flex.range) && flex.product) return { productRole: 'probe-flex', message: 'La altura entra en la longitud publicada de la sonda flexible.' };
  if (!rigid.range && !flex.range) return { productRole: null, message: 'Las fichas de sonda no publican un rango legible. La elección queda pendiente.' };
  return { productRole: null, message: 'La altura no entra en los rangos publicados. No se asigna una sonda de catálogo.' };
}

export function analyzeInstallation(scene: SceneState, settings: TechnicalSettings, products: Product[]) {
  const findings: Finding[] = [];
  const suggestions: Suggestion[] = [];
  const dismissed = new Set(scene.dismissedSuggestionIds);

  const pushSuggestion = (suggestion: Suggestion) => {
    if (!dismissed.has(suggestion.id)) suggestions.push(suggestion);
  };

  tanks(scene).forEach((tank) => {
    const probes = scene.objects.filter((object) => object.role === 'probe' && object.attachedTo === tank.id);
    const requested = tank.props.probeCount ?? (probes.length > 0 ? probes.reduce((sum, probe) => sum + probe.quantity, 0) : 0);
    if (requested <= 0 && probes.length === 0) {
      pushSuggestion({
        id: `probe:${tank.id}`,
        tone: 'recommend',
        title: `${tank.name} todavía no mide nivel`,
        detail: 'Agregaste un tanque. ¿Querés incorporar una sonda para medir su nivel? No se agrega sola.',
        action: 'add-probe',
        targetId: tank.id,
        quantity: 1,
      });
    }
    if ((requested > 0 || probes.length > 0) && tank.props.heightMm == null) {
      findings.push(status(`height:${tank.id}`, 'info', `${tank.name}: falta la altura útil. El precio de la sonda ya sale del tipo de comunicación.`, { objectId: tank.id }));
    }
    if (tank.props.heightMm != null && (requested > 0 || probes.length > 0)) {
      const choice = probeChoice(tank, settings, products);
      findings.push(status(`probe-fit:${tank.id}`, choice.productRole ? 'compatible' : 'pending', `${tank.name}: ${choice.message}`, { objectId: tank.id }));
    }
    if (tank.props.capacityLiters == null) {
      findings.push(status(`volume:${tank.id}`, 'info', `${tank.name}: la capacidad en litros está vacía. No hace falta para dibujarlo, pero la cotización la va a mostrar como dato pendiente.`, { objectId: tank.id }));
    }
    if (tank.kind === 'tank-vertical' && tank.props.comms === 'wireless-solar') {
      findings.push(status(`radio:${tank.id}`, 'pending', `${tank.name} usa radio. El módulo inalámbrico ya está incluido en la sonda (USD 850). La cobertura queda pendiente de campo.`, { objectId: tank.id }));
    }
    if ((tank.props.comms === 'wireless' || tank.props.comms === 'wireless-solar') && tank.kind === 'tank-vertical') {
      findings.push(status(`coverage:${tank.id}`, 'pending', `${tank.name}: la distancia de radio queda pendiente de una evaluación de cobertura.`, { objectId: tank.id }));
    }
  });

  const needMeasure = measuredTanks(scene);
  const consoles = scene.objects.filter((object) => object.role === 'console-telemetry');
  const consoleRole = resolveRole('console-telemetry', settings, products);
  if (needMeasure.length > 0) {
    if (consoleRole.capacity == null) {
      if (consoles.length === 0) {
        pushSuggestion({
          id: 'console-missing',
          tone: 'warning',
          title: 'Consola sin capacidad publicada',
          detail: 'Hay tanques para medir, pero la ficha vinculada no informa cuántos admite. Podés agregar la consola y el cupo queda pendiente de verificación. No se inventa un módulo de expansión.',
          action: 'add-console',
          quantity: 1,
        });
      } else {
        findings.push(status('console-capacity', 'pending', 'La consola de telemedición no tiene un máximo de tanques legible en la ficha. No se calcula si alcanza.'));
      }
    } else {
      const needed = Math.ceil(needMeasure.length / consoleRole.capacity);
      const missing = needed - consoles.length;
      if (missing > 0) {
        pushSuggestion({
          id: 'console-capacity',
          tone: 'recommend',
          title: consoles.length === 0
            ? (missing === 1 ? 'Hace falta una consola de telemedición' : `Hacen falta ${missing} consolas de telemedición`)
            : (missing === 1 ? 'Hace falta otra consola de telemedición' : `Hacen falta ${missing} consolas de telemedición`),
          detail: `Hay ${needMeasure.length} tanques a medir y la ficha admite ${consoleRole.capacity} por consola. No hay un expansor publicado, así que la cuenta es de consolas completas. Se agregan solo si lo confirmás.`,
          action: 'add-console',
          quantity: missing,
        });
      } else {
        findings.push(status('console-ok', 'compatible', `${consoles.length} consola(s) cubren ${needMeasure.length} tanques según el máximo de ${consoleRole.capacity} publicado en la ficha.`));
      }
    }
  }

  dispensers(scene).forEach((pump) => {
    const linked = scene.connections.some((connection) => connection.type === 'process' && (connection.fromId === pump.id || connection.toId === pump.id));
    const outletLinked = (pump.props.outlets ?? []).some((outlet) => outlet.tankId);
    if (!linked && !outletLinked) {
      pushSuggestion({
        id: `origin:${pump.id}`,
        tone: 'warning',
        title: `${pump.name} no tiene tanque de origen`,
        detail: 'Este surtidor todavía no tiene asignado un tanque de origen. Podés elegirlo en el panel o trazar un vínculo de abastecimiento.',
        action: 'none',
        targetId: pump.id,
      });
    }
    if (pump.props.needsControl === true) {
      findings.push(status(`control:${pump.id}`, 'info', `${pump.name} pide control de despacho. La cantidad de controladores sale de las mangueras y de la ficha, no de una unidad por pico.`, { objectId: pump.id }));
    }
    if (!pump.props.protocol?.trim() && pump.props.needsControl === true) {
      pushSuggestion({
        id: `protocol:${pump.id}`,
        tone: 'warning',
        title: `${pump.name}: protocolo sin confirmar`,
        detail: 'Este controlador requiere verificar compatibilidad con el protocolo del surtidor. Cargá el protocolo si lo conocés. Si no está en la ficha, la conexión queda pendiente, no incompatible.',
        action: 'none',
        targetId: pump.id,
      });
    }
    if (pump.props.needsRfid === true) {
      const hasFleet = scene.objects.some((object) => object.role === 'fleet');
      const hasRfid = scene.objects.some((object) => object.role === 'rfid-rlcd');
      if (!hasFleet) {
        pushSuggestion({
          id: `fleet:${pump.id}`,
          tone: 'recommend',
          title: 'Gestión de flota del catálogo',
          detail: 'Pediste identificación en el surtidor. El catálogo tiene un sistema de flotas RFID/NFC/QR con precio publicado. No es lo mismo que una terminal RLCD: son ítems distintos.',
          action: 'add-fleet',
          targetId: pump.id,
          quantity: 1,
        });
      }
      if (!hasRfid) {
        pushSuggestion({
          id: `rfid:${pump.id}`,
          tone: 'info',
          title: 'Terminal RFID RLCD sin precio',
          detail: 'La terminal con display RLCD no está publicada en el catálogo. Si la agregás, entra como A COTIZAR. No se descuenta del sistema de flotas.',
          action: 'add-rfid',
          targetId: pump.id,
          quantity: 1,
        });
      }
    }
  });

  const controlled = dispensers(scene).filter((pump) => pump.props.needsControl === true);
  const controllers = scene.objects.filter((object) => object.role === 'dispenser-controller');
  if (controlled.length > 0) {
    const controllerRole = resolveRole('dispenser-controller', settings, products);
    const unknownHoses = controlled.some((pump) => pump.props.hoseCount == null);
    const hoses = controlled.reduce((sum, pump) => sum + (pump.props.hoseCount ?? 0), 0);
    if (unknownHoses || controllerRole.capacity == null) {
      if (controllers.length === 0) {
        pushSuggestion({
          id: 'controller-unknown',
          tone: 'warning',
          title: 'Controlador pendiente de dimensionar',
          detail: controllerRole.capacity == null
            ? 'Hay surtidores con control de despacho, pero la ficha del controlador no publica un máximo de mangueras. No se calcula una cantidad.'
            : 'Falta la cantidad de mangueras de al menos un surtidor. Sin ese dato no se calcula cuántos controladores hacen falta.',
          action: 'add-controller',
          quantity: 1,
        });
      }
      findings.push(status('controller-pending', 'pending', 'El control de surtidores queda pendiente hasta tener mangueras y capacidad publicada.'));
    } else {
      const needed = Math.ceil(hoses / controllerRole.capacity);
      const missing = needed - controllers.length;
      if (missing > 0) {
        pushSuggestion({
          id: 'controller-capacity',
          tone: 'recommend',
          title: controllers.length === 0
            ? (missing === 1 ? 'Hace falta un controlador de surtidores' : `Hacen falta ${missing} controladores`)
            : (missing === 1 ? 'Hace falta un controlador más' : `Hacen falta ${missing} controladores`),
          detail: `Hay ${hoses} mangueras en surtidores con control y la ficha admite ${controllerRole.capacity} por equipo. No se propone un controlador por manguera.`,
          action: 'add-controller',
          quantity: missing,
        });
      } else {
        findings.push(status('controller-ok', 'compatible', `${controllers.length} controlador(es) cubren ${hoses} mangueras según el máximo de ${controllerRole.capacity} de la ficha.`));
      }
    }
  }

  const leakSensors = scene.objects.filter((object) => object.role === 'leak-liquid' || object.role === 'leak-gas');
  const leakConsoles = scene.objects.filter((object) => object.role === 'leak-console');
  if (leakSensors.length > 0) {
    const leakRole = resolveRole('leak-console', settings, products);
    const sensorQty = leakSensors.reduce((sum, sensor) => sum + sensor.quantity, 0);
    if (leakRole.capacity == null) {
      findings.push(status('leak-capacity', 'pending', 'Hay sensores de fuga y la consola vinculada no publica un máximo de sensores.'));
      if (leakConsoles.length === 0) {
        pushSuggestion({
          id: 'leak-console',
          tone: 'recommend',
          title: 'Consola de fugas sin cupo publicado',
          detail: 'Podés agregar la consola de monitoreo de fugas del catálogo. Como la ficha no informa el máximo, no se afirma que alcance para todos los sensores.',
          action: 'add-leak-console',
          quantity: 1,
        });
      }
    } else {
      const needed = Math.ceil(sensorQty / leakRole.capacity);
      const missing = needed - leakConsoles.length;
      if (missing > 0) {
        pushSuggestion({
          id: 'leak-console',
          tone: 'recommend',
          title: 'Consola para los sensores de fuga',
          detail: `Hay ${sensorQty} sensor(es) y la ficha admite ${leakRole.capacity}. Se proponen ${missing} consola(s) de fugas, no la de telemedición.`,
          action: 'add-leak-console',
          quantity: missing,
        });
      }
    }
  }

  if (scene.objects.some((object) => object.role === 'overflow')) {
    findings.push(status('overflow', 'pending', 'La alarma de sobrellenado no tiene ficha ni canales publicados. Entra a la cotización como A COTIZAR.'));
  }

  const noDispenser = !scene.objects.some((object) => object.role === 'dispenser' || object.role === 'loading-point');
  const hasPump = scene.objects.some((object) => object.role === 'fuel-pump');
  const hasMeter = scene.objects.some((object) => object.role === 'mechanical-meter');
  if (noDispenser && hasPump && !hasMeter) {
    pushSuggestion({
      id: 'aforador',
      tone: 'info',
      title: 'Sin surtidor, un aforador cuenta los litros',
      detail: 'Podés agregar un aforador mecánico y vincularlo al tarjetero. El display muestra los litros. Es equipo del cliente y no se cotiza.',
      action: 'none',
    });
  }

  const office = scene.objects.find((object) => object.role === 'office');
  if (office && (office.props.wifi === true || office.props.internet === true)) {
    const hasCloud = scene.objects.some((object) => object.role === 'cloud-platform');
    if (!hasCloud) {
      pushSuggestion({
        id: 'cloud',
        tone: 'info',
        title: 'La oficina tiene conectividad',
        detail: 'Tu instalación dispone de Wi-Fi o internet. Podemos evaluar la conexión con la plataforma cloud. El servicio no tiene precio publicado y no se agrega hasta que lo confirmes.',
        action: 'add-cloud',
        targetId: office.id,
        quantity: 1,
      });
    }
  }

  scene.connections.forEach((connection) => {
    findings.push(assessConnection(connection, scene, settings, products));
  });

  return { findings, suggestions };
}

export function connectionReports(scene: SceneState, settings: TechnicalSettings, products: Product[]) {
  const reports = new Map<string, Finding>();
  scene.connections.forEach((connection) => {
    reports.set(connection.id, assessConnection(connection, scene, settings, products));
  });
  return reports;
}
