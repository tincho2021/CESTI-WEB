import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';

type Tilt = { x: number; y: number };

function RushGrid() {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const node = group.current;
    if (!node) return;
    node.position.z += delta * 2.8;
    if (node.position.z > 3) node.position.z -= 3;
  });

  return (
    <group ref={group}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.86, 0]}>
        <planeGeometry args={[90, 90]} />
        <meshBasicMaterial color="#071018" />
      </mesh>
      <Grid
        position={[0, -1.84, 0]}
        args={[40, 40]}
        cellSize={0.7}
        cellThickness={0.8}
        cellColor="#155e75"
        sectionSize={2.8}
        sectionThickness={1.6}
        sectionColor="#22d3ee"
        fadeDistance={26}
        fadeStrength={1.15}
        infiniteGrid
      />
      <mesh position={[0, -1.2, -12]}>
        <planeGeometry args={[40, 4]} />
        <meshBasicMaterial color="#0891b2" transparent opacity={0.16} />
      </mesh>
    </group>
  );
}

function Dust() {
  const points = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const count = 820;
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      data[i * 3] = (Math.random() - 0.5) * 30;
      data[i * 3 + 1] = Math.random() * 9 - 0.8;
      data[i * 3 + 2] = (Math.random() - 0.5) * 28;
    }
    const next = new THREE.BufferGeometry();
    next.setAttribute('position', new THREE.BufferAttribute(data, 3));
    return next;
  }, []);

  useFrame((_, delta) => {
    if (!points.current) return;
    points.current.rotation.y += delta * 0.035;
    points.current.position.z += delta * 0.35;
    if (points.current.position.z > 4) points.current.position.z = 0;
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        size={0.055}
        color="#7dd3fc"
        transparent
        opacity={0.78}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function DataBeams() {
  const lines = useMemo(() => ([
    [new THREE.Vector3(-6, 0.2, -2), new THREE.Vector3(-1.2, 1.4, 1.5), new THREE.Vector3(3.4, 1.8, 0.4)],
    [new THREE.Vector3(-5.2, -0.4, 1.5), new THREE.Vector3(0.4, 0.6, 0.2), new THREE.Vector3(3.8, 0.9, -1.2)],
    [new THREE.Vector3(-4.6, 1.6, -3), new THREE.Vector3(-0.2, 2.2, -0.4), new THREE.Vector3(2.8, 2.4, 1.1)],
  ]), []);

  const geometries = useMemo(
    () => lines.map((points) => {
      const curve = new THREE.CatmullRomCurve3(points);
      return new THREE.TubeGeometry(curve, 48, 0.012, 6, false);
    }),
    [lines],
  );

  useFrame((_, delta) => {
    dash.current = (dash.current + delta * 1.6) % 1;
  });

  return (
    <group>
      {geometries.map((geometry, index) => (
        <mesh key={index} geometry={geometry}>
          <meshBasicMaterial
            color={index === 1 ? '#ef4444' : '#22d3ee'}
            transparent
            opacity={0.55}
          />
        </mesh>
      ))}
    </group>
  );
}

function CameraRig({ tilt }: { tilt: Tilt }) {
  useFrame(({ camera }) => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, tilt.x * 0.85, 0.045);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.15 + tilt.y * 0.35, 0.045);
    camera.lookAt(0.8, 0.45, 0);
  });
  return null;
}

const HeroField = ({ tilt }: { tilt: Tilt }) => (
  <div className="absolute inset-0 z-0 pointer-events-none">
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 1.15, 7.2], fov: 48, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={['#05070c']} />
      <fog attach="fog" args={['#05070c', 8, 26]} />
      <ambientLight intensity={0.28} />
      <pointLight position={[5, 3.2, 3]} intensity={18} color="#00b0ff" distance={18} />
      <pointLight position={[-4, 2.4, 1]} intensity={10} color="#dc2626" distance={14} />
      <RushGrid />
      <Dust />
      <DataBeams />
      <CameraRig tilt={tilt} />
    </Canvas>
  </div>
);

export default HeroField;
