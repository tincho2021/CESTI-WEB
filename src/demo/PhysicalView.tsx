import { Suspense, useEffect, useMemo, useRef, type ComponentRef } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Environment, Html, Lightformer, OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { CABLE, FRAMES, SECTION_Z, WORLD, type Focus, type HoseId, type NodeId, type Phase } from './model';
import {
  cautionTexture,
  concreteTexture,
  consoleScreen,
  corrugation,
  fasciaTexture,
  floorTexture,
  plateTexture,
  pumpScreen,
  soilTexture,
} from './textures';

type Choose = (id: NodeId | null) => void;

type Props = {
  selected: NodeId | null;
  emphasis: NodeId[] | null;
  phase: Phase;
  linked: boolean;
  focus: Focus;
  onChoose: Choose;
};

const TANK = WORLD.tank;
const FUEL_Y = TANK.y + 0.08;

function hit(onChoose: Choose, id: NodeId) {
  return (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onChoose(id);
  };
}

function Tag({ position, text, tone }: { position: [number, number, number]; text: string; tone: string }) {
  return (
    <Html position={position} center distanceFactor={8} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-800 shadow-md ring-1 ring-slate-200">
        <span className="h-2 w-2 rounded-full" style={{ background: tone }} />
        {text}
      </div>
    </Html>
  );
}

function Beacon({ position, color, radius = 0.48 }: { position: [number, number, number]; color: string; radius?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const scale = 1 + Math.sin(clock.elapsedTime * 3.4) * 0.06;
    ref.current.scale.setScalar(scale);
  });
  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius, radius + 0.07, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.95} side={THREE.DoubleSide} />
    </mesh>
  );
}

function corrugate(geometry: THREE.TubeGeometry, amplitude: number, waves: number) {
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const uv = geometry.attributes.uv;
  for (let index = 0; index < position.count; index += 1) {
    const lift = Math.sin(uv.getY(index) * Math.PI * waves) * amplitude;
    position.setXYZ(
      index,
      position.getX(index) + normal.getX(index) * lift,
      position.getY(index) + normal.getY(index) * lift,
      position.getZ(index) + normal.getZ(index) * lift,
    );
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
}

function Tube({ points, radius, color, quiet = false, ribbed = false }: { points: readonly [number, number, number][]; radius: number; color: string; quiet?: boolean; ribbed?: boolean }) {
  const bump = useMemo(() => corrugation(), []);
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
    const tube = new THREE.TubeGeometry(curve, 80, radius, 12, false);
    if (ribbed) corrugate(tube, radius * 0.28, 70);
    return tube;
  }, [points, radius, ribbed]);
  return (
    <mesh geometry={geometry} castShadow>
      <meshPhysicalMaterial
        color={color}
        roughness={0.32}
        metalness={0.12}
        clearcoat={0.45}
        clearcoatRoughness={0.35}
        bumpMap={bump}
        bumpScale={0.008}
        transparent={quiet}
        opacity={quiet ? 0.28 : 1}
      />
    </mesh>
  );
}

function DataCable({ linked }: { linked: boolean }) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(CABLE.map((point) => new THREE.Vector3(...point)));
    return new THREE.TubeGeometry(curve, 48, 0.014, 8, false);
  }, []);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(CABLE.map((point) => new THREE.Vector3(...point))), []);
  const pulse = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!pulse.current) return;
    curve.getPoint((clock.elapsedTime * 0.28) % 1, pulse.current.position);
  });
  const mid = curve.getPoint(0.55);
  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial color={linked ? '#d97706' : '#fbbf24'} roughness={0.35} metalness={0.2} transparent={!linked} opacity={linked ? 1 : 0.45} />
      </mesh>
      {linked && (
        <mesh ref={pulse}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={0.9} />
        </mesh>
      )}
      {linked && <Tag position={[mid.x, mid.y + 0.16, mid.z]} text="Telemedición" tone="#d97706" />}
    </group>
  );
}

