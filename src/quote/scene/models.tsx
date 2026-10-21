import { useMemo } from 'react';
import * as THREE from 'three';
import type { ScenePort } from './ports';
import type { ConnectionType, SceneObject } from '../types';
import type { ProbeVisual } from './logic';
import { deviceLabel } from '../library';
import { Box, Cyl, Lamp, Pad, TONE } from './kit';

function useLabelTexture(text: string, accent = '#94a3b8', detail = '') {
  return useMemo(() => {
    const title = text.slice(0, 36);
    const subtitle = detail.slice(0, 52);
    const probe = document.createElement('canvas').getContext('2d');
    if (!probe) return null;
    probe.font = 'bold 48px sans-serif';
    const titleWidth = probe.measureText(title).width;
    probe.font = 'bold 30px sans-serif';
    const detailWidth = subtitle ? probe.measureText(subtitle).width : 0;
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(Math.max(280, Math.min(1280, Math.max(titleWidth, detailWidth) + 110)));
    canvas.height = subtitle ? 148 : 96;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(255,255,255,0.96)';
    context.fillRect(4, 4, canvas.width - 8, canvas.height - 8);
    context.strokeStyle = 'rgba(15,23,42,0.1)';
    context.strokeRect(4.5, 4.5, canvas.width - 9, canvas.height - 9);
    context.fillStyle = accent;
    context.beginPath();
    context.arc(36, subtitle ? 52 : 48, 14, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#0f172a';
    context.font = 'bold 48px sans-serif';
    context.textBaseline = 'middle';
    context.fillText(title, 62, subtitle ? 52 : 48);
    if (subtitle) {
      context.fillStyle = accent;
      context.font = 'bold 30px sans-serif';
      context.fillText(subtitle, 62, 108);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    return texture;
  }, [text, accent, detail]);
}

function useScreen(lines: string[], accent: string) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 160;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.fillStyle = '#021018';
    context.fillRect(0, 0, 256, 160);
    context.strokeStyle = accent;
    context.lineWidth = 4;
    context.strokeRect(10, 10, 236, 140);
    context.fillStyle = accent;
    context.font = 'bold 28px sans-serif';
    lines.forEach((line, index) => context.fillText(line.slice(0, 14), 22, 52 + index * 36));
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, [lines.join('|'), accent]);
}

export function NameLabel({
  text,
  detail = '',
  position,
  visible,
  scale = 1,
  tone = '#94a3b8',
}: {
  text: string;
  detail?: string;
  position: [number, number, number];
  visible: boolean;
  scale?: number;
  tone?: string;
}) {
  const texture = useLabelTexture(text, tone, detail);
  if (!visible || !texture) return null;
  const image = texture.image as { width?: number; height?: number };
  const aspect = image.width && image.height ? image.width / image.height : 4;
  const height = (detail ? 0.63 : 0.45) * scale;
  return (
    <sprite position={position} scale={[height * aspect, height, 1]}>
      <spriteMaterial map={texture} transparent depthTest={false} />
    </sprite>
  );
}

function SelectionRing({ selected, radius = 1.05 }: { selected: boolean; radius?: number }) {
  void selected;
  void radius;
  return null;
}

