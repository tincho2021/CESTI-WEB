import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { deviceLabel } from '../library';
import { isTransmitter, transmitterHost } from './logic';
import { CONNECTION_COLORS, ConnectionNodes, EquipmentModel, NameLabel, createAsphaltMap, createCorrugationMap, createGrassMap } from './models';
import { snap } from '../library';
import { probeVisual, visibleConnectionIds, type LayerFilter } from './logic';
import { endpoint, portsFor, type ScenePort } from './ports';
import type { ConnectionType, Finding, Kind, SceneConnection, SceneObject, SceneState } from '../types';

export const PLOT = { halfX: 36, halfZ: 24 };

export function insidePlot(x: number, z: number) {
  return Math.abs(x) <= PLOT.halfX - 0.6 && Math.abs(z) <= PLOT.halfZ - 0.6;
}

export const HITBOX: Record<string, [number, number, number, number]> = {
  'tank-underground': [3.8, 1.5, 2.1, 1.85],
  'tank-vertical': [1.9, 3.1, 1.9, 1.15],
  dispenser: [2.8, 2.8, 1.9, 1.55],
  'loading-point': [2.8, 2.8, 1.9, 1.55],
  office: [2.6, 2.3, 2, 1.45],
  console: [1.15, 1.5, 0.8, 0.75],
  controller: [1.15, 1.3, 0.7, 0.7],
};

export function frameExtents(objects: { x: number; z: number; kind: string }[]) {
  return objects.flatMap((object) => {
    const box = HITBOX[object.kind] ?? [1.4, 1, 1.4, 0.8];
    return [
      { x: object.x - box[0] / 2, z: object.z - box[2] / 2 },
      { x: object.x + box[0] / 2, z: object.z + box[2] / 2 },
    ];
  });
}

export interface SceneApi {
  capture: () => string;
  zoom: (factor: number) => void;
  rotateView: () => void;
  center: () => void;
  focus: (x: number, z: number) => void;
  frame: (points: { x: number; z: number }[]) => void;
}

interface ControlsLike {
  enabled: boolean;
  target: THREE.Vector3;
  object: THREE.Camera;
  update: () => void;
}

interface CanvasProps {
  scene: SceneState;
  selectedId: string | null;
  selectedConnectionId: string | null;
  armed: boolean;
  linkFrom: string | null;
  linkType: ConnectionType | null;
  linkIndex: number;
  layerFilter: LayerFilter;
  snapGrid: boolean;
  allowDrag: boolean;
  reports: Map<string, Finding>;
  apiRef: MutableRefObject<SceneApi | null>;
  onSelect: (id: string | null) => void;
  onSelectConnection: (id: string | null) => void;
  onDragStart: (id: string) => void;
  onMove: (id: string, x: number, z: number) => void;
  onMoveEnd: () => void;
  onPlace: (x: number, z: number) => void;
  onDropItem: (itemId: string, x: number, z: number) => void;
  onLinkTarget: (id: string) => void;
  onPort: (id: string, port: ScenePort) => void;
  focusId?: string | null;
  pinIds?: string[];
  litIds?: string[];
  hints?: Record<string, 'compatible' | 'pending' | 'blocked'>;
  connectMode?: boolean;
  pulseId?: string | null;
  ghostKind?: Kind | null;
  badges?: Record<string, { text: string; tone: string }>;
  onRotate?: (id: string, rotation: number) => void;
  actions?: {
    onMove: () => void;
    onRotate: () => void;
    onDuplicate: () => void;
    onRemove: () => void;
    onConnect: () => void;
    onEdit?: () => void;
  };
}

const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function worldOf(object: SceneObject, objects: SceneObject[]): [number, number] {
  if (object.attachedTo) {
    const parent = objects.find((item) => item.id === object.attachedTo);
    if (parent) return [parent.x, parent.z];
  }
  return [object.x, object.z];
}

