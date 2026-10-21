import type { ReactNode } from 'react';

export const TONE = {
  grass: '#86c46a',
  pad: '#ece7dc',
  padEdge: '#c9c2b2',
  soil: '#8a5a38',
  soilDark: '#5c3822',
  shell: '#3bb66a',
  shellDeep: '#1f8a45',
  fuel: '#d8872b',
  fuelGlow: '#f3d36b',
  body: '#f7fafc',
  steel: '#d5dde4',
  accent: '#2563eb',
  accentDeep: '#1d4ed8',
  navy: '#0f2744',
  amber: '#f59e0b',
  ok: '#22c55e',
  wait: '#f59e0b',
  empty: '#94a3b8',
};

export function Box({
  p,
  s,
  color,
  metal = 0.08,
  rough = 0.55,
  cast = false,
  receive = false,
}: {
  p: [number, number, number];
  s: [number, number, number];
  color: string;
  metal?: number;
  rough?: number;
  cast?: boolean;
  receive?: boolean;
}) {
  return (
    <mesh position={p} castShadow={cast} receiveShadow={receive}>
      <boxGeometry args={s} />
      <meshStandardMaterial color={color} metalness={metal} roughness={rough} />
    </mesh>
  );
}

export function Cyl({
  p,
  r,
  h,
  color,
  rot,
  metal = 0.12,
  rough = 0.42,
  cast = false,
  segs = 28,
}: {
  p: [number, number, number];
  r: number;
  h: number;
  color: string;
  rot?: [number, number, number];
  metal?: number;
  rough?: number;
  cast?: boolean;
  segs?: number;
}) {
  return (
    <mesh position={p} rotation={rot} castShadow={cast}>
      <cylinderGeometry args={[r, r, h, segs]} />
      <meshStandardMaterial color={color} metalness={metal} roughness={rough} />
    </mesh>
  );
}

export function Lamp({ p, color, size = 0.07 }: { p: [number, number, number]; color: string; size?: number }) {
  return (
    <mesh position={p}>
      <sphereGeometry args={[size, 14, 14]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
    </mesh>
  );
}

export function Pad({ w, d, y = 0.04, color = TONE.pad }: { w: number; d: number; y?: number; color?: string }) {
  return (
    <group>
      <Box p={[0, y, 0]} s={[w, 0.08, d]} color={color} rough={0.9} receive />
      <Box p={[0, y + 0.03, 0]} s={[w - 0.12, 0.02, d - 0.12]} color="#f4f1ea" rough={0.86} />
    </group>
  );
}

export function SoftGroup({ children }: { children: ReactNode }) {
  return <group>{children}</group>;
}