export function createCorrugationMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.fillStyle = '#1d4ed8';
  context.fillRect(0, 0, 256, 32);
  for (let x = 0; x < 256; x += 8) {
    context.fillStyle = '#1e3a8a';
    context.fillRect(x, 0, 3, 32);
    context.fillStyle = '#93c5fd';
    context.fillRect(x + 3, 0, 2, 32);
    context.fillStyle = 'rgba(255,255,255,0.35)';
    context.fillRect(x + 5, 0, 1, 32);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(28, 1);
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function useCorrugation() {
  return useMemo(() => createCorrugationMap(), []);
}

function canvasTexture(width: number, height: number, draw: (context: CanvasRenderingContext2D, width: number, height: number) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return null;
  draw(context, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

export function createAsphaltMap() {
  return canvasTexture(512, 512, (context, width, height) => {
    context.fillStyle = '#f3e2c4';
    context.fillRect(0, 0, width, height);
    for (let index = 0; index < 900; index += 1) {
      const shade = 228 + Math.floor(Math.random() * 18);
      context.fillStyle = `rgb(${shade},${shade - 18},${shade - 48})`;
      context.fillRect(Math.random() * width, Math.random() * height, Math.random() * 3 + 0.5, Math.random() * 2 + 0.4);
    }
    context.fillStyle = 'rgba(255,255,255,0.12)';
    context.fillRect(0, 0, width, height);
  });
}

export function createGrassMap() {
  return canvasTexture(256, 256, (context, width, height) => {
    context.fillStyle = '#8fce62';
    context.fillRect(0, 0, width, height);
    for (let index = 0; index < 1800; index += 1) {
      context.fillStyle = Math.random() > 0.5 ? '#8ed072' : '#5fa84e';
      context.fillRect(Math.random() * width, Math.random() * height, 2, 5 + Math.random() * 6);
    }
  });
}

function createConcreteMap() {
  return canvasTexture(256, 256, (context, width, height) => {
    context.fillStyle = '#d9d4cc';
    context.fillRect(0, 0, width, height);
    for (let index = 0; index < 700; index += 1) {
      const shade = 180 + Math.floor(Math.random() * 40);
      context.fillStyle = `rgb(${shade},${shade - 4},${shade - 8})`;
      context.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }
    context.strokeStyle = 'rgba(90,80,70,0.25)';
    context.strokeRect(8, 8, 240, 240);
  });
}

function createSteelMap() {
  return canvasTexture(128, 256, (context, width, height) => {
    context.fillStyle = '#f3f5f4';
    context.fillRect(0, 0, width, height);
    for (let y = 0; y < height; y += 3) {
      context.fillStyle = y % 6 === 0 ? 'rgba(180,190,196,0.45)' : 'rgba(255,255,255,0.25)';
      context.fillRect(0, y, width, 1);
    }
  });
}

function useConcrete() {
  return useMemo(() => createConcreteMap(), []);
}

function useSteel() {
  return useMemo(() => createSteelMap(), []);
}

function RidgeRadio({ solar }: { solar: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.07, 0]} castShadow>
        <boxGeometry args={[0.34, 0.14, 0.2]} />
        <meshStandardMaterial color="#111827" roughness={0.45} />
      </mesh>
      <mesh position={[0.08, 0.28, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.3, 8]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.4} />
      </mesh>
      <mesh position={[0.08, 0.44, 0]}>
        <sphereGeometry args={[0.035, 10, 10]} />
        <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={0.45} />
      </mesh>
      {solar && (
        <mesh position={[-0.02, 0.18, 0.02]} rotation={[0.45, 0.15, -0.2]}>
          <boxGeometry args={[0.3, 0.02, 0.2]} />
          <meshStandardMaterial color="#1e3a8a" emissive="#1d4ed8" emissiveIntensity={0.25} />
        </mesh>
      )}
    </group>
  );
}

function Shell({ radius, length, start, sweep, color, y = 0.44, rough = 0.38 }: { radius: number; length: number; start: number; sweep: number; color: string; y?: number; rough?: number }) {
  return (
    <mesh rotation={[0, 0, Math.PI / 2]} position={[0, y, 0]} castShadow>
      <cylinderGeometry args={[radius, radius, length, 48, 1, false, start, sweep]} />
      <meshStandardMaterial color={color} metalness={0.04} roughness={rough} />
    </mesh>
  );
}

export function UndergroundTank({
  selected,
  label,
  showLabel,
  probe,
  product,
  wireless = false,
  solar = false,
  onSelectProbe,
  tone = '#94a3b8',
  detail = '',
}: {
  selected: boolean;
  label: string;
  showLabel: boolean;
  probe: ProbeVisual;
  product?: string;
  wireless?: boolean;
  solar?: boolean;
  onSelectProbe?: () => void;
  tone?: string;
  detail?: string;
}) {
  const lamp = probe === 'linked' ? TONE.ok : probe === 'unlinked' ? TONE.wait : TONE.empty;
  return (
    <group>
      <SelectionRing selected={selected} radius={1.85} />
      <Box p={[0, 0.04, 0.05]} s={[3.7, 0.08, 1.85]} color="#c48a5a" receive />
      <Box p={[0, 0.22, -0.72]} s={[3.55, 0.28, 0.22]} color="#d7a57a" />
      <Box p={[-1.72, 0.2, 0.05]} s={[0.2, 0.26, 1.35]} color="#d7a57a" />
      <Box p={[1.72, 0.2, 0.05]} s={[0.2, 0.26, 1.35]} color="#d7a57a" />
      <Box p={[0, 0.4, -0.86]} s={[3.85, 0.07, 0.2]} color="#f6f0e4" />
      <Box p={[-1.86, 0.38, 0.05]} s={[0.16, 0.06, 1.55]} color="#f6f0e4" />
      <Box p={[1.86, 0.38, 0.05]} s={[0.16, 0.06, 1.55]} color="#f6f0e4" />
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.52, 0]} castShadow>
        <cylinderGeometry args={[0.48, 0.48, 2.05, 40]} />
        <meshStandardMaterial color="#3dbe72" roughness={0.34} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.495, 0.495, 1.9, 40, 1, false, Math.PI * 0.82, Math.PI * 0.62]} />
        <meshStandardMaterial color="#e39b2d" roughness={0.3} />
      </mesh>
      {[-1.02, 1.02].map((x) => (
        <mesh key={x} position={[x, 0.52, 0]} scale={[0.36, 1, 1]} castShadow>
          <sphereGeometry args={[0.48, 24, 16]} />
          <meshStandardMaterial color="#3dbe72" roughness={0.34} />
        </mesh>
      ))}
      {[-0.55, 0.55].map((x) => (
        <mesh key={`band${x}`} rotation={[0, 0, Math.PI / 2]} position={[x, 0.52, 0]}>
          <cylinderGeometry args={[0.51, 0.51, 0.07, 32]} />
          <meshStandardMaterial color="#1c7a42" roughness={0.4} />
        </mesh>
      ))}
      <group position={[-0.55, 1.02, 0.08]} onClick={(event) => { if (!onSelectProbe) return; event.stopPropagation(); onSelectProbe(); }}>
        <Cyl p={[0, 0, 0]} r={0.13} h={0.08} color="#d7e0e8" metal={0.45} />
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.15, 0.02, 8, 20]} />
          <meshStandardMaterial color="#c5d0da" metalness={0.4} />
        </mesh>
        {probe === 'none' ? (
          <>
            <Cyl p={[0, 0.06, 0]} r={0.07} h={0.03} color="#1e293b" />
            <Lamp p={[0.2, 0.14, 0]} color={lamp} size={0.055} />
          </>
        ) : (
          <>
            <Cyl p={[0, -0.22, 0]} r={0.02} h={0.48} color="#f8fafc" metal={0.7} />
            <Cyl p={[0, 0.18, 0]} r={0.08} h={0.2} color="#f5c518" cast />
            <Lamp p={[0.07, 0.2, 0.04]} color={lamp} size={0.03} />
          </>
        )}
      </group>
      <group position={[0.62, 1.05, 0.1]}>
        <Cyl p={[0, 0, 0]} r={0.11} h={0.07} color="#d5dee6" metal={0.4} />
        <mesh position={[0, 0.08, 0]}>
          <sphereGeometry args={[0.08, 16, 12]} />
          <meshStandardMaterial color="#e11d48" roughness={0.35} />
        </mesh>
      </group>
      {(wireless || solar) && <group position={[0.15, 1.02, 0]}><RidgeRadio solar={solar} /></group>}
      <NameLabel text={product ? `${label} · ${product}` : label} detail={detail} tone={tone} position={[0, 1.7, 0.2]} visible={showLabel} />
    </group>
  );
}