function Draggable({
  object,
  scene,
  selected,
  showLabel,
  probeId,
  probe,
  linkFrom,
  snapGrid,
  allowDrag,
  onSelect,
  onDragStart,
  onMove,
  onMoveEnd,
  onLinkTarget,
  onPort,
  muted = false,
  hint = null,
  showPorts = false,
  tone = '#94a3b8',
  detail = '',
  showActions = false,
  onMoveTool,
  onRotateTool,
  onDuplicateTool,
  onRemoveTool,
  onConnectTool,
  onEditTool,
  onRotateLive,
}: {
  object: SceneObject;
  scene: SceneState;
  selected: boolean;
  showLabel: boolean;
  probeId: string | null;
  probe: ReturnType<typeof probeVisual>;
  linkFrom: string | null;
  snapGrid: boolean;
  allowDrag: boolean;
  onSelect: (id: string) => void;
  onDragStart: (id: string) => void;
  onMove: (id: string, x: number, z: number) => void;
  onMoveEnd: () => void;
  onLinkTarget: (id: string) => void;
  onPort: (id: string, port: ScenePort) => void;
  muted?: boolean;
  hint?: 'compatible' | 'pending' | 'blocked' | null;
  showPorts?: boolean;
  tone?: string;
  detail?: string;
  showActions?: boolean;
  onMoveTool?: () => void;
  onRotateTool?: () => void;
  onDuplicateTool?: () => void;
  onRemoveTool?: () => void;
  onConnectTool?: () => void;
  onEditTool?: () => void;
  onRotateLive?: (id: string, rotation: number) => void;
}) {
  const session = useRef<{
    mode: 'pending' | 'move' | 'rotate';
    armed: boolean;
    clientX: number;
    clientY: number;
    grabX: number;
    grabZ: number;
  } | null>(null);
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const { camera, gl, controls } = useThree();
  useLayoutEffect(() => {
    const root = groupRef.current;
    if (!root) return;
    root.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => {
        const tagged = material as THREE.Material & { userData: { baseOpacity?: number } };
        if (tagged.userData.baseOpacity == null) tagged.userData.baseOpacity = material.opacity;
        const base = tagged.userData.baseOpacity ?? 1;
        material.opacity = muted ? Math.min(base, 0.55) : base;
        material.transparent = muted || base < 1;
        material.needsUpdate = true;
      });
    });
  });
  const [x, z] = worldOf(object, scene.objects);
  const ports = portsFor(object, scene);
  const locked = Boolean(object.attachedTo);

  useEffect(() => {
    const element = gl.domElement;
    const pointFromEvent = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const hit = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(plane, hit)) return null;
      return hit;
    };
    const orbit = () => controls as unknown as ControlsLike | null;
    const handlePointerMove = (event: PointerEvent) => {
      const current = session.current;
      if (!current) return;
      const hit = pointFromEvent(event);
      if (!hit) return;
      if (current.mode === 'pending') {
        const travel = Math.hypot(event.clientX - current.clientX, event.clientY - current.clientY);
        if (travel < 8) return;
        current.mode = 'move';
        current.armed = true;
        onDragStart(object.id);
      }
      if (current.mode === 'rotate') {
        if (!current.armed) {
          current.armed = true;
          onDragStart(object.id);
        }
        const angle = Math.atan2(hit.x - x, hit.z - z);
        const stepped = Math.round(angle / (Math.PI / 2)) * (Math.PI / 2);
        onRotateLive?.(object.id, stepped);
        return;
      }
      const nextX = THREE.MathUtils.clamp((snapGrid ? snap(hit.x - current.grabX) : hit.x - current.grabX), -PLOT.halfX, PLOT.halfX);
      const nextZ = THREE.MathUtils.clamp((snapGrid ? snap(hit.z - current.grabZ) : hit.z - current.grabZ), -PLOT.halfZ, PLOT.halfZ);
      onMove(object.id, nextX, nextZ);
    };
    const onUp = () => {
      const current = session.current;
      session.current = null;
      const orbitControls = orbit();
      if (orbitControls) orbitControls.enabled = true;
      if (current?.armed) onMoveEnd();
    };
    element.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      element.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [camera, controls, gl, object.id, onDragStart, onMove, onMoveEnd, onRotateLive, snapGrid, x, z]);

  const ring = hint === 'compatible' ? '#16a34a' : hint === 'pending' ? '#eab308' : null;
  const [boxW, boxH, boxD, footprint] = HITBOX[object.kind] ?? [1.3, 1.3, 1.3, 0.8];
  const beginSession = (event: { clientX: number; clientY: number; stopPropagation: () => void }, mode: 'pending' | 'rotate') => {
    if (locked || linkFrom || !allowDrag) return;
    event.stopPropagation();
    const orbit = controls as unknown as ControlsLike | null;
    if (orbit) orbit.enabled = false;
    const rect = gl.domElement.getBoundingClientRect();
    const pointer = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, camera);
    const hit = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, hit);
    session.current = {
      mode,
      armed: false,
      clientX: event.clientX,
      clientY: event.clientY,
      grabX: hit.x - x,
      grabZ: hit.z - z,
    };
  };
  return (
    <group
      ref={groupRef}
      position={[x, 0, z]}
      rotation={[0, object.rotation, 0]}
      onClick={(event) => {
        event.stopPropagation();
        if (linkFrom && linkFrom !== object.id) onLinkTarget(object.id);
        else onSelect(object.id);
      }}
      onPointerOver={(event) => { event.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = ''; }}
      onPointerDown={(event) => beginSession(event, 'pending')}
    >
      {!showPorts && (
        <mesh position={[0, boxH / 2, 0]}>
          <boxGeometry args={[boxW, boxH, boxD]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
      {(selected || hovered) && !linkFrom && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
          <ringGeometry args={[footprint, footprint + (selected ? 0.1 : 0.05), 48]} />
          <meshBasicMaterial color={selected ? '#34d399' : '#bbf7d0'} transparent opacity={selected ? 0.95 : 0.7} />
        </mesh>
      )}
      {selected && allowDrag && !linkFrom && onRotateLive && (
        <group position={[0, 0.22, footprint + 0.15]} onPointerDown={(event) => beginSession(event, 'rotate')}>
          <mesh position={[0, 0, 0.28]}>
            <sphereGeometry args={[0.16, 18, 18]} />
            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.35} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.12]}>
            <cylinderGeometry args={[0.03, 0.03, 0.28, 8]} />
            <meshStandardMaterial color="#f59e0b" />
          </mesh>
        </group>
      )}
      <EquipmentModel
        object={object}
        selected={selected}
        showLabel={showLabel}
        probe={probe}
        onSelectProbe={probeId ? () => onSelect(probeId) : undefined}
        tone={tone}
        detail={detail}
      />
      {ring && (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
            <ringGeometry args={[1.65, 1.82, 48]} />
            <meshBasicMaterial color={ring} />
          </mesh>
          <mesh position={[0, 2.15, 0]}>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshBasicMaterial color={ring} />
          </mesh>
        </group>
      )}
      {showPorts && <ConnectionNodes ports={ports} active={linkFrom === object.id} named={selected || linkFrom === object.id} onPick={(port) => onPort(object.id, port)} />}
      {showActions && onMoveTool && onRotateTool && onDuplicateTool && onRemoveTool && onConnectTool && (
        <Html position={[1.7, 1.35, 0]} center zIndexRange={[40, 0]} style={{ pointerEvents: 'auto' }}>
          <div className="flex gap-1 rounded-full bg-[#fffaf3]/95 p-1 shadow-lg ring-1 ring-emerald-100" onPointerDown={(event) => event.stopPropagation()}>
            <button type="button" className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:bg-emerald-50" onClick={onMoveTool}>Mover</button>
            <button type="button" className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:bg-emerald-50" onClick={onRotateTool}>Girar</button>
            <button type="button" className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:bg-emerald-50" onClick={onDuplicateTool}>Duplicar</button>
            <button type="button" className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50" onClick={onConnectTool}>Conectar</button>
            {onEditTool && <button type="button" className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:bg-emerald-50" onClick={onEditTool}>Editar</button>}
            <button type="button" className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50" onClick={onRemoveTool}>Quitar</button>
          </div>
        </Html>
      )}
    </group>
  );
}

