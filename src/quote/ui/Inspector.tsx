import { useEffect, useState, type ReactNode } from 'react';
import { Copy, RotateCw, Trash2 } from 'lucide-react';
import { deviceLabel } from '../library';
import { CONNECTION_LABELS } from '../scene/InstallationCanvas';
import { probeVisual, withHoses } from '../scene/logic';
import { DISPENSER_BRANDS, FUEL_PRODUCTS, type ObjectProps, type SceneConnection, type SceneObject, type SceneState, type Suggestion } from '../types';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</span>
      {children}
    </label>
  );
}

const control = 'w-full px-2 py-2 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-red-600';

function TextField({ label, value, onCommit }: { label: string; value: string; onCommit: (value: string) => void }) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return (
    <Field label={label}>
      <input className={control} value={local} onChange={(event) => setLocal(event.target.value)} onBlur={() => onCommit(local)} />
    </Field>
  );
}

function NumberField({ label, value, onCommit, suffix }: { label: string; value: number | null | undefined; onCommit: (value: number | null) => void; suffix?: string }) {
  const [local, setLocal] = useState(value == null ? '' : String(value));
  useEffect(() => setLocal(value == null ? '' : String(value)), [value]);
  return (
    <Field label={suffix ? `${label} (${suffix})` : label}>
      <input
        className={control}
        inputMode="decimal"
        value={local}
        placeholder="Sin dato"
        onChange={(event) => setLocal(event.target.value)}
        onBlur={() => {
          const trimmed = local.trim();
          if (!trimmed) onCommit(null);
          else {
            const parsed = Number(trimmed.replace(',', '.'));
            onCommit(Number.isFinite(parsed) ? parsed : null);
          }
        }}
      />
    </Field>
  );
}

function Tri({ label, value, onChange }: { label: string; value: boolean | null | undefined; onChange: (value: boolean | null) => void }) {
  return (
    <Field label={label}>
      <select className={control} value={value == null ? '' : value ? 'yes' : 'no'} onChange={(event) => onChange(event.target.value === '' ? null : event.target.value === 'yes')}>
        <option value="">Sin dato</option>
        <option value="yes">Sí</option>
        <option value="no">No</option>
      </select>
    </Field>
  );
}