export function VerticalTank({
  selected,
  label,
  showLabel,
  solar,
  wireless,
  probe,
  onSelectProbe,
  tone = '#94a3b8',
  detail = '',
}: {
  selected: boolean;
  label: string;
  showLabel: boolean;
  solar: boolean;
  wireless: boolean;
  probe: ProbeVisual;
  onSelectProbe?: () => void;
  tone?: string;
  detail?: string;
}) {
  const lamp = probe === 'linked' ? TONE.ok : probe === 'unlinked' ? TONE.wait : TONE.empty;
  return (
    <group>
      <SelectionRing selected={selected} radius={1.15} />
      <Box p={[0, 0.04, 0]} s={[2.1, 0.08, 2.1]} color="#efe6d6" receive />
      <Cyl p={[0, 1.35, 0]} r={0.7} h={2.1} color="#f7faf8" rough={0.4} cast segs={36} />
      <Cyl p={[0, 0.68, 0]} r={0.715} h={0.66} color="#e39b2d" rough={0.32} segs={36} />
      <Cyl p={[0, 1.12, 0]} r={0.73} h={0.07} color="#15803d" segs={36} />
      <mesh position={[0, 2.62, 0]} castShadow>
        <coneGeometry args={[0.78, 0.36, 28]} />
        <meshStandardMaterial color="#f4f7f5" roughness={0.42} />
      </mesh>
      {[-0.16, 0.16].map((x) => (
        <Box key={x} p={[x, 1.2, 0.74]} s={[0.035, 1.6, 0.035]} color="#475569" metal={0.4} />
      ))}
      {[0.5, 0.9, 1.3, 1.7].map((y) => (
        <Box key={y} p={[0, y, 0.74]} s={[0.32, 0.03, 0.04]} color="#64748b" metal={0.35} />
      ))}
      <Cyl p={[0.78, 0.55, 0.2]} r={0.045} h={0.22} color="#d5dde4" metal={0.55} rot={[0, 0, Math.PI / 2]} />
      <Box p={[0.9, 0.55, 0.2]} s={[0.1, 0.12, 0.12]} color="#b91c1c" />
      <group position={[0, 2.86, 0]} onClick={(event) => { if (!onSelectProbe) return; event.stopPropagation(); onSelectProbe(); }}>
        <Cyl p={[0, 0, 0]} r={0.1} h={0.06} color="#94a3b8" metal={0.4} />
        {probe === 'none' ? <Lamp p={[0.16, 0.12, 0]} color={lamp} size={0.06} /> : (
          <>
            <Cyl p={[0, 0.16, 0]} r={0.055} h={0.22} color="#facc15" />
            <Lamp p={[0.08, 0.16, 0]} color={lamp} size={0.03} />
          </>
        )}
      </group>
      {(wireless || solar) && <group position={[0.12, 2.72, 0.12]}><RidgeRadio solar={solar} /></group>}
      <NameLabel text={label} detail={detail} tone={tone} position={[0, 3.55, 0]} visible={showLabel} />
    </group>
  );
}