function Cable({
  connection,
  scene,
  seed,
  index,
  selected,
  technical,
  travel,
  onSelect,
}: {
  connection: SceneConnection;
  scene: SceneState;
  seed: number;
  index: number;
  selected: boolean;
  technical: boolean;
  travel: boolean;
  onSelect: (id: string) => void;
}) {
  const from = scene.objects.find((object) => object.id === connection.fromId);
  const to = scene.objects.find((object) => object.id === connection.toId);
  const air = connection.type === 'wireless' || connection.type === 'wifi' || connection.type === 'cloud';
  const corrugation = useMemo(() => createCorrugationMap(), []);
  const curve = useMemo(() => {
    if (!from || !to) return null;
    const hose = connection.hoseIndex ?? 0;
    const a = endpoint(from, scene, connection.type, hose);
    const b = endpoint(to, scene, connection.type, hose);
    const start = new THREE.Vector3(a.x, a.y, a.z);
    const end = new THREE.Vector3(b.x, b.y, b.z);
    if (air) {
      const crest = start.clone().lerp(end, 0.5);
      crest.y = Math.max(start.y, end.y, 1.4) + 1.5 + (index % 3) * 0.25;
      return new THREE.CatmullRomCurve3([start, crest, end]);
    }
    const tray = connection.type === 'process' ? 0.12 : 0.28;
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const length = Math.hypot(dx, dz) || 1;
    const lane = ((index * 3 + seed) % 7 - 3) * 0.55;
    const sideX = (-dz / length) * lane;
    const sideZ = (dx / length) * lane;
    const bendX = (start.x + end.x) / 2 + sideX;
    const bendZ = (start.z + end.z) / 2 + sideZ;
    return new THREE.CatmullRomCurve3([
      start,
      new THREE.Vector3(start.x, tray, start.z),
      new THREE.Vector3(bendX, tray, start.z),
      new THREE.Vector3(bendX, tray, bendZ),
      new THREE.Vector3(end.x, tray, end.z),
      end,
    ]);
  }, [from, to, scene, connection.type, connection.hoseIndex, index, seed, air]);

  const pulse = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!pulse.current || !curve) return;
    pulse.current.position.copy(curve.getPoint((clock.elapsedTime * 0.22) % 1));
  });

  if (!curve) return null;
  const radius = connection.type === 'process' ? 0.045 : air ? 0.02 : selected ? 0.028 : 0.016;
  const mid = curve.getPoint(0.5);
  return (
    <group onClick={(event) => { event.stopPropagation(); onSelect(connection.id); }}>
      <mesh>
        <tubeGeometry args={[curve, 24, 0.22, 6, false]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh>
        <tubeGeometry args={[curve, air ? 32 : 48, radius, connection.type === 'process' ? 10 : 6, false]} />
        <meshStandardMaterial
          map={connection.type === 'process' ? corrugation ?? undefined : undefined}
          color={selected ? '#ffffff' : CONNECTION_COLORS[connection.type]}
          emissive={air ? CONNECTION_COLORS[connection.type] : '#000000'}
          emissiveIntensity={air ? 0.35 : 0}
          transparent={Boolean(connection.provisional) || air}
          opacity={connection.provisional ? 0.55 : air ? 0.72 : 1}
          roughness={connection.type === 'process' ? 0.42 : 0.35}
          metalness={connection.type === 'process' ? 0.12 : 0.05}
        />
      </mesh>
      {(air || travel || selected) && (
        <mesh ref={pulse}>
          <sphereGeometry args={[air ? 0.05 : 0.04, 12, 12]} />
          <meshStandardMaterial color="#ffffff" emissive={CONNECTION_COLORS[connection.type]} emissiveIntensity={1} />
        </mesh>
      )}
      {selected && <NameLabel text={`${deviceLabel(scene.objects.find((object) => object.id === connection.fromId) ?? { name: 'Origen', kind: '', role: '' }, scene)} → ${deviceLabel(scene.objects.find((object) => object.id === connection.toId) ?? { name: 'Destino', kind: '', role: '' }, scene)}`} detail={CONNECTION_LABELS[connection.type]} position={[mid.x, mid.y + 0.45, mid.z]} visible tone={CONNECTION_COLORS[connection.type]} scale={0.72} />}
    </group>
  );
}