function GhostCable({ from }: { from: readonly [number, number, number] }) {
  const mesh = useRef<THREE.Mesh>(null);
  const { camera, pointer } = useThree();
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.45), []);
  const hitPoint = useMemo(() => new THREE.Vector3(), []);
  const origin = useMemo(() => new THREE.Vector3(...from), [from]);
  const last = useRef(new THREE.Vector3());
  useFrame(() => {
    if (!mesh.current) return;
    ray.setFromCamera(pointer, camera);
    if (!ray.ray.intersectPlane(plane, hitPoint)) return;
    if (hitPoint.distanceToSquared(last.current) < 0.0004) return;
    last.current.copy(hitPoint);
    const next = new THREE.TubeGeometry(new THREE.LineCurve3(origin, hitPoint), 1, 0.012, 6, false);
    mesh.current.geometry.dispose();
    mesh.current.geometry = next;
  });
  return (
    <mesh ref={mesh}>
      <meshStandardMaterial color="#f59e0b" roughness={0.4} />
    </mesh>
  );
}

function Site({ onChoose }: { onChoose: Choose }) {
  const soil = useMemo(() => soilTexture(), []);
  const floor = useMemo(() => floorTexture(), []);
  const concrete = useMemo(() => concreteTexture(), []);
  const caution = useMemo(() => cautionTexture(), []);
  const clear = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onChoose(null);
  };
  const slab = (position: [number, number, number], size: [number, number, number]) => (
    <mesh position={position} receiveShadow onClick={clear}>
      <boxGeometry args={size} />
      <meshStandardMaterial map={concrete} color="#d5dbdf" roughness={0.94} metalness={0} />
    </mesh>
  );
  return (
    <group>
      {slab([0, -0.11, -3.64], [16, 0.22, 5.12])}
      {slab([-6.38, -0.11, 0.56], [3.25, 0.22, 3.28])}
      {slab([4.45, -0.11, 0.56], [7.1, 0.22, 3.28])}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.12, -2.18, 0.56]} receiveShadow onClick={clear}>
        <planeGeometry args={[5.25, 3.28]} />
        <meshStandardMaterial map={floor} roughness={1} />
      </mesh>
      <mesh position={[-2.12, -1.2, -1.08]} receiveShadow onClick={clear}>
        <planeGeometry args={[5.25, 1.96]} />
        <meshStandardMaterial map={soil} roughness={1} />
      </mesh>
      <mesh position={[-4.75, -1.2, 0.56]} rotation={[0, Math.PI / 2, 0]} receiveShadow onClick={clear}>
        <planeGeometry args={[3.28, 1.96]} />
        <meshStandardMaterial map={soil} roughness={1} />
      </mesh>
      <mesh position={[-2.12, 0.015, -1.08]} receiveShadow>
        <boxGeometry args={[5.25, 0.03, 0.14]} />
        <meshStandardMaterial map={caution} roughness={0.8} />
      </mesh>
    </group>
  );
}