function PumpNozzle({ x, face, canopy }: { x: number; face: number; canopy: number }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(x, canopy - 0.08, 0.02),
    new THREE.Vector3(x, canopy - 0.7, face + 0.12),
    new THREE.Vector3(x, 1.42, face + 0.08),
  ]), [x, face, canopy]);
  return (
    <group>
      <mesh castShadow>
        <tubeGeometry args={[curve, 20, 0.028, 8, false]} />
        <meshStandardMaterial color="#14181e" roughness={0.42} />
      </mesh>
      <mesh position={[x, 1.18, face + 0.04]}>
        <boxGeometry args={[0.16, 0.34, 0.07]} />
        <meshStandardMaterial color="#1b2430" roughness={0.48} />
      </mesh>
      <group position={[x, 1.28, face + 0.12]}>
        <mesh castShadow rotation={[0.7, 0, 0]}>
          <boxGeometry args={[0.1, 0.22, 0.06]} />
          <meshStandardMaterial color="#1fa85a" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.07, 0.03]} rotation={[0.7, 0, 0]}>
          <sphereGeometry args={[0.04, 14, 14]} />
          <meshStandardMaterial color="#0d1116" />
        </mesh>
        <mesh position={[0, -0.04, 0.09]} rotation={[1.2, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.022, 0.1, 10]} />
          <meshStandardMaterial color="#d5dee6" metalness={0.65} roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
}

export function Dispenser({
  selected,
  label,
  showLabel,
  loading = false,
  hoseCount = 2,
  brand = '',
  tone = '#94a3b8',
  detail = '',
}: {
  selected: boolean;
  label: string;
  showLabel: boolean;
  loading?: boolean;
  hoseCount?: number;
  brand?: string;
  tone?: string;
  detail?: string;
}) {
  const count = Math.max(1, Math.min(8, Math.round(hoseCount || 2)));
  const width = Math.max(1.25, 0.95 + Math.ceil(count / 2) * 0.16);
  const depth = 0.58;
  const face = depth / 2;
  const canopy = 2.45;
  const cap = loading ? '#e8a23a' : '#242a32';
  const screen = useScreen([brand || (loading ? 'CARGA' : 'LISTO'), String(count)], '#bbf7d0');
  const slots = Array.from({ length: count }, (_, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const row = Math.floor(index / 2);
    return side * (0.38 + row * 0.14);
  });
  return (
    <group>
      <SelectionRing selected={selected} radius={Math.max(1.15, width * 0.7)} />
      <Box p={[0, 0.05, 0]} s={[width + 0.85, 0.1, 1.35]} color="#efe8da" receive />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => (
        <group key={`${sx}${sz}`} position={[(width / 2 + 0.28) * sx, 0.24, 0.48 * sz]}>
          <Cyl p={[0, 0, 0]} r={0.04} h={0.32} color="#f4c542" />
          <Cyl p={[0, 0.13, 0]} r={0.046} h={0.035} color="#1f2937" />
        </group>
      ))}
      <Box p={[0, 0.38, 0]} s={[width * 0.88, 0.46, depth * 0.96]} color="#1a1f27" />
      <Box p={[0, 1.28, 0]} s={[width * 0.76, 1.4, depth]} color="#e7edf3" rough={0.38} cast />
      <Box p={[0, 1.35, face + 0.012]} s={[0.5, 0.82, 0.03]} color="#d7e0ea" />
      {[-1, 1].map((side) => (
        <Box key={side} p={[side * (width / 2 + 0.03), 1.28, 0]} s={[0.09, 2.25, 0.09]} color="#c5ced8" metal={0.45} />
      ))}
      <Box p={[0, canopy, 0]} s={[width + 0.42, 0.12, 0.95]} color={cap} cast />
      <Box p={[0, 1.48, face + 0.035]} s={[0.38, 0.24, 0.02]} color="#0e141c" />
      {screen && (
        <mesh position={[0, 1.48, face + 0.05]}>
          <planeGeometry args={[0.3, 0.16]} />
          <meshBasicMaterial map={screen} />
        </mesh>
      )}
      {slots.map((x, index) => <PumpNozzle key={index} x={x} face={face} canopy={canopy} />)}
      <NameLabel text={label} detail={detail || `${count} mangueras`} tone={tone} position={[0, 2.55, 0]} visible={showLabel} />
    </group>
  );
}

function GableRoof() {
  const geometry = useMemo(() => {
    const positions = new Float32Array([
      -1.28, 1.55, 0.95, 1.28, 1.55, 0.95, 1.28, 2.05, 0,
      -1.28, 1.55, 0.95, 1.28, 2.05, 0, -1.28, 2.05, 0,
      -1.28, 2.05, 0, 1.28, 2.05, 0, 1.28, 1.55, -0.95,
      -1.28, 2.05, 0, 1.28, 1.55, -0.95, -1.28, 1.55, -0.95,
    ]);
    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    buffer.computeVertexNormals();
    return buffer;
  }, []);
  return (
    <mesh geometry={geometry} castShadow>
      <meshStandardMaterial color="#2f6fe4" side={THREE.DoubleSide} roughness={0.4} />
    </mesh>
  );
}

