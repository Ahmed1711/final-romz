"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

const COLS = 100;
const ROWS = 44;
const SEP = 0.3;
const COUNT = COLS * ROWS;

function ParticleWave() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    // Lightened brand indigo/red so points read against the navy-deep hero.
    const indigo = new THREE.Color("#7d76e8");
    const red = new THREE.Color("#d94f4f");
    const c = new THREE.Color();
    let i = 0;
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        positions[i * 3] = (col - COLS / 2) * SEP;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = (row - ROWS / 2) * SEP;
        // Ease keeps the field mostly indigo with a red sweep at one edge,
        // following the brand's ~70/30 primary-to-accent rule.
        const mix = Math.pow(col / COLS, 2.2);
        c.copy(indigo).lerp(red, mix);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
        i++;
      }
    }
    return { positions, colors };
  }, []);

  useFrame((state) => {
    const points = pointsRef.current;
    if (!points) return;
    const t = state.clock.elapsedTime;
    const pos = points.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    let i = 0;
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        arr[i * 3 + 1] =
          Math.sin(col * 0.28 + t * 0.9) * 0.35 +
          Math.cos(row * 0.45 + t * 0.55) * 0.3;
        i++;
      }
    }
    pos.needsUpdate = true;

    const cam = state.camera;
    cam.position.x += (state.pointer.x * 1.1 - cam.position.x) * 0.04;
    cam.position.y += (2.4 + state.pointer.y * 0.4 - cam.position.y) * 0.04;
    cam.lookAt(0, 0, 0);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export default function HeroCanvas({
  active,
  onReady,
}: {
  active: boolean;
  onReady?: () => void;
}) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.5]}
      camera={{ position: [0, 2.4, 7], fov: 55, near: 0.1, far: 60 }}
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      onCreated={() => onReady?.()}
    >
      <ParticleWave />
    </Canvas>
  );
}