function Bridge({
  apiRef,
  onDropItem,
}: {
  apiRef: MutableRefObject<SceneApi | null>;
  onDropItem: (itemId: string, x: number, z: number) => void;
}) {
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as unknown as ControlsLike | null;
  const goal = useRef<{ position: THREE.Vector3; target: THREE.Vector3; zoom: number } | null>(null);

  useFrame(() => {
    if (!goal.current || !controls) return;
    controls.target.lerp(goal.current.target, 0.14);
    controls.object.position.lerp(goal.current.position, 0.14);
    const ortho = camera as THREE.OrthographicCamera;
    ortho.zoom = THREE.MathUtils.lerp(ortho.zoom, goal.current.zoom, 0.14);
    ortho.updateProjectionMatrix();
    controls.update();
  });

  useEffect(() => {
    gl.localClippingEnabled = true;
    const element = gl.domElement;
    const onDragOver = (event: DragEvent) => event.preventDefault();
    const onDrop = (event: DragEvent) => {
      event.preventDefault();
      const raw = event.dataTransfer?.getData('application/x-cesti') || event.dataTransfer?.getData('text/plain');
      if (!raw) return;
      const rect = element.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const hit = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(plane, hit)) onDropItem(raw, hit.x, hit.z);
    };
    element.addEventListener('dragover', onDragOver);
    element.addEventListener('drop', onDrop);
    return () => {
      element.removeEventListener('dragover', onDragOver);
      element.removeEventListener('drop', onDrop);
    };
  }, [camera, gl, onDropItem]);

  useEffect(() => {
    const applyView = (target: THREE.Vector3, position: THREE.Vector3, zoom: number) => {
      const ortho = camera as THREE.OrthographicCamera;
      goal.current = { target, position, zoom };
      ortho.position.copy(position);
      ortho.zoom = zoom;
      ortho.updateProjectionMatrix();
      if (controls) {
        controls.target.copy(target);
        controls.object.position.copy(position);
        controls.update();
      }
    };
    apiRef.current = {
      capture: () => gl.domElement.toDataURL('image/png'),
      zoom: (factor: number) => {
        const ortho = camera as THREE.OrthographicCamera;
        const next = THREE.MathUtils.clamp(ortho.zoom * factor, 12, 160);
        applyView(controls?.target.clone() ?? new THREE.Vector3(), controls?.object.position.clone() ?? ortho.position.clone(), next);
      },
      rotateView: () => {
        if (!controls) return;
        const offset = controls.object.position.clone().sub(controls.target);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
        controls.object.position.copy(controls.target).add(offset);
        controls.object.lookAt(controls.target);
        controls.update();
      },
      center: () => {
        applyView(new THREE.Vector3(0, 0, 0), new THREE.Vector3(16, 15, 16), 52);
      },
      focus: (x: number, z: number) => {
        applyView(new THREE.Vector3(x, 0.45, z), new THREE.Vector3(x + 9, 11, z + 9), 68);
      },
      frame: (points: { x: number; z: number }[]) => {
        if (points.length === 0) {
          applyView(new THREE.Vector3(0, 0, 0), new THREE.Vector3(16, 15, 16), 52);
          return;
        }
        const xs = points.map((point) => point.x);
        const zs = points.map((point) => point.z);
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
        const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
        const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs), 10) + 5;
        applyView(
          new THREE.Vector3(cx, 0.2, cz),
          new THREE.Vector3(cx + 16, 15, cz + 16),
          THREE.MathUtils.clamp(1180 / span, 52, 92),
        );
      },
    };
  }, [apiRef, camera, controls, gl]);

  return null;
}