export function Office({ selected, label, showLabel, online, tone = '#94a3b8', detail = '' }: { selected: boolean; label: string; showLabel: boolean; online: boolean; tone?: string; detail?: string }) {
  return (
    <group>
      <SelectionRing selected={selected} radius={1.6} />
      <Pad w={2.7} d={2.1} />
      <Box p={[0, 0.78, 0]} s={[2.15, 1.42, 1.55]} color={TONE.body} rough={0.68} cast receive />
      <Box p={[0, 1.52, 0]} s={[2.4, 0.06, 1.75]} color="#e8eef6" />
      <GableRoof />
      {[-0.5, 0.18].map((x) => (
        <group key={x} position={[x, 0.98, 0.79]}>
          <Box p={[0, 0, 0]} s={[0.5, 0.5, 0.04]} color="#0f172a" />
          <mesh position={[0, 0, 0.03]}>
            <planeGeometry args={[0.4, 0.38]} />
            <meshStandardMaterial color="#7dd3fc" emissive="#0284c7" emissiveIntensity={0.22} />
          </mesh>
        </group>
      ))}
      <Box p={[0.78, 0.52, 0.8]} s={[0.38, 0.88, 0.06]} color="#1e3a8a" />
      <Lamp p={[0.62, 0.55, 0.86]} color="#facc15" size={0.03} />
      <Cyl p={[-1.05, 2.28, 0]} r={0.025} h={0.46} color="#94a3b8" metal={0.5} />
      {online && <Lamp p={[-1.05, 2.54, 0]} color={TONE.ok} size={0.05} />}
      <NameLabel text={label} detail={detail} tone={tone} position={[0, 2.95, 0]} visible={showLabel} />
    </group>
  );
}

export function ConsoleUnit({ selected, label, showLabel, leak = false, tone = '#94a3b8', detail = '' }: { selected: boolean; label: string; showLabel: boolean; leak?: boolean; tone?: string; detail?: string }) {
  const screen = useScreen([leak ? 'FUGAS' : 'NIVEL', 'CESTI'], leak ? '#fb7185' : '#67e8f9');
  return (
    <group>
      <SelectionRing selected={selected} radius={0.7} />
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[0.98, 0.08, 0.62]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.58, 0]} castShadow>
        <boxGeometry args={[0.78, 0.96, 0.4]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.45} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.78, 0.2]}>
        <boxGeometry args={[0.58, 0.4, 0.03]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {screen && (
        <mesh position={[0, 0.78, 0.22]}>
          <planeGeometry args={[0.5, 0.32]} />
          <meshBasicMaterial map={screen} />
        </mesh>
      )}
      <mesh position={[0.46, 0.7, 0]}>
        <boxGeometry args={[0.08, 0.62, 0.28]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>
      {[-0.16, 0, 0.16].map((x, index) => (
        <mesh key={x} position={[x, 0.42, 0.22]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color={index === 2 ? (leak ? '#fb7185' : '#22c55e') : '#e2e8f0'} emissive={index === 2 ? (leak ? '#fb7185' : '#22c55e') : '#000000'} emissiveIntensity={index === 2 ? 0.4 : 0} />
        </mesh>
      ))}
      <NameLabel text={label} detail={detail} tone={tone} position={[0, 1.7, 0]} visible={showLabel} />
    </group>
  );
}

export function ProbeModel({ selected, label, showLabel }: { selected: boolean; label: string; showLabel: boolean }) {
  return (
    <group>
      <SelectionRing selected={selected} radius={0.35} />
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 1.3, 10]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.08, 12]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <NameLabel text={label} position={[0, 1.7, 0]} visible={showLabel} />
    </group>
  );
}

export function ControllerUnit({ selected, label, showLabel, wifi = false, tone = '#94a3b8', detail = '' }: { selected: boolean; label: string; showLabel: boolean; wifi?: boolean; tone?: string; detail?: string }) {
  return (
    <group>
      <SelectionRing selected={selected} radius={0.6} />
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[0.92, 0.06, 0.56]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.78, 0.68, 0.42]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} metalness={0.06} />
      </mesh>
      <mesh position={[0, 0.55, 0.22]}>
        <boxGeometry args={[0.48, 0.22, 0.02]} />
        <meshStandardMaterial color="#0e7490" />
      </mesh>
      <mesh position={[0, 0.55, 0.232]}>
        <planeGeometry args={[0.42, 0.16]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
      <mesh position={[-0.46, 0.42, 0]}>
        <boxGeometry args={[0.08, 0.5, 0.28]} />
        <meshStandardMaterial color="#c4b5fd" />
      </mesh>
      <mesh position={[0, 0.86, 0]}>
        <boxGeometry args={[0.22, 0.12, 0.18]} />
        <meshStandardMaterial color="#6d28d9" />
      </mesh>
      {wifi && (
        <mesh position={[0.22, 1.05, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.32, 6]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.4} />
        </mesh>
      )}
      <NameLabel text={label} detail={detail} tone={tone} position={[0, 1.55, 0]} visible={showLabel} />
    </group>
  );
}

