import { deviceLabel } from '../library';
import { probeVisual } from '../scene/logic';
import { CONNECTION_LABELS } from '../scene/InstallationCanvas';
import type { ConnectionType, Finding, SceneObject, SceneState } from '../types';

const DATA = new Set<ConnectionType>(['sensor', 'wireless', 'rs485', 'ethernet', 'wifi', 'cloud']);

function nameOf(scene: SceneState, id: string | null | undefined) {
  if (!id) return '—';
  const object = scene.objects.find((item) => item.id === id);
  return object ? deviceLabel(object, scene) : '—';
}

function dataLink(scene: SceneState, ids: string[]) {
  const set = new Set(ids);
  return scene.connections.find((connection) => DATA.has(connection.type) && (set.has(connection.fromId) || set.has(connection.toId)));
}

export default function InspectCard({
  object,
  scene,
  findings,
  readOnly,
  onEdit,
  onConnections,
  onFocus,
  onInstallProbe,
  onConnect,
  onChooseConsole,
  onAskConsole,
  onChangeObject,
}: {
  object: SceneObject;
  scene: SceneState;
  findings: Finding[];
  readOnly: boolean;
  onEdit: () => void;
  onConnections: () => void;
  onFocus: () => void;
  onInstallProbe: () => void;
  onConnect: () => void;
  onChooseConsole: () => void;
  onAskConsole: () => void;
  onChangeObject: (next: SceneObject) => void;
}) {
  const tanks = scene.objects.filter((item) => item.role === 'tank');
  const lines: { label: string; value: string }[] = [];
  let guide: { text: string; primary?: string; secondary?: string } | null = null;
  let status = 'Sin configurar';

  if (object.role === 'tank') {
    const visual = probeVisual(scene, object.id);
    const probe = scene.objects.find((item) => item.role === 'probe' && item.attachedTo === object.id);
    const link = dataLink(scene, [object.id, probe?.id ?? '']);
    const otherId = link ? (link.fromId === object.id || link.fromId === probe?.id ? link.toId : link.fromId) : null;
    const finding = link ? findings.find((item) => item.connectionId === link.id) : undefined;
    const supplied = scene.connections.filter((connection) => connection.type === 'process' && (connection.fromId === object.id || connection.toId === object.id));
    lines.push({ label: 'Capacidad', value: object.props.capacityLiters ? `${object.props.capacityLiters.toLocaleString('es-AR')} litros` : 'Sin indicar' });
    lines.push({ label: 'Sonda', value: visual === 'none' ? 'No instalada' : 'Instalada' });
    lines.push({ label: 'Comunicación', value: link ? CONNECTION_LABELS[link.type] : object.props.comms === 'wireless' || object.props.comms === 'wireless-solar' ? 'Inalámbrica, sin enlace' : 'Sin enlace' });
    lines.push({ label: 'Consola', value: otherId ? nameOf(scene, otherId) : 'Ninguna' });
    lines.push({ label: 'Abastece', value: supplied.length ? supplied.map((connection) => nameOf(scene, connection.fromId === object.id ? connection.toId : connection.fromId)).join(', ') : 'Sin asociación' });
    if (visual === 'none') {
      status = 'Sin sonda';
      guide = { text: 'Este tanque todavía no tiene sonda. Agregá una para medir el nivel.', primary: 'Agregar sonda' };
    } else if (visual === 'unlinked') {
      status = 'Falta conectar';
      const hasConsole = scene.objects.some((item) => item.role === 'console-telemetry');
      guide = {
        text: 'Ahora conectala a una consola.',
        primary: 'Conectar',
        secondary: hasConsole ? 'Elegir consola' : 'Agregar consola compatible',
      };
    } else if (finding?.status === 'incompatible') status = 'Incompatibilidad';
    else if (finding?.status === 'compatible') {
      status = 'Configuración completa';
      guide = { text: 'Todo listo: esta parte ya está configurada.' };
    } else status = 'Pendiente de verificación';
  } else if (object.role === 'dispenser' || object.role === 'loading-point') {
    const control = scene.connections.find((connection) => connection.type === 'dispenser-control' && (connection.fromId === object.id || connection.toId === object.id));
    lines.push({ label: 'Mangueras', value: String(object.props.hoseCount ?? object.props.outlets?.length ?? 0) });
    lines.push({ label: 'Controlador', value: control ? nameOf(scene, control.fromId === object.id ? control.toId : control.fromId) : 'Sin controlador' });
    lines.push({ label: 'Comunicación', value: control ? 'Control configurado' : object.props.needsControl ? 'Pediste control y todavía no está' : 'Sin control' });
    const missingOrigin = (object.props.outlets ?? []).length === 0 || (object.props.outlets ?? []).some((outlet) => !outlet.tankId);
    status = missingOrigin ? 'Sin origen' : control ? 'Control asociado' : 'Mangueras asignadas';
    if (missingOrigin) guide = { text: 'Este surtidor todavía no tiene origen. Elegí el tanque de cada manguera.' };
  } else if (object.role === 'console-telemetry' || object.role === 'leak-console') {
    const links = scene.connections.filter((connection) => (connection.type === 'sensor' || connection.type === 'wireless' || connection.type === 'rs485' || connection.type === 'alarm') && (connection.fromId === object.id || connection.toId === object.id));
    const linkedIds = new Set(links.flatMap((connection) => [connection.fromId, connection.toId]));
    const pending = scene.objects.filter((item) => item.role === 'probe' && !linkedIds.has(item.id));
    lines.push({ label: 'Canales usados', value: String(links.length) });
    lines.push({ label: 'Sondas conectadas', value: links.length ? links.map((connection) => nameOf(scene, connection.fromId === object.id ? connection.toId : connection.fromId)).join(', ') : 'Ninguna' });
    lines.push({ label: 'Sensores pendientes', value: pending.length ? pending.map((item) => nameOf(scene, item.id)).join(', ') : 'Ninguno' });
    status = links.length ? 'Supervisa esas sondas' : 'Sin sondas';
  } else {
    const links = scene.connections.filter((connection) => connection.fromId === object.id || connection.toId === object.id);
    lines.push({ label: 'Vínculos', value: links.length ? String(links.length) : 'Ninguno' });
    status = links.length ? 'Con relaciones' : 'Sin configurar';
  }

  const title = object.role === 'tank'
    ? `${deviceLabel(object, scene)}${object.props.product ? ` — ${object.props.product}` : ''}`
    : deviceLabel(object, scene);

  return (
    <div className="absolute left-3 top-3 z-10 w-72 rounded-2xl bg-white/95 border border-sky-100 shadow-lg p-3 text-[#011832]">
      <p className="text-sm font-bold">{title}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{status}. No indica comunicación en vivo.</p>
      <dl className="mt-2 space-y-1">
        {lines.map((line) => (
          <div key={line.label} className="flex justify-between gap-3 text-[11px]">
            <dt className="text-gray-500">{line.label}</dt>
            <dd className="text-right font-medium">{line.value}</dd>
          </div>
        ))}
      </dl>
      {(object.role === 'dispenser' || object.role === 'loading-point') && (object.props.outlets?.length ?? 0) > 0 && (
        <div className="mt-2 space-y-1">
          {object.props.outlets?.map((outlet, index) => (
            <label key={`${object.id}-${index}`} className="flex items-center justify-between gap-2 text-[11px]">
              <span>M{index + 1}{outlet.product ? ` · ${outlet.product}` : ''}</span>
              <select
                className="border border-gray-200 bg-white px-1 py-0.5 max-w-[9rem]"
                value={outlet.tankId ?? ''}
                disabled={readOnly}
                onChange={(event) => {
                  const outlets = [...(object.props.outlets ?? [])];
                  outlets[index] = { ...outlets[index], tankId: event.target.value || null };
                  onChangeObject({ ...object, props: { ...object.props, outlets } });
                }}
              >
                <option value="">Sin tanque</option>
                {tanks.map((tank) => <option key={tank.id} value={tank.id}>{deviceLabel(tank, scene)}{tank.props.product ? ` · ${tank.props.product}` : ''}</option>)}
              </select>
            </label>
          ))}
        </div>
      )}
      {guide && (
        <div className={`mt-3 rounded-xl p-2 ${guide.text.startsWith('Todo listo') ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'}`}>
          <p className="text-[11px]">{guide.text}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {guide.primary && <button type="button" className="bg-[#011832] text-white text-[10px] font-bold uppercase px-2 py-1" disabled={readOnly} onClick={guide.primary === 'Agregar sonda' ? onInstallProbe : onConnect}>{guide.primary}</button>}
            {guide.secondary && (
              <button type="button" className="border border-gray-300 text-[10px] font-bold uppercase px-2 py-1" disabled={readOnly} onClick={guide.secondary === 'Elegir consola' ? onChooseConsole : onAskConsole}>
                {guide.secondary}
              </button>
            )}
          </div>
        </div>
      )}
      {status === 'Configuración completa' && object.role === 'tank' && <p className="mt-2 text-[11px] text-emerald-800">Este tanque ya tiene su sistema de telemedición configurado.</p>}
      <div className="flex flex-wrap gap-1 mt-3">
        <button type="button" className="border border-gray-200 text-[10px] font-bold uppercase px-2 py-1" onClick={onEdit}>Editar</button>
        <button type="button" className="border border-gray-200 text-[10px] font-bold uppercase px-2 py-1" onClick={onConnections}>Ver conexiones</button>
        <button type="button" className="border border-gray-200 text-[10px] font-bold uppercase px-2 py-1" onClick={onFocus}>Acercar</button>
      </div>
    </div>
  );
}
