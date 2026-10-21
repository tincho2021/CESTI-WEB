/** Estado local de la demostración visual. No es el modelo de la cotización. */

export type NodeId =
  | 'tank'
  | 'probe'
  | 'dispenser'
  | 'console'
  | 'office'
  | 'm1'
  | 'm2'
  | 'm3'
  | 'm4';

export type Phase = 'idle' | 'origin' | 'target' | 'confirm';
export type Focus = 'all' | 'tank' | 'dispenser' | 'console';

export const HOSES = ['m1', 'm2', 'm3', 'm4'] as const;
export type HoseId = (typeof HOSES)[number];

export function isHose(id: NodeId): id is HoseId {
  return id === 'm1' || id === 'm2' || id === 'm3' || id === 'm4';
}

export const WORLD = {
  tank: { x: -2.2, y: -1.06, z: 0.18, length: 3.8, radius: 0.76 },
  sump: { x: -1.02, z: 0.18 },
  dispenser: { x: 3.22, z: 0.42 },
  office: { x: -3.42, z: -2.42 },
  console: { x: 0.15, z: -1.92 },
} as const;

/** Plano de corte del tanque, mirando desde la cámara. */
export const SECTION_Z = 0.62;

export const CABLE: readonly [number, number, number][] = [
  [WORLD.sump.x, 0.4, WORLD.sump.z],
  [WORLD.sump.x, 0.52, -1.02],
  [WORLD.console.x + 0.2, 0.52, -1.02],
  [WORLD.console.x + 0.24, 0.66, WORLD.console.z + 0.14],
];

export const FRAMES: Record<Focus, { pos: [number, number, number]; at: [number, number, number] }> = {
  all: { pos: [4.6, 2.05, 6.4], at: [0.85, -0.35, 0.25] },
  tank: { pos: [0.35, 0.28, 3.45], at: [-1.85, -0.82, 0.16] },
  dispenser: { pos: [5.55, 2.55, 3.15], at: [3.22, 0.95, 0.42] },
  console: { pos: [3.35, 2.15, -0.15], at: [1.18, 0.55, -1.72] },
};