export function FuelPump({ selected, label, showLabel }: { selected: boolean; label: string; showLabel: boolean }) {
  return (
    <group>
      <SelectionRing selected={selected} radius={0.9} />
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[1.45, 0.08, 0.72]} />
        <meshStandardMaterial color="#3f3f46" metalness={0.45} roughness={0.5} />
      </mesh>
      {[-0.62, 0.62].map((x) => [-0.28, 0.28].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0.02, z]}>
          <cylinderGeometry args={[0.04, 0.04, 0.04, 8]} />
          <meshStandardMaterial color="#71717a" metalness={0.7} />
        </mesh>
      )))}
      <mesh position={[-0.22, 0.38, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.26, 0.22, 28]} />
        <meshStandardMaterial color="#3f3f46" metalness={0.55} roughness={0.38} />
      </mesh>
      <mesh position={[-0.22, 0.38, 0.12]}>
        <cylinderGeometry args={[0.18, 0.18, 0.03, 24]} />
        <meshStandardMaterial color="#27272a" metalness={0.4} roughness={0.45} />
      </mesh>
      <mesh position={[0.32, 0.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.55, 22]} />
        <meshStandardMaterial color="#1d4ed8" metalness={0.35} roughness={0.4} />
      </mesh>
      {[0.18, 0.28, 0.38, 0.48].map((x) => (
        <mesh key={x} position={[x, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.17, 0.012, 6, 16]} />
          <meshStandardMaterial color="#1e3a8a" metalness={0.4} />
        </mesh>
      ))}
      <mesh position={[0.62, 0.4, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.08, 20]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {[-0.72, 0.78].map((x) => (
        <mesh key={x} position={[x, 0.32, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.28, 12]} />
          <meshStandardMaterial color="#d4d4d8" metalness={0.75} roughness={0.25} />
        </mesh>
      ))}
      <NameLabel text={label} position={[0, 0.95, 0]} visible={showLabel} />
    </group>
  );
}

export function FlowMeter({ selected, label, showLabel }: { selected: boolean; label: string; showLabel: boolean }) {
  const dial = useScreen(['CAUDAL', '0.00'], '#bfdbfe');
  return (
    <group>
      <SelectionRing selected={selected} radius={0.75} />
      <mesh position={[0, 0.28, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.7, 20]} />
        <meshStandardMaterial color="#e4e4e7" metalness={0.72} roughness={0.22} />
      </mesh>
      {[-0.48, 0.48].map((x) => (
        <mesh key={x} position={[x, 0.28, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.14, 0.14, 0.04, 18]} />
          <meshStandardMaterial color="#a1a1aa" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 0.48, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.18, 0.22, 24]} />
        <meshStandardMaterial color="#18181b" metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.04, 24]} />
        <meshStandardMaterial color="#e4e4e7" metalness={0.5} />
      </mesh>
      {dial && (
        <mesh position={[0, 0.645, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.1, 24]} />
          <meshBasicMaterial map={dial} />
        </mesh>
      )}
      <NameLabel text={label} position={[0, 1.0, 0]} visible={showLabel} />
    </group>
  );
}

export function MechanicalMeter({ selected, label, showLabel }: { selected: boolean; label: string; showLabel: boolean }) {
  const digits = useScreen(['00000', 'LITROS'], '#d9f99d');
  return (
    <group>
      <SelectionRing selected={selected} radius={0.8} />
      <mesh position={[0, 0.22, 0]} receiveShadow>
        <boxGeometry args={[1.15, 0.08, 0.55]} />
        <meshStandardMaterial color="#44403c" metalness={0.4} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.36, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.11, 0.11, 0.85, 16]} />
        <meshStandardMaterial color="#d4d4d8" metalness={0.7} roughness={0.28} />
      </mesh>
      {[-0.48, 0.48].map((x) => (
        <mesh key={x} position={[x, 0.36, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.04, 16]} />
          <meshStandardMaterial color="#a1a1aa" metalness={0.65} />
        </mesh>
      ))}
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[0.7, 0.38, 0.36]} />
        <meshStandardMaterial color="#f4f4f5" roughness={0.4} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.74, 0.19]}>
        <boxGeometry args={[0.52, 0.16, 0.02]} />
        <meshStandardMaterial color="#09090b" />
      </mesh>
      {digits && (
        <mesh position={[0, 0.74, 0.205]}>
          <planeGeometry args={[0.46, 0.12]} />
          <meshBasicMaterial map={digits} />
        </mesh>
      )}
      <mesh position={[0.28, 0.52, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.04, 12]} />
        <meshStandardMaterial color="#b45309" metalness={0.45} roughness={0.35} />
      </mesh>
      <NameLabel text={label} position={[0, 1.15, 0]} visible={showLabel} />
    </group>
  );
}