export default function Inspector({
  object,
  connection,
  connectionMessage,
  objects,
  scene,
  suggestions,
  readOnly,
  onChangeObject,
  onDelete,
  onDuplicate,
  onRotate,
  onInstall,
  onFocus,
  onStartLink,
  onDeleteConnection,
  onAccept,
  onDismiss,
}: {
  object: SceneObject | null;
  connection: SceneConnection | null;
  connectionMessage?: string;
  objects: SceneObject[];
  scene: SceneState;
  suggestions: Suggestion[];
  readOnly: boolean;
  onChangeObject: (object: SceneObject) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onRotate: () => void;
  onInstall: () => void;
  onFocus: () => void;
  onStartLink: () => void;
  onDeleteConnection: () => void;
  onAccept: (suggestion: Suggestion) => void;
  onDismiss: (id: string) => void;
}) {
  const [openDetail, setOpenDetail] = useState<string | null>(null);
  const patch = (props: ObjectProps) => {
    if (!object || readOnly) return;
    onChangeObject({ ...object, props: { ...object.props, ...props } });
  };
  const tanks = objects.filter((item) => item.role === 'tank');

  return (
    <aside className="w-full h-full overflow-y-auto bg-white border-l border-gray-200">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-semibold text-emerald-800">Datos de la pieza</p>
      </div>

      {suggestions.length > 0 && (
        <div className="p-3 space-y-2 border-b border-gray-100">
          {suggestions.slice(0, 4).map((suggestion) => (
            <article key={suggestion.id} className="border border-amber-200 bg-amber-50 p-3 rounded-sm">
              <p className="text-xs font-bold text-[#011832]">{suggestion.title}</p>
              {openDetail === suggestion.id && <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">{suggestion.detail}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {suggestion.action !== 'none' && !readOnly && (
                  <button type="button" className="text-[10px] font-bold uppercase tracking-widest bg-[#011832] text-white px-2 py-1" onClick={() => onAccept(suggestion)}>Aceptar</button>
                )}
                <button type="button" className="text-[10px] font-bold uppercase tracking-widest border border-gray-300 px-2 py-1" onClick={() => setOpenDetail(openDetail === suggestion.id ? null : suggestion.id)}>Detalle</button>
                {!readOnly && (
                  <button type="button" className="text-[10px] font-bold uppercase tracking-widest text-gray-500 px-2 py-1" onClick={() => onDismiss(suggestion.id)}>Rechazar</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {!object && !connection && (
        <p className="p-4 text-sm text-stone-600">Elegí una pieza de la playa. Acá vas a ver qué le falta y cómo completarla.</p>
      )}

      {connection && (
        <div className="p-4">
          <h3 className="font-bold text-[#011832]">{CONNECTION_LABELS[connection.type]}</h3>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">{connectionMessage}</p>
          <p className="text-[11px] text-gray-400 mt-2">Este vínculo no cambia el precio por sí mismo. El precio sale del catálogo de los equipos comerciales.</p>
          {!readOnly && (
            <button type="button" className="mt-4 text-xs font-bold uppercase tracking-widest text-red-600" onClick={onDeleteConnection}>Quitar conexión</button>
          )}
        </div>
      )}

      {object && (
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="font-bold text-[#011832]">{deviceLabel(object, { objects })}</h3>
              <p className="text-[10px] uppercase tracking-widest text-gray-400">{object.role}</p>
            </div>
            {!readOnly && (
              <div className="flex gap-1">
                <button type="button" title="Rotar" className="p-2 border border-gray-200" onClick={onRotate}><RotateCw className="w-3.5 h-3.5" /></button>
                <button type="button" title="Duplicar" className="p-2 border border-gray-200" onClick={onDuplicate}><Copy className="w-3.5 h-3.5" /></button>
                <button type="button" title="Eliminar" className="p-2 border border-red-200 text-red-600" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>

          <TextField label="Nombre" value={object.name} onCommit={(name) => onChangeObject({ ...object, name: name.slice(0, 48) || object.name })} />
          {object.role === 'tank' && (
            <div className="mb-3 text-xs leading-relaxed text-gray-600">
              <p>Sonda: {probeVisual(scene, object.id) === 'none' ? 'sin instalar' : probeVisual(scene, object.id) === 'linked' ? 'instalada y conectada' : 'instalada, sin comunicación'}</p>
              <p className="mt-1">Al instalar la sonda aparecen los nodos: ámbar hacia la consola, o antena y panel si es inalámbrica, y azul hacia cada surtidor.</p>
              {!readOnly && probeVisual(scene, object.id) === 'none' && (
                <button type="button" className="mt-2 w-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest py-2" onClick={onInstall}>Instalar sonda</button>
              )}
            </div>
          )}
          {object.role === 'probe' && (
            <p className="mb-3 text-xs text-gray-600">Instalada en {deviceLabel(objects.find((item) => item.id === object.attachedTo) ?? { name: 'ningún tanque', kind: 'note', role: 'note' }, { objects })}.</p>
          )}

          {(object.role === 'tank') && (
            <>
              <NumberField label="Capacidad" suffix="litros" value={object.props.capacityLiters} onCommit={(capacityLiters) => patch({ capacityLiters })} />
              <NumberField label="Altura útil" suffix="mm" value={object.props.heightMm} onCommit={(heightMm) => patch({ heightMm })} />
              {object.props.capacityLiters != null && object.props.heightMm == null && (
                <p className="text-[11px] text-amber-700 mb-3">Falta la altura. No la vamos a estimar para elegir la sonda.</p>
              )}
              {object.kind === 'tank-vertical' && (
                <NumberField label="Diámetro" suffix="mm, opcional" value={object.props.diameterMm} onCommit={(diameterMm) => patch({ diameterMm })} />
              )}
              <Field label="Producto almacenado">
                <select className={control} value={object.props.product ?? ''} onChange={(event) => patch({ product: event.target.value })}>
                  <option value="">Sin definir</option>
                  {FUEL_PRODUCTS.map((product) => <option key={product}>{product}</option>)}
                </select>
              </Field>
              {object.props.product === 'Producto personalizado' && (
                <TextField label="Producto" value={object.props.customProduct ?? ''} onCommit={(customProduct) => patch({ customProduct })} />
              )}
              <Field label="Comunicación">
                <select className={control} value={object.props.comms ?? 'unset'} onChange={(event) => patch({ comms: event.target.value as ObjectProps['comms'] })}>
                  <option value="unset">Sin definir</option>
                  <option value="wired">Cableada</option>
                  <option value="wireless">Inalámbrica</option>
                  {object.kind === 'tank-vertical' && <option value="wireless-solar">Inalámbrica con alimentación solar</option>}
                </select>
              </Field>
              <NumberField label="Sondas pedidas" value={object.props.probeCount} onCommit={(probeCount) => patch({ probeCount })} />
              {object.kind === 'tank-vertical' && (
                <NumberField label="Distancia a la oficina" suffix="m" value={object.props.distanceToOfficeM} onCommit={(distanceToOfficeM) => patch({ distanceToOfficeM })} />
              )}
            </>
          )}

          {(object.role === 'dispenser' || object.role === 'loading-point') && (
            <>
              <Field label="Marca">
                <select className={control} value={object.props.brand ?? ''} onChange={(event) => patch({ brand: event.target.value })}>
                  <option value="">Sin definir</option>
                  {DISPENSER_BRANDS.map((brand) => <option key={brand}>{brand}</option>)}
                </select>
              </Field>
              <TextField label="Modelo" value={object.props.model ?? ''} onCommit={(model) => patch({ model })} />
              <NumberField label="Productos" value={object.props.productCount} onCommit={(productCount) => patch({ productCount: productCount == null ? null : Math.max(1, Math.min(8, Math.round(productCount))) })} />
              <NumberField label="Mangueras" value={object.props.hoseCount ?? object.props.outlets?.length ?? 2} onCommit={(hoseCount) => onChangeObject(withHoses(object, hoseCount ?? 2))} />
              <p className="text-[11px] text-gray-500 mb-3">El nodo naranja es la comunicación al controlador. Cada manguera tiene un nodo azul de succión.</p>
              <TextField label="Protocolo, si se conoce" value={object.props.protocol ?? ''} onCommit={(protocol) => patch({ protocol })} />
              <Tri label="¿Necesita control de despacho?" value={object.props.needsControl} onChange={(needsControl) => patch({ needsControl })} />
              <Tri label="¿Identificación RFID?" value={object.props.needsRfid} onChange={(needsRfid) => patch({ needsRfid })} />
              {(object.props.outlets ?? []).map((outlet, index) => (
                <div key={`${object.id}-outlet-${index}`} className="mb-3 border border-gray-100 p-2">
                  <Field label={`Producto ${index + 1}`}>
                    <select className={control} value={outlet.product} onChange={(event) => {
                      const outlets = [...(object.props.outlets ?? [])];
                      outlets[index] = { ...outlet, product: event.target.value };
                      patch({ outlets });
                    }}>
                      <option value="">Sin definir</option>
                      {FUEL_PRODUCTS.map((product) => <option key={product}>{product}</option>)}
                    </select>
                  </Field>
                  <Field label="Tanque de origen">
                    <select className={control} value={outlet.tankId ?? ''} onChange={(event) => {
                      const outlets = [...(object.props.outlets ?? [])];
                      outlets[index] = { ...outlet, tankId: event.target.value || null };
                      patch({ outlets });
                    }}>
                      <option value="">Sin asignar</option>
                      {tanks.map((tank) => <option key={tank.id} value={tank.id}>{deviceLabel(tank, { objects })}</option>)}
                    </select>
                  </Field>
                </div>
              ))}
            </>
          )}

          {object.role === 'dispenser-controller' && (
            <>
              <Tri label="Ethernet" value={object.props.ethernet} onChange={(ethernet) => patch({ ethernet })} />
              <Tri label="Wi-Fi" value={object.props.wifi} onChange={(wifi) => patch({ wifi })} />
              <p className="text-[11px] text-gray-500 mb-3">Con Wi-Fi en sí, el nodo de red pasa a cian. Si Ethernet también queda en sí, aparecen los dos. Los nodos naranjas son uno por surtidor.</p>
            </>
          )}

          {object.role === 'rfid-rlcd' && (
            <p className="text-[11px] text-gray-500 mb-3">PTO lo asocia al punto de carga. LTS lo vincula a un aforador para que el display cuente litros.</p>
          )}

          {(object.role === 'fuel-pump' || object.role === 'flow-meter' || object.role === 'mechanical-meter') && (
            <p className="text-[11px] text-gray-500 mb-3">
              {object.role === 'fuel-pump' && 'Equipo del cliente. IN succiona del tanque y OUT descarga hacia el caudalímetro, el aforador o el surtidor.'}
              {object.role === 'flow-meter' && 'Equipo del cliente. Los nodos azules son la entrada y la salida de combustible.'}
              {object.role === 'mechanical-meter' && 'Equipo del cliente. Si no hay surtidor, el nodo RFID lo vincula al tarjetero y el display cuenta los litros.'}
            </p>
          )}

          {object.role === 'office' && (
            <>
              <Tri label="Wi-Fi" value={object.props.wifi} onChange={(wifi) => patch({ wifi })} />
              <Tri label="Ethernet" value={object.props.ethernet} onChange={(ethernet) => patch({ ethernet })} />
              <Tri label="Internet" value={object.props.internet} onChange={(internet) => patch({ internet })} />
              <NumberField label="Distancia a tanques" suffix="m" value={object.props.distanceTanksM} onCommit={(distanceTanksM) => patch({ distanceTanksM })} />
              <NumberField label="Distancia a surtidores" suffix="m" value={object.props.distanceDispensersM} onCommit={(distanceDispensersM) => patch({ distanceDispensersM })} />
              <TextField label="Ubicación de la consola" value={object.props.consoleLocation ?? ''} onCommit={(consoleLocation) => patch({ consoleLocation })} />
              <Tri label="¿Necesita acceso remoto?" value={object.props.remoteAccess} onChange={(remoteAccess) => patch({ remoteAccess })} />
            </>
          )}

          {object.role !== 'tank' && object.role !== 'dispenser' && object.role !== 'loading-point' && object.role !== 'office' && object.role !== 'fuel-pump' && object.role !== 'flow-meter' && object.role !== 'mechanical-meter' && (
            <>
              <NumberField label="Cantidad" value={object.quantity} onCommit={(quantity) => onChangeObject({ ...object, quantity: quantity == null ? 1 : Math.max(1, Math.min(30, Math.round(quantity))) })} />
              <p className="text-[11px] text-gray-500 mb-3">El precio no se escribe acá. Sale de la ficha del catálogo vinculada a este rol. Si no hay ficha, queda A COTIZAR.</p>
              {object.role === 'custom-service' && (
                <TextField label="Descripción del servicio" value={object.props.notes ?? ''} onCommit={(notes) => patch({ notes })} />
              )}
            </>
          )}

          {!readOnly && (
            <div className="mt-4 border-t border-gray-100 pt-3 flex flex-col gap-2">
              <button type="button" className="w-full bg-[#011832] text-white text-[10px] font-bold uppercase tracking-widest py-2" onClick={onStartLink}>Conectar</button>
              <button type="button" className="w-full border border-gray-200 text-[10px] font-bold uppercase tracking-widest py-2" onClick={onFocus}>Centrar este equipo</button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