function PlotGrid() {
  const geometry = useMemo(() => {
    const points: number[] = [];
    for (let x = -PLOT.halfX; x <= PLOT.halfX; x += 4) points.push(x, 0.025, -PLOT.halfZ, x, 0.025, PLOT.halfZ);
    for (let z = -PLOT.halfZ; z <= PLOT.halfZ; z += 4) points.push(-PLOT.halfX, 0.025, z, PLOT.halfX, 0.025, z);
    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return buffer;
  }, []);
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#e7eef3" transparent opacity={0.45} />
    </lineSegments>
  );
}

function Forecourt({ armed, showGrid, onPlace, onClear }: { armed: boolean; showGrid: boolean; onPlace: (x: number, z: number) => void; onClear: () => void }) {
  const asphalt = useMemo(() => createAsphaltMap(), []);
  const grass = useMemo(() => createGrassMap(), []);
  if (asphalt) asphalt.repeat.set(10, 7);
  if (grass) grass.repeat.set(22, 16);
  const plazaX = 14;
  const plazaZ = 10;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[160, 110]} />
        <meshStandardMaterial map={grass ?? undefined} color={grass ? '#ffffff' : '#7dbe63'} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <planeGeometry args={[plazaX * 2 + 2.4, plazaZ * 2 + 2.4]} />
        <meshStandardMaterial color="#dcecc8" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]} receiveShadow>
        <planeGeometry args={[plazaX * 2, plazaZ * 2]} />
        <meshStandardMaterial map={asphalt ?? undefined} color={asphalt ? '#ffffff' : '#f6e6c8'} roughness={0.92} />
      </mesh>
      {showGrid && armed && <PlotGrid />}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        onClick={(event) => {
          event.stopPropagation();
          if (armed && insidePlot(event.point.x, event.point.z)) onPlace(event.point.x, event.point.z);
          else if (!armed) onClear();
        }}
      >
        <planeGeometry args={[PLOT.halfX * 2 + 8, PLOT.halfZ * 2 + 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function PlacementGhost({ kind, snapGrid }: { kind: Kind; snapGrid: boolean }) {
  const anchor = useRef<THREE.Group>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const spot = useRef(new THREE.Vector3(0, 0, 0));
  const valid = useRef(true);
  const tintOk = useMemo(() => new THREE.Color('#bbf7d0'), []);
  const tintBad = useMemo(() => new THREE.Color('#fecaca'), []);
  const { camera, gl } = useThree();
  const dummy = useMemo<SceneObject>(() => ({
    id: 'ghost',
    kind,
    role: kind === 'dispenser' || kind === 'loading-point' ? 'dispenser' : kind === 'office' ? 'office' : kind === 'console' ? 'console-telemetry' : kind === 'controller' ? 'dispenser-controller' : 'tank',
    name: '',
    x: 0,
    z: 0,
    rotation: 0,
    productId: null,
    serviceKey: null,
    quantity: 1,
    attachedTo: null,
    props: kind === 'dispenser' ? { hoseCount: 2, outlets: [{ product: '', tankId: null }, { product: '', tankId: null }] } : {},
  }), [kind]);
  useEffect(() => {
    const element = gl.domElement;
    const onMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const hit = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(plane, hit)) return;
      const x = snapGrid ? snap(hit.x) : hit.x;
      const z = snapGrid ? snap(hit.z) : hit.z;
      spot.current.set(x, 0, z);
      valid.current = insidePlot(x, z);
    };
    element.addEventListener('pointermove', onMove);
    return () => element.removeEventListener('pointermove', onMove);
  }, [camera, gl, snapGrid]);
  useFrame(() => {
    if (!anchor.current) return;
    anchor.current.position.copy(spot.current);
    anchor.current.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      const material = mesh.material as THREE.MeshStandardMaterial;
      if (material && 'emissive' in material && material.color) {
        material.transparent = true;
        material.opacity = 0.62;
        material.emissive = valid.current ? tintOk : tintBad;
        material.emissiveIntensity = 0.35;
      }
    });
    if (ringMat.current) ringMat.current.color.set(valid.current ? '#16a34a' : '#dc2626');
  });
  return (
    <group ref={anchor}>
      <EquipmentModel object={dummy} selected={false} showLabel={false} probe="none" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[1.15, 1.28, 40]} />
        <meshBasicMaterial ref={ringMat} color="#16a34a" />
      </mesh>
    </group>
  );
}

