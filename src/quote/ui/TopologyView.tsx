import { deviceLabel } from '../library';
import { CONNECTION_LABELS } from '../scene/InstallationCanvas';
import { CONNECTION_COLORS } from '../scene/models';
import type { SceneConnection, SceneState } from '../types';

function nameOf(scene: SceneState, id: string) {
  const object = scene.objects.find((item) => item.id === id);
  return object ? deviceLabel(object, scene) : id;
}

function NodeButton({
  active,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={`w-full max-w-xs text-left px-4 py-3 rounded-2xl bg-white border ${active ? 'border-sky-500 ring-2 ring-sky-200 shadow-sm' : 'border-slate-200 hover:border-sky-300'}`}>
      <strong className="block text-sm">{title}</strong>
      {subtitle && <span className="block text-[11px] text-gray-500">{subtitle}</span>}
    </button>
  );
}

function LinkButton({ connection, scene, active, onClick }: { connection: SceneConnection; scene: SceneState; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 ${active ? 'text-red-700' : 'text-gray-500 hover:text-[#011832]'}`}>
      <i className="inline-block w-4 h-0.5 mr-1 align-middle" style={{ background: CONNECTION_COLORS[connection.type] }} />
      ↓ {CONNECTION_LABELS[connection.type]}
      <span className="sr-only">{nameOf(scene, connection.fromId)} {nameOf(scene, connection.toId)}</span>
    </button>
  );
}

export default function TopologyView({
  scene,
  selectedId,
  selectedConnectionId,
  onSelect,
  onSelectConnection,
}: {
  scene: SceneState;
  selectedId: string | null;
  selectedConnectionId: string | null;
  onSelect: (id: string) => void;
  onSelectConnection: (id: string) => void;
}) {
  const tanks = scene.objects.filter((object) => object.role === 'tank');
  const dispensers = scene.objects.filter((object) => object.role === 'dispenser' || object.role === 'loading-point');
  const consoles = scene.objects.filter((object) => object.role === 'console-telemetry' || object.role === 'leak-console');
  const clouds = scene.objects.filter((object) => object.kind === 'cloud' || object.role === 'cloud');
  const fuel = scene.connections.filter((connection) => connection.type === 'process');
  const data = scene.connections.filter((connection) => connection.type !== 'process');

  if (scene.objects.length === 0) {
    return <div className="h-full grid place-items-center text-sm text-gray-500 bg-[#e7edf2]">Agregá un equipo para ver cómo se relaciona.</div>;
  }

  return (
    <div className="h-full overflow-auto bg-[#e7edf2] text-[#011832] p-6">
      <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest">Combustible</h2>
          <p className="text-[11px] text-gray-500 mt-1 mb-4">Asociaciones de producto. No representa una cañería verificada.</p>
          <div className="space-y-5">
            {tanks.map((tank) => {
              const links = fuel.filter((connection) => connection.fromId === tank.id || connection.toId === tank.id);
              return (
                <div key={tank.id} className="flex flex-col items-start gap-1">
                  <NodeButton active={selectedId === tank.id} title={deviceLabel(tank, scene)} subtitle={tank.props.product || 'Producto sin indicar'} onClick={() => onSelect(tank.id)} />
                  {links.map((connection) => {
                    const other = connection.fromId === tank.id ? connection.toId : connection.fromId;
                    const hose = connection.hoseIndex != null ? `Manguera ${connection.hoseIndex + 1}` : '';
                    return (
                      <div key={connection.id} className="flex flex-col items-start pl-4">
                        <LinkButton connection={connection} scene={scene} active={selectedConnectionId === connection.id} onClick={() => onSelectConnection(connection.id)} />
                        <NodeButton active={selectedId === other} title={nameOf(scene, other)} subtitle={hose || 'Abastecimiento'} onClick={() => onSelect(other)} />
                      </div>
                    );
                  })}
                  {links.length === 0 && <p className="text-[11px] text-amber-700 pl-1">Sin surtidor asociado</p>}
                </div>
              );
            })}
            {dispensers.filter((pump) => !fuel.some((connection) => connection.fromId === pump.id || connection.toId === pump.id)).map((pump) => (
              <NodeButton key={pump.id} active={selectedId === pump.id} title={deviceLabel(pump, scene)} subtitle="Sin tanque de origen" onClick={() => onSelect(pump.id)} />
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest">Comunicaciones</h2>
          <p className="text-[11px] text-gray-500 mt-1 mb-4">La misma configuración de la playa. No es telemetría en vivo.</p>
          <div className="space-y-6">
            {consoles.map((consoleObject) => {
              const links = data.filter((connection) => connection.fromId === consoleObject.id || connection.toId === consoleObject.id);
              const sensors = links.filter((connection) => {
                const other = scene.objects.find((item) => item.id === (connection.fromId === consoleObject.id ? connection.toId : connection.fromId));
                return other?.role === 'probe' || other?.role === 'tank';
              });
              const cloudLinks = links.filter((connection) => connection.type === 'cloud' || clouds.some((cloud) => cloud.id === connection.fromId || cloud.id === connection.toId));
              return (
                <div key={consoleObject.id} className="flex flex-col items-start gap-1">
                  <NodeButton active={selectedId === consoleObject.id} title={deviceLabel(consoleObject, scene)} subtitle={`${sensors.length} canal${sensors.length === 1 ? '' : 'es'}`} onClick={() => onSelect(consoleObject.id)} />
                  {sensors.map((connection) => {
                    const other = connection.fromId === consoleObject.id ? connection.toId : connection.fromId;
                    return (
                      <div key={connection.id} className="flex flex-col items-start pl-4">
                        <LinkButton connection={connection} scene={scene} active={selectedConnectionId === connection.id} onClick={() => onSelectConnection(connection.id)} />
                        <NodeButton active={selectedId === other} title={nameOf(scene, other)} subtitle="Mide el nivel" onClick={() => onSelect(other)} />
                      </div>
                    );
                  })}
                  {cloudLinks.map((connection) => {
                    const other = connection.fromId === consoleObject.id ? connection.toId : connection.fromId;
                    return (
                      <div key={connection.id} className="flex flex-col items-start pl-4">
                        <LinkButton connection={connection} scene={scene} active={selectedConnectionId === connection.id} onClick={() => onSelectConnection(connection.id)} />
                        <NodeButton active={selectedId === other} title={nameOf(scene, other)} subtitle="Consulta remota" onClick={() => onSelect(other)} />
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {tanks.filter((tank) => {
              const probe = scene.objects.find((item) => item.role === 'probe' && item.attachedTo === tank.id);
              if (!probe) return true;
              return !data.some((connection) => connection.fromId === probe.id || connection.toId === probe.id || connection.fromId === tank.id || connection.toId === tank.id);
            }).map((tank) => (
              <NodeButton key={`pending-${tank.id}`} active={selectedId === tank.id} title={deviceLabel(tank, scene)} subtitle={scene.objects.some((item) => item.role === 'probe' && item.attachedTo === tank.id) ? 'Sonda sin consola' : 'Sin sonda'} onClick={() => onSelect(tank.id)} />
            ))}
            {consoles.length === 0 && clouds.map((cloud) => (
              <NodeButton key={cloud.id} active={selectedId === cloud.id} title={deviceLabel(cloud, scene)} subtitle="Sin consola de origen" onClick={() => onSelect(cloud.id)} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