function UndergroundTank({ muted, hot, linked, onChoose }: { muted: boolean; hot: boolean; linked: boolean; onChoose: Choose }) {
  const section = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, -1), SECTION_Z), []);
  const fuelCap = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), FUEL_Y), []);
  const shell = {
    color: hot ? '#239053' : '#1f8a48',
    roughness: 0.28,
    metalness: 0.04,
    clearcoat: muted ? 0 : 0.62,
    clearcoatRoughness: 0.22,
    emissive: hot ? '#14532d' : '#000000',
    emissiveIntensity: hot ? 0.35 : 0,
    transparent: muted,
    opacity: muted ? 0.45 : 1,
    clippingPlanes: [section],
  };
  const ribs = Array.from({ length: 13 }, (_, index) => -TANK.length / 2 + 0.22 + index * 0.28);
  const edge = Math.sqrt(TANK.radius ** 2 - (SECTION_Z - TANK.z) ** 2);
  return (
    <group position={[TANK.x, TANK.y, TANK.z]} onClick={hit(onChoose, 'tank')}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[TANK.radius, TANK.radius, TANK.length, 72, 1, true]} />
        <meshPhysicalMaterial {...shell} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[TANK.radius - 0.055, TANK.radius - 0.055, TANK.length - 0.08, 64, 1, true]} />
        <meshStandardMaterial color="#0c2416" side={THREE.BackSide} roughness={0.9} clippingPlanes={[section]} transparent={muted} opacity={muted ? 0.45 : 1} />
      </mesh>
      {([-1, 1] as const).map((end) => (
        <mesh key={end} position={[end * (TANK.length / 2 - 0.01), 0, 0]} rotation={[0, 0, end === 1 ? -Math.PI / 2 : Math.PI / 2]} castShadow>
          <sphereGeometry args={[TANK.radius, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial {...shell} clippingPlanes={undefined} />
        </mesh>
      ))}
      {ribs.map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[TANK.radius + 0.012, 0.02, 8, 40]} />
          <meshStandardMaterial color="#176e3c" roughness={0.45} clippingPlanes={[section]} transparent={muted} opacity={muted ? 0.45 : 1} />
        </mesh>
      ))}
      <mesh position={[0, edge - 0.01, SECTION_Z - TANK.z]}>
        <boxGeometry args={[TANK.length - 0.35, 0.045, 0.06]} />
        <meshStandardMaterial color="#145c32" roughness={0.5} />
      </mesh>
      <mesh position={[0, -edge + 0.01, SECTION_Z - TANK.z]}>
        <boxGeometry args={[TANK.length - 0.35, 0.045, 0.06]} />
        <meshStandardMaterial color="#145c32" roughness={0.5} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[TANK.radius - 0.07, TANK.radius - 0.07, TANK.length - 0.28, 64, 1, true]} />
        <meshPhysicalMaterial
          color="#d8872b"
          roughness={0.12}
          metalness={0.02}
          clearcoat={0.8}
          clearcoatRoughness={0.12}
          side={THREE.DoubleSide}
          clippingPlanes={[section, fuelCap]}
          transparent={muted}
          opacity={muted ? 0.4 : 1}
        />
      </mesh>
      <mesh position={[0, FUEL_Y - TANK.y, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[TANK.length / 2 - 0.12, TANK.radius - 0.12, 1]}>
        <circleGeometry args={[1, 48]} />
        <meshStandardMaterial color="#f3c16a" roughness={0.12} metalness={0.04} clippingPlanes={[section]} />
      </mesh>
      <Tag position={[0.15, TANK.radius + 0.42, 0.2]} text={linked ? 'T1 · Telemedición activa' : 'T1 · Falta conectar'} tone={linked ? '#059669' : '#d97706'} />
      {[-1.15, 1.15].map((x) => (
        <mesh key={x} position={[x, -TANK.radius - 0.05, 0]} receiveShadow>
          <boxGeometry args={[0.55, 0.22, 0.95]} />
          <meshStandardMaterial color="#b7b0a6" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function ProbeAssembly({ muted, hot, onChoose }: { muted: boolean; hot: boolean; onChoose: Choose }) {
  const metal = {
    color: hot ? '#f8fafc' : '#d5dbe3',
    metalness: 0.82,
    roughness: 0.22,
    emissive: hot ? '#92400e' : '#000000',
    emissiveIntensity: hot ? 0.25 : 0,
    transparent: muted,
    opacity: muted ? 0.45 : 1,
  };
  return (
    <group position={[WORLD.sump.x, 0, WORLD.sump.z]} onClick={hit(onChoose, 'probe')}>
      <mesh position={[0, -0.08, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.28, 0.82, 32]} />
        <meshPhysicalMaterial color={hot ? '#f6c453' : '#e6b423'} roughness={0.38} metalness={0.05} clearcoat={0.4} transparent={muted} opacity={muted ? 0.45 : 1} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.4, 32]} />
        <meshStandardMaterial color="#c99212" roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.07, 32]} />
        <meshStandardMaterial color="#efc44a" roughness={0.42} />
      </mesh>
      {Array.from({ length: 8 }, (_, index) => {
        const angle = (index / 8) * Math.PI * 2;
        return (
          <mesh key={index} position={[Math.cos(angle) * 0.34, 0.14, Math.sin(angle) * 0.34]}>
            <cylinderGeometry args={[0.018, 0.018, 0.03, 8]} />
            <meshStandardMaterial color="#4b5563" metalness={0.7} roughness={0.3} />
          </mesh>
        );
      })}
      <mesh position={[0.22, -0.02, 0.2]} rotation={[0.4, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.045, 0.045, 0.16, 12]} />
        <meshStandardMaterial color="#dc2626" roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.62, 0.04]}>
        <cylinderGeometry args={[0.026, 0.026, 1.7, 16]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      <mesh position={[0, FUEL_Y, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.07, 16]} />
        <meshStandardMaterial color="#111827" roughness={0.45} />
      </mesh>
      <mesh position={[0, FUEL_Y + 0.05, 0]}>
        <torusGeometry args={[0.055, 0.01, 8, 16]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[0.16, 0.14, 0.14]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      <mesh position={[0.1, 0.34, 0]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={0.5} />
      </mesh>
      <Tag position={[0.28, 0.72, 0.2]} text="Sonda" tone={hot ? '#d97706' : '#64748b'} />
    </group>
  );
}

function Hose({ id, points, hot, muted, onChoose }: { id: HoseId; points: [number, number, number][]; hot: boolean; muted: boolean; onChoose: Choose }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point))), 24, 0.02, 8, false), [points]);
  const hitGeometry = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point))), 12, 0.07, 6, false), [points]);
  const end = points[points.length - 1];
  return (
    <group onClick={hit(onChoose, id)}>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial color={hot ? '#b45309' : '#1c1917'} roughness={0.62} transparent={muted} opacity={muted ? 0.4 : 1} />
      </mesh>
      <mesh geometry={hitGeometry}>
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={end} castShadow>
        <boxGeometry args={[0.05, 0.14, 0.05]} />
        <meshStandardMaterial color={hot ? '#fbbf24' : '#111827'} />
      </mesh>
    </group>
  );
}

