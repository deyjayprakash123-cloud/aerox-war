"use client";

import { useRef, useMemo, useCallback, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import InfiniteGrid from "./InfiniteGrid";
import FighterJet from "./FighterJet";
import { RepoStats, BattleEvent } from "@/types/battle";

/* ═══════════════════════════════════════════════════════
   BattleArena — Main 3D Canvas Scene
   ═══════════════════════════════════════════════════════ */

interface BattleArenaProps {
  fighter1: RepoStats;
  fighter2: RepoStats;
  lastEvent: BattleEvent | null;
}

// Camera shake component
function CameraShake({ active }: { active: boolean }) {
  const { camera } = useThree();
  const shakeRef = useRef({ intensity: 0, decay: 0.95 });

  useEffect(() => {
    if (active) {
      shakeRef.current.intensity = 0.4;
    }
  }, [active]);

  useFrame(() => {
    const shake = shakeRef.current;
    if (shake.intensity > 0.001) {
      camera.position.x += (Math.random() - 0.5) * shake.intensity;
      camera.position.y += (Math.random() - 0.5) * shake.intensity * 0.5;
      shake.intensity *= shake.decay;
    }
  });

  return null;
}

// Gentle cinematic camera drift
function CameraDrift() {
  const { camera } = useThree();
  const basePos = useRef({ x: 0, y: 6, z: 14 });

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Soft breathing motion
    camera.position.y = basePos.current.y + Math.sin(t * 0.15) * 0.4;
    camera.position.x = basePos.current.x + Math.sin(t * 0.1) * 0.3;
  });

  return null;
}

// Orange flash overlay
function FlashOverlay({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useEffect(() => {
    if (active && matRef.current) {
      matRef.current.opacity = 0.3;
    }
  }, [active]);

  useFrame(() => {
    if (matRef.current && matRef.current.opacity > 0.001) {
      matRef.current.opacity *= 0.93;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -5]} renderOrder={999}>
      <planeGeometry args={[50, 50]} />
      <meshBasicMaterial
        ref={matRef}
        color="#ff6a00"
        transparent
        opacity={0}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Scene content (inside Canvas)
function SceneContent({ fighter1, fighter2, lastEvent }: BattleArenaProps) {
  const [f1Firing, setF1Firing] = useState(false);
  const [f2Firing, setF2Firing] = useState(false);
  const [f1Shield, setF1Shield] = useState(false);
  const [f2Shield, setF2Shield] = useState(false);
  const [shakeActive, setShakeActive] = useState(false);
  const [flashActive, setFlashActive] = useState(false);

  // Process battle events
  useEffect(() => {
    if (!lastEvent) return;

    switch (lastEvent.type) {
      case "star":
        // Firing animation
        if (lastEvent.fighter === "fighter1") {
          setF1Firing(true);
          setTimeout(() => setF1Firing(false), 100);
        } else {
          setF2Firing(true);
          setTimeout(() => setF2Firing(false), 100);
        }
        break;

      case "pr_merged":
        // Shield pulse
        if (lastEvent.fighter === "fighter1") {
          setF1Shield(true);
          setTimeout(() => setF1Shield(false), 100);
        } else {
          setF2Shield(true);
          setTimeout(() => setF2Shield(false), 100);
        }
        break;

      case "power_surge":
        // Screen shake + flash
        setShakeActive(true);
        setFlashActive(true);
        setTimeout(() => {
          setShakeActive(false);
          setFlashActive(false);
        }, 100);
        break;

      case "commit_burst":
        // Rapid fire
        const target = lastEvent.fighter === "fighter1" ? setF1Firing : setF2Firing;
        target(true);
        setTimeout(() => target(false), 100);
        break;
    }
  }, [lastEvent]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[10, 10, 5]} intensity={0.3} color="#ffffff" />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#ff6a00" distance={30} />
      <pointLight position={[0, 3, -5]} intensity={0.3} color="#00e5ff" distance={20} />

      {/* Starfield background */}
      <Stars
        radius={80}
        depth={50}
        count={3000}
        factor={3}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* Infinite wireframe grid */}
      <InfiniteGrid />

      {/* Fighter 1 — Orange (left) */}
      <FighterJet
        position={[-4, 1.5, 0]}
        color="#ff6a00"
        contributors={fighter1.activeContributors}
        linesOfCode={fighter1.totalLinesOfCode}
        commitVelocity={fighter1.commitVelocity}
        powerScore={fighter1.powerScore}
        side="left"
        firing={f1Firing}
        shieldPulse={f1Shield}
      />

      {/* Fighter 2 — Cyan (right) */}
      <FighterJet
        position={[4, 1.5, 0]}
        color="#00e5ff"
        contributors={fighter2.activeContributors}
        linesOfCode={fighter2.totalLinesOfCode}
        commitVelocity={fighter2.commitVelocity}
        powerScore={fighter2.powerScore}
        side="right"
        firing={f2Firing}
        shieldPulse={f2Shield}
      />

      {/* Camera shake effect */}
      <CameraShake active={shakeActive} />

      {/* Cinematic camera drift */}
      <CameraDrift />

      {/* Flash overlay for power surges */}
      <FlashOverlay active={flashActive} />

      {/* Post-processing bloom for neon glow */}
      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
      </EffectComposer>

      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={6}
        maxDistance={25}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.45}
        autoRotate
        autoRotateSpeed={0.3}
        target={[0, 1, 0]}
      />
    </>
  );
}

export default function BattleArena({
  fighter1,
  fighter2,
  lastEvent,
}: BattleArenaProps) {
  return (
    <div className="absolute inset-0" style={{ background: "#0a0a0f" }}>
      <Canvas
        camera={{ position: [0, 6, 14], fov: 50, near: 0.1, far: 200 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={["#0a0a0f"]} />
        <fog attach="fog" args={["#0a0a0f", 20, 60]} />
        <SceneContent
          fighter1={fighter1}
          fighter2={fighter2}
          lastEvent={lastEvent}
        />
      </Canvas>
    </div>
  );
}