export function ConnectionNodes({
  ports,
  active,
  named,
  onPick,
}: {
  ports: ScenePort[];
  active: boolean;
  named: boolean;
  onPick: (port: ScenePort) => void;
}) {
  return (
    <group>
      {ports.map((port) => (
        <group
          key={port.id}
          position={[port.x, port.y, port.z]}
          onClick={(event) => { event.stopPropagation(); onPick(port); }}
          onPointerDown={(event) => { event.stopPropagation(); }}
        >
          <mesh>
            <sphereGeometry args={[active ? 0.48 : 0.36, 12, 12]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          <mesh position={[0, -0.12, 0]}>
            <cylinderGeometry args={[0.045, 0.06, 0.22, 10]} />
            <meshStandardMaterial color={port.color} />
          </mesh>
          <mesh>
            <sphereGeometry args={[active ? 0.18 : 0.13, 18, 18]} />
            <meshStandardMaterial color={port.color} emissive={port.color} emissiveIntensity={active ? 1.15 : 0.7} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[active ? 0.3 : 0.22, 0.035, 8, 28]} />
            <meshStandardMaterial color={port.color} emissive={port.color} emissiveIntensity={active ? 0.95 : 0.35} />
          </mesh>
          <NameLabel text={port.short} position={[0, 0.22, 0]} visible={named} scale={0.48} />
        </group>
      ))}
    </group>
  );
}

export function RfidTerminal({ selected, label, showLabel }: { selected: boolean; label: string; showLabel: boolean }) {
  const screen = useScreen(['RFID', 'RLCD'], '#a7f3d0');
  return (
    <group>
      <SelectionRing selected={selected} radius={0.5} />
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[0.42, 1.15, 0.28]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.22, 0.24, 0.08, 16]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      {screen && (
        <mesh position={[0, 0.85, 0.15]}>
          <planeGeometry args={[0.28, 0.2]} />
          <meshBasicMaterial map={screen} />
        </mesh>
      )}
      <mesh position={[0, 0.5, 0.15]}>
        <boxGeometry args={[0.16, 0.05, 0.02]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <NameLabel text={label} position={[0, 1.45, 0]} visible={showLabel} />
    </group>
  );
}

export function SensorPuck({ selected, label, showLabel, gas = false }: { selected: boolean; label: string; showLabel: boolean; gas?: boolean }) {
  return (
    <group>
      <SelectionRing selected={selected} radius={0.4} />
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.2, 0.16, 20]} />
        <meshStandardMaterial color={gas ? '#fbbf24' : '#0ea5e9'} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <NameLabel text={label} position={[0, 0.6, 0]} visible={showLabel} />
    </group>
  );
}

export function OverflowBeacon({ selected, label, showLabel }: { selected: boolean; label: string; showLabel: boolean }) {
  return (
    <group>
      <SelectionRing selected={selected} radius={0.4} />
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.9, 8]} />
        <meshStandardMaterial color="#64748b" metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.7} />
      </mesh>
      <NameLabel text={label} position={[0, 1.35, 0]} visible={showLabel} />
    </group>
  );
}

export function CommsModule({ selected, label, showLabel }: { selected: boolean; label: string; showLabel: boolean }) {
  return (
    <group>
      <SelectionRing selected={selected} radius={0.5} />
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[0.55, 0.5, 0.3]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[0.1, 0.7, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.45, 8]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0, 0.28, 0.16]}>
        <boxGeometry args={[0.12, 0.08, 0.02]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.4} />
      </mesh>
      <NameLabel text={label} position={[0, 1.1, 0]} visible={showLabel} />
    </group>
  );
}

export function CloudNode({ selected, label, showLabel }: { selected: boolean; label: string; showLabel: boolean }) {
  return (
    <group>
      <SelectionRing selected={selected} radius={0.7} />
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.28, 0.32, 0.12, 20]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-0.12, 0.55, 0]}>
        <sphereGeometry args={[0.18, 18, 18]} />
        <meshStandardMaterial color="#e0f2fe" emissive="#38bdf8" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0.12, 0.62, 0.05]}>
        <sphereGeometry args={[0.22, 18, 18]} />
        <meshStandardMaterial color="#f0f9ff" emissive="#7dd3fc" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.02, 0.48, -0.08]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color="#e0f2fe" />
      </mesh>
      <NameLabel text={label} position={[0, 1.15, 0]} visible={showLabel} />
    </group>
  );
}

export function ReceiverKit({ selected, label, showLabel }: { selected: boolean; label: string; showLabel: boolean }) {
  return (
    <group>
      <SelectionRing selected={selected} radius={0.55} />
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.4, 0.22, 0.28]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0.28, 0.7, 0]} rotation={[0, 0, 0.6]}>
        <boxGeometry args={[0.45, 0.03, 0.28]} />
        <meshStandardMaterial color="#1e3a8a" emissive="#1d4ed8" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[-0.05, 0.85, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.5, 6]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>
      <NameLabel text={label} position={[0, 1.25, 0]} visible={showLabel} />
    </group>
  );
}