function Dispenser({ muted, hot, hotHose, onChoose }: { muted: boolean; hot: boolean; hotHose: HoseId | null; onChoose: Choose }) {
  const screen = useMemo(() => pumpScreen(), []);
  const plates = useMemo(() => ({ m1: plateTexture('M1'), m2: plateTexture('M2'), m3: plateTexture('M3'), m4: plateTexture('M4') }), []);
  const hoses: { id: HoseId; points: [number, number, number][]; plate: [number, number, number]; face: 1 | -1 }[] = [
    { id: 'm1', face: 1, plate: [0.34, 0.78, 0.42], points: [[0.27, 1.28, 0.36], [0.62, 0.98, 0.46], [0.34, 0.58, 0.36]] },
    { id: 'm2', face: 1, plate: [0.34, 0.78, -0.42], points: [[0.27, 1.28, -0.36], [0.62, 0.98, -0.46], [0.34, 0.58, -0.36]] },
    { id: 'm3', face: -1, plate: [-0.34, 0.78, 0.42], points: [[-0.27, 1.28, 0.36], [-0.62, 0.98, 0.46], [-0.34, 0.58, 0.36]] },
    { id: 'm4', face: -1, plate: [-0.34, 0.78, -0.42], points: [[-0.27, 1.28, -0.36], [-0.62, 0.98, -0.46], [-0.34, 0.58, -0.36]] },
  ];
  return (
    <group position={[WORLD.dispenser.x, 0.14, WORLD.dispenser.z]}>
      <mesh position={[0, -0.07, 0]} receiveShadow onClick={hit(onChoose, 'dispenser')}>
        <boxGeometry args={[1.55, 0.14, 2.35]} />
        <meshStandardMaterial color="#d7dcde" roughness={0.9} />
      </mesh>
      <RoundedBox args={[0.52, 1.52, 1.38]} radius={0.035} smoothness={3} position={[0, 0.76, 0]} castShadow onClick={hit(onChoose, 'dispenser')}>
        <meshStandardMaterial color="#f8fafc" roughness={0.45} metalness={0.04} emissive={hot ? '#1e3a8a' : '#000'} emissiveIntensity={hot ? 0.18 : 0} transparent={muted} opacity={muted ? 0.42 : 1} />
      </RoundedBox>
      <mesh position={[0, 1.56, 0]} castShadow onClick={hit(onChoose, 'dispenser')}>
        <boxGeometry args={[0.56, 0.14, 1.44]} />
        <meshStandardMaterial color="#011832" />
      </mesh>
      <mesh position={[0.27, 1.16, 0]} rotation={[0, Math.PI / 2, 0]} onClick={hit(onChoose, 'dispenser')}>
        <planeGeometry args={[0.42, 0.22]} />
        <meshBasicMaterial map={screen} />
      </mesh>
      {hoses.map((hose) => (
        <group key={hose.id}>
          <Hose id={hose.id} points={hose.points} hot={hotHose === hose.id || hot} muted={muted} onChoose={onChoose} />
          <mesh position={hose.plate} rotation={[0, hose.face === 1 ? Math.PI / 2 : -Math.PI / 2, 0]}>
            <planeGeometry args={[0.16, 0.08]} />
            <meshBasicMaterial map={plates[hose.id]} />
          </mesh>
        </group>
      ))}
      <Tag position={[0, 1.92, 0]} text="S1 · 4 mangueras" tone={hot ? '#011832' : '#64748b'} />
    </group>
  );
}