function PreviewLink({ fromId, scene, type, index }: { fromId: string; scene: SceneState; type: ConnectionType | null; index: number }) {
  const cursor = useRef(new THREE.Vector3());
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: '#facc15' }));
  }, []);
  const { camera, gl } = useThree();
  useEffect(() => {
    const element = gl.domElement;
    const onMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const hit = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(plane, hit)) cursor.current.copy(hit).setY(0.7);
    };
    element.addEventListener('pointermove', onMove);
    return () => element.removeEventListener('pointermove', onMove);
  }, [camera, gl]);
  useFrame(() => {
    const source = scene.objects.find((object) => object.id === fromId);
    if (!source) return;
    const origin = endpoint(source, scene, type, index);
    const positions = line.geometry.getAttribute('position') as THREE.BufferAttribute;
    positions.setXYZ(0, origin.x, origin.y, origin.z);
    positions.setXYZ(1, cursor.current.x, cursor.current.y, cursor.current.z);
    positions.needsUpdate = true;
  });
  return <primitive object={line} />;
}

export default function InstallationCanvas(props: CanvasProps) {
  const visibleIds = new Set(visibleConnectionIds(props.scene, {
    selectedId: props.focusId ?? null,
    showAll: props.scene.showConnections,
    layer: props.layerFilter,
    pinIds: props.pinIds,
  }));
  const visibleConnections = props.scene.connections.filter((connection) => visibleIds.has(connection.id));
  const selectedHost = props.scene.objects.find((object) => object.id === props.selectedId)?.attachedTo ?? props.selectedId;
  const lit = new Set(props.litIds ?? []);

  return (
    <Canvas
      orthographic
      shadows
      dpr={[1, 1.6]}
      gl={{ preserveDrawingBuffer: true, antialias: true, alpha: false }}
      camera={{ position: [16, 15, 16], zoom: 52, near: -160, far: 480 }}
    >
      <color attach="background" args={['#d7f0dc']} />
      <ambientLight intensity={0.82} />
      <hemisphereLight args={['#fff6e4', '#c6e2a4', 0.7]} />
      <directionalLight position={[14, 22, 10]} intensity={1.12} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-10, 8, -6]} intensity={0.42} />
      <Forecourt armed={props.armed} showGrid={props.snapGrid} onPlace={props.onPlace} onClear={() => props.onSelect(null)} />
      {props.ghostKind && props.armed && <PlacementGhost kind={props.ghostKind} snapGrid={props.snapGrid} />}
      <ContactShadows position={[0, 0.01, 0]} opacity={0.14} scale={90} blur={3.2} far={8} />
      {props.scene.objects.filter((object) => {
        if (object.attachedTo) return false;
        if (isTransmitter(object) && transmitterHost(object, props.scene.objects, props.scene.connections)) return false;
        return true;
      }).map((object) => {
        const probe = props.scene.objects.find((item) => item.role === 'probe' && item.attachedTo === object.id);
        const carriesRadio = props.scene.objects.some((item) => isTransmitter(item) && transmitterHost(item, props.scene.objects, props.scene.connections)?.id === object.id);
        const hint = props.hints?.[object.id] ?? null;
        const badge = props.badges?.[object.id];
        const selected = object.id === selectedHost || object.id === props.selectedId;
        const showPorts = props.connectMode ? hint !== 'blocked' : selected || lit.has(object.id);
        const muted = props.connectMode ? hint === 'blocked' : lit.size > 0 && !selected && !lit.has(object.id);
        const view = carriesRadio && object.role === 'tank'
          ? { ...object, props: { ...object.props, comms: 'wireless-solar' as const } }
          : object;
        return (
          <Draggable
            key={object.id}
            object={view}
            scene={props.scene}
            selected={selected}
            showLabel={props.scene.showLabels && !muted}
            probeId={probe?.id ?? null}
            probe={probeVisual(props.scene, object.id)}
            linkFrom={props.linkFrom}
            snapGrid={props.snapGrid}
            allowDrag={props.allowDrag}
            onSelect={props.onSelect}
            onDragStart={props.onDragStart}
            onMove={props.onMove}
            onMoveEnd={props.onMoveEnd}
            onLinkTarget={props.onLinkTarget}
            onPort={props.onPort}
            muted={muted}
            hint={hint}
            showPorts={showPorts}
            tone={badge?.tone}
            detail={badge?.text}
            showActions={selected && props.allowDrag && !props.connectMode && Boolean(props.actions)}
            onMoveTool={props.actions?.onMove}
            onRotateTool={props.actions?.onRotate}
            onDuplicateTool={props.actions?.onDuplicate}
            onRemoveTool={props.actions?.onRemove}
            onConnectTool={props.actions?.onConnect}
            onEditTool={props.actions?.onEdit}
            onRotateLive={props.onRotate}
          />
        );
      })}
      {props.linkFrom && <PreviewLink fromId={props.linkFrom} scene={props.scene} type={props.linkType} index={props.linkIndex} />}
      {visibleConnections.map((connection, index) => (
        <Cable
          key={connection.id}
          connection={connection}
          scene={props.scene}
          seed={props.scene.routeSeed}
          index={index}
          selected={connection.id === props.selectedConnectionId || connection.id === props.pulseId}
          technical={props.scene.viewMode === 'technical'}
          travel={connection.id === props.pulseId}
          onSelect={props.onSelectConnection}
        />
      ))}
      <OrbitControls
        makeDefault
        enableRotate={false}
        enableDamping
        dampingFactor={0.08}
        zoomToCursor
        zoomSpeed={0.7}
        panSpeed={0.85}
        minZoom={12}
        maxZoom={160}
        target={[0, 0, 0]}
        mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
        touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }}
      />
      <Bridge apiRef={props.apiRef} onDropItem={props.onDropItem} />
    </Canvas>
  );
}

export const CONNECTION_LABELS: Record<ConnectionType, string> = {
  sensor: 'Sensor hacia consola',
  rs485: 'RS-485',
  wireless: 'Inalámbrica',
  ethernet: 'Ethernet',
  wifi: 'Wi-Fi',
  cloud: 'Hacia la nube',
  'dispenser-control': 'Control de surtidor',
  alarm: 'Señal de alarma',
  process: 'Abastecimiento (proceso)',
  association: 'Asociación del tarjetero',
};