export function ServiceCrate({ selected, label, showLabel }: { selected: boolean; label: string; showLabel: boolean }) {
  return (
    <group>
      <SelectionRing selected={selected} radius={0.55} />
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[0.7, 0.42, 0.5]} />
        <meshStandardMaterial color="#011832" />
      </mesh>
      <mesh position={[0, 0.28, 0.26]}>
        <boxGeometry args={[0.36, 0.08, 0.02]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
      <NameLabel text={label} position={[0, 0.8, 0]} visible={showLabel} />
    </group>
  );
}

export function EquipmentModel({
  object,
  selected,
  showLabel,
  probe,
  onSelectProbe,
  tone = '#94a3b8',
  detail = '',
}: {
  object: SceneObject;
  selected: boolean;
  showLabel: boolean;
  probe: ProbeVisual;
  onSelectProbe?: () => void;
  tone?: string;
  detail?: string;
}) {
  const label = deviceLabel(object);
  if (object.kind === 'tank-underground') {
    return (
      <UndergroundTank
        selected={selected}
        label={label}
        showLabel={showLabel}
        probe={probe}
        product={object.props.product || object.props.customProduct}
        wireless={object.props.comms === 'wireless' || object.props.comms === 'wireless-solar'}
        solar={object.props.comms === 'wireless-solar'}
        onSelectProbe={onSelectProbe}
        tone={tone}
        detail={detail}
      />
    );
  }
  if (object.kind === 'tank-vertical') {
    return (
      <VerticalTank
        selected={selected}
        label={label}
        showLabel={showLabel}
        probe={probe}
        solar={object.props.comms === 'wireless-solar'}
        wireless={object.props.comms === 'wireless' || object.props.comms === 'wireless-solar'}
        onSelectProbe={onSelectProbe}
        tone={tone}
        detail={detail}
      />
    );
  }
  if (object.kind === 'dispenser' || object.kind === 'loading-point') {
    return (
      <Dispenser
        selected={selected}
        label={label}
        showLabel={showLabel}
        loading={object.kind === 'loading-point'}
        hoseCount={object.props.hoseCount ?? object.props.outlets?.length ?? 2}
        brand={object.props.brand}
        tone={tone}
        detail={detail}
      />
    );
  }
  if (object.kind === 'office') {
    return <Office selected={selected} label={label} showLabel={showLabel} online={object.props.internet === true || object.props.wifi === true} tone={tone} detail={detail} />;
  }
  if (object.role === 'leak-console') return <ConsoleUnit selected={selected} label={label} showLabel={showLabel} leak tone={tone} detail={detail} />;
  if (object.kind === 'console') return <ConsoleUnit selected={selected} label={label} showLabel={showLabel} tone={tone} detail={detail} />;
  if (object.kind === 'probe') return <ProbeModel selected={selected} label={label} showLabel={showLabel} />;
  if (object.kind === 'controller') return <ControllerUnit selected={selected} label={label} showLabel={showLabel} wifi={object.props.wifi === true} tone={tone} detail={detail} />;
  if (object.kind === 'fuel-pump') return <FuelPump selected={selected} label={label} showLabel={showLabel} />;
  if (object.kind === 'flow-meter') return <FlowMeter selected={selected} label={label} showLabel={showLabel} />;
  if (object.kind === 'mechanical-meter') return <MechanicalMeter selected={selected} label={label} showLabel={showLabel} />;
  if (object.kind === 'rfid') return <RfidTerminal selected={selected} label={label} showLabel={showLabel} />;
  if (object.kind === 'leak-liquid') return <SensorPuck selected={selected} label={label} showLabel={showLabel} />;
  if (object.kind === 'leak-gas') return <SensorPuck selected={selected} label={label} showLabel={showLabel} gas />;
  if (object.kind === 'overflow') return <OverflowBeacon selected={selected} label={label} showLabel={showLabel} />;
  if (object.kind === 'comms') return <CommsModule selected={selected} label={label} showLabel={showLabel} />;
  if (object.kind === 'cloud') return <CloudNode selected={selected} label={label} showLabel={showLabel} />;
  if (object.kind === 'receiver') return <ReceiverKit selected={selected} label={label} showLabel={showLabel} />;
  return <ServiceCrate selected={selected} label={label} showLabel={showLabel} />;
}

export const CONNECTION_COLORS: Record<ConnectionType, string> = {
  sensor: '#f59e0b',
  rs485: '#1e3a8a',
  wireless: '#c026d3',
  ethernet: '#059669',
  wifi: '#06b6d4',
  cloud: '#38bdf8',
  'dispenser-control': '#6d28d9',
  alarm: '#dc2626',
  process: '#3b82f6',
  association: '#14b8a6',
};