function Canopy({ muted }: { muted: boolean }) {
  const fascia = useMemo(() => fasciaTexture(), []);
  const origin = WORLD.dispenser;
  const fade = { transparent: muted, opacity: muted ? 0.42 : 1 };
  return (
    <group position={[origin.x, 0, origin.z]}>
      {[[-1.2, -1.28], [1.2, -1.28], [-1.2, 1.28], [1.2, 1.28]].map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 1.4, z]} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 2.55, 12]} />
          <meshStandardMaterial color="#e5e7eb" roughness={0.6} {...fade} />
        </mesh>
      ))}
      <mesh position={[0, 2.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.15, 0.08, 3.25]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.55} {...fade} />
      </mesh>
      <mesh position={[0, 2.56, 1.64]} castShadow>
        <boxGeometry args={[3.15, 0.2, 0.06]} />
        <meshStandardMaterial color="#011832" {...fade} />
      </mesh>
      <mesh position={[0, 2.56, 1.68]}>
        <planeGeometry args={[2.2, 0.14]} />
        <meshBasicMaterial map={fascia} />
      </mesh>
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 2.64, 0]}>
          <boxGeometry args={[0.55, 0.03, 0.28]} />
          <meshStandardMaterial color="#f8fafc" emissive="#fff7ed" emissiveIntensity={0.35} />
        </mesh>
      ))}
      {[[-0.62, -0.95], [0.62, -0.95], [-0.62, 0.95], [0.62, 0.95]].map(([x, z]) => (
        <mesh key={`b${x}${z}`} position={[x, 0.48, z]} castShadow>
          <cylinderGeometry args={[0.04, 0.045, 0.7, 10]} />
          <meshStandardMaterial color="#f5c400" />
        </mesh>
      ))}
    </group>
  );
}

function ProductPipes({ quiet }: { quiet: boolean }) {
  const startA: [number, number, number][] = [
    [WORLD.sump.x, 0.08, WORLD.sump.z - 0.32],
    [WORLD.sump.x + 0.7, 0.16, WORLD.sump.z - 0.22],
    [-0.15, 0.18, -0.05],
    [1.15, 0.16, 0.15],
    [WORLD.dispenser.x - 0.1, 0.2, WORLD.dispenser.z + 0.2],
    [WORLD.dispenser.x, 0.32, WORLD.dispenser.z],
  ];
  const startB: [number, number, number][] = startA.map(([x, y, z]) => [x, y + 0.07, z - 0.1] as [number, number, number]);
  return (
    <group>
      <mesh position={[WORLD.sump.x, 0.04, WORLD.sump.z - 0.3]}>
        <boxGeometry args={[0.18, 0.14, 0.16]} />
        <meshStandardMaterial color="#e6b423" roughness={0.4} transparent={quiet} opacity={quiet ? 0.35 : 1} />
      </mesh>
      <Tube points={startA} radius={0.045} color="#2a62c9" quiet={quiet} ribbed />
      <Tube points={startB} radius={0.045} color="#2457b8" quiet={quiet} ribbed />
    </group>
  );
}

function Office({ muted, hot, onChoose }: { muted: boolean; hot: boolean; onChoose: Choose }) {
  const wall = {
    color: '#f7f7f5',
    roughness: 0.78,
    emissive: hot ? '#334155' : '#000000',
    emissiveIntensity: hot ? 0.12 : 0,
    transparent: muted,
    opacity: muted ? 0.42 : 1,
  };
  return (
    <group position={[WORLD.office.x, 0, WORLD.office.z]} onClick={hit(onChoose, 'office')}>
      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.45, 2.1, 1.9]} />
        <meshStandardMaterial {...wall} />
      </mesh>
      <mesh position={[0, 2.18, 0]} castShadow>
        <boxGeometry args={[2.7, 0.1, 2.15]} />
        <meshStandardMaterial color="#8e98a3" roughness={0.55} />
      </mesh>
      <mesh position={[0.35, 1.15, 0.96]}>
        <boxGeometry args={[0.7, 0.55, 0.04]} />
        <meshPhysicalMaterial color="#b9d4e4" roughness={0.05} metalness={0.05} transmission={0.55} thickness={0.04} transparent opacity={muted ? 0.3 : 0.85} />
      </mesh>
      <mesh position={[-0.55, 1.15, 0.96]}>
        <boxGeometry args={[0.55, 0.55, 0.04]} />
        <meshPhysicalMaterial color="#b9d4e4" roughness={0.05} transmission={0.55} thickness={0.04} transparent opacity={muted ? 0.3 : 0.85} />
      </mesh>
      <mesh position={[0.85, 0.7, 0.96]}>
        <boxGeometry args={[0.42, 1.15, 0.05]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0, 2.55, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.55, 8]} />
        <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.3} />
      </mesh>
      <Tag position={[0, 2.85, 0]} text="Oficina" tone={hot ? '#011832' : '#64748b'} />
    </group>
  );
}

function ConsoleUnit({ muted, hot, linked, onChoose }: { muted: boolean; hot: boolean; linked: boolean; onChoose: Choose }) {
  const screen = useMemo(() => consoleScreen(linked), [linked]);
  return (
    <group position={[WORLD.console.x, 0, WORLD.console.z]} onClick={hit(onChoose, 'console')}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.46, 0.8, 0.34]} />
        <meshStandardMaterial color="#0f172a" roughness={0.45} metalness={0.2} emissive={hot ? '#1d4ed8' : '#000'} emissiveIntensity={hot ? 0.28 : 0} transparent={muted} opacity={muted ? 0.4 : 1} />
      </mesh>
      <group position={[0, 1.02, 0]} rotation={[-0.42, 0.4, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.62, 0.4, 0.05]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[0.54, 0.32]} />
          <meshBasicMaterial map={screen} />
        </mesh>
      </group>
      <mesh position={[0.24, 0.66, 0.14]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={hot || linked ? 0.7 : 0.25} />
      </mesh>
      <Tag position={[0, 1.42, 0]} text={linked ? 'C1 · Enlace listo' : 'C1 · Sin enlace'} tone={linked ? '#059669' : '#d97706'} />
    </group>
  );
}

function Navigation({ focus }: { focus: Focus }) {
  const anim = useRef(0);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { camera } = useThree();
  const desiredPos = useRef(new THREE.Vector3(...FRAMES.all.pos));
  const desiredAt = useRef(new THREE.Vector3(...FRAMES.all.at));
  useEffect(() => {
    const frame = FRAMES[focus];
    desiredPos.current.set(...frame.pos);
    desiredAt.current.set(...frame.at);
    anim.current = 0.9;
  }, [focus]);
  useFrame((_, delta) => {
    const orbit = controls.current;
    if (!orbit || anim.current <= 0) return;
    const step = 1 - Math.exp(-delta * 4.2);
    camera.position.lerp(desiredPos.current, step);
    orbit.target.lerp(desiredAt.current, step);
    orbit.update();
    anim.current -= delta;
  });
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan
      maxPolarAngle={1.38}
      minPolarAngle={0.45}
      minDistance={2.6}
      maxDistance={16}
      target={FRAMES.all.at}
      onStart={() => {
        anim.current = 0;
      }}
    />
  );
}

function Scene(props: Props) {
  const { selected, emphasis, phase, linked, focus, onChoose } = props;
  const lit = (id: NodeId) => emphasis === null || emphasis.includes(id);
  const hose = selected && (selected === 'm1' || selected === 'm2' || selected === 'm3' || selected === 'm4') ? selected : null;
  useEffect(() => () => {
    document.body.style.cursor = '';
  }, []);
  return (
    <>
      <color attach="background" args={['#d7e0e8']} />
      <fog attach="fog" args={['#d7e0e8', 16, 34]} />
      <hemisphereLight args={['#f8fafc', '#c4b8a8', 0.55]} />
      <ambientLight intensity={0.18} />
      <pointLight position={[-1.4, -0.2, 1.6]} intensity={0.8} distance={5} color="#fff4e8" />
      <directionalLight
        position={[7, 12, 6]}
        intensity={1.85}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={32}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.00035}
      />
      <directionalLight position={[2, 3, 9]} intensity={0.9} color="#f8fafc" />
      <directionalLight position={[-6, 4, -2]} intensity={0.28} color="#e7d5c4" />
      <Suspense fallback={null}>
        <Environment resolution={128}>
          <Lightformer form="rect" intensity={3.2} position={[5, 6, 6]} scale={[9, 5, 1]} color="#ffffff" />
          <Lightformer form="rect" intensity={1.1} position={[-6, 3, 2]} scale={[6, 3, 1]} color="#dbe7f5" />
          <Lightformer form="rect" intensity={0.7} position={[0, 5, -6]} scale={[8, 2, 1]} color="#fff4e5" />
        </Environment>
      </Suspense>
      <Site onChoose={onChoose} />
      <UndergroundTank muted={!lit('tank')} hot={selected === 'tank'} linked={linked} onChoose={onChoose} />
      <ProbeAssembly muted={!lit('probe')} hot={selected === 'probe' || phase === 'origin'} onChoose={onChoose} />
      <ProductPipes quiet={emphasis !== null && !emphasis.includes('dispenser')} />
      <Dispenser muted={!lit('dispenser')} hot={selected === 'dispenser'} hotHose={hose} onChoose={onChoose} />
      <Canopy muted={!lit('dispenser')} />
      <Office muted={!lit('office')} hot={selected === 'office'} onChoose={onChoose} />
      <ConsoleUnit muted={!lit('console')} hot={selected === 'console' || phase === 'target' || phase === 'confirm'} linked={linked} onChoose={onChoose} />
      {(phase === 'origin' || phase === 'target' || selected === 'probe' || selected === 'tank') && (
        <Beacon position={[WORLD.sump.x, 0.05, WORLD.sump.z]} color="#f59e0b" radius={0.46} />
      )}
      {(phase === 'target' || phase === 'confirm') && (
        <Beacon position={[WORLD.console.x, 0.04, WORLD.console.z]} color="#10b981" radius={0.55} />
      )}
      {phase === 'target' && <GhostCable from={CABLE[0]} />}
      {(phase === 'confirm' || linked) && <DataCable linked={linked} />}
      <Navigation focus={focus} />
    </>
  );
}

export default function PhysicalView(props: Props) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: FRAMES.all.pos, fov: 36, near: 0.1, far: 80 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.98 }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
      onPointerMissed={() => props.onChoose(null)}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = '';
      }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
