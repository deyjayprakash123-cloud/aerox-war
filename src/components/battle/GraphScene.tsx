"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Html, Line } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { RepoStats } from "@/types/battle";

/* ═══════════════════════════════════════════════════════
   GraphScene — 3D Analysis Comparison Graph
   ═══════════════════════════════════════════════════════ */

interface GraphProps {
  fighter1: RepoStats;
  fighter2: RepoStats;
}

// ── Normalize metrics to a 0-100 scale for visual comparison ──
function getMetrics(stats: RepoStats) {
  return [
    {
      label: "POWER",
      value: Math.min((stats.powerScore / 10) * 100, 100),
      raw: stats.powerScore.toLocaleString(undefined, { maximumFractionDigits: 0 }),
    },
    {
      label: "VELOCITY",
      value: Math.min(stats.commitVelocity, 100),
      raw: `${stats.commitVelocity} c/w`,
    },
    {
      label: "COMPLEXITY",
      value: Math.min((stats.totalLinesOfCode / 500000) * 100, 100),
      raw: `${(stats.totalLinesOfCode / 1000).toFixed(1)}k LOC`,
    },
    {
      label: "STABILITY",
      value: (stats.closedIssues / (stats.openIssues + stats.closedIssues || 1)) * 100,
      raw: `${Math.round((stats.closedIssues / (stats.openIssues + stats.closedIssues || 1)) * 100)}%`,
    },
    {
      label: "POPULARITY",
      value: Math.min((stats.stars / 50000) * 100, 100),
      raw: `${stats.stars.toLocaleString()} ⭐`,
    },
  ];
}

// ── Individual 3D Bar ──
function DataBar({
  value,
  raw,
  color,
  position,
  label,
  delay,
}: {
  value: number;
  raw: string;
  color: string;
  position: [number, number, number];
  label: string;
  delay: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const targetHeight = Math.max((value / 100) * 8, 0.5); // Max height 8 units

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    
    // Animate height growing on load
    const currentScale = meshRef.current.scale.y;
    if (t > delay && currentScale < 1) {
      meshRef.current.scale.y += (1 - currentScale) * 0.1;
    }

    // Gentle pulse
    if (glowRef.current) {
      glowRef.current.intensity = 0.5 + Math.sin(t * 2 + delay) * 0.2;
    }
  });

  return (
    <group position={position}>
      {/* ── Base Pad ── */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.65, 0.7, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>

      {/* ── The Bar ── */}
      <mesh ref={meshRef} position={[0, targetHeight / 2, 0]} scale={[1, 0.01, 1]}>
        <cylinderGeometry args={[0.4, 0.4, targetHeight, 6]} />
        <meshStandardMaterial
          color={color}
          metalness={0.8}
          roughness={0.2}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* ── Wireframe skeleton for high-tech look ── */}
      <mesh position={[0, targetHeight / 2, 0]}>
        <cylinderGeometry args={[0.42, 0.42, targetHeight, 6]} />
        <meshBasicMaterial
          color={color}
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* ── Inner Glow ── */}
      <pointLight ref={glowRef} color={color} distance={4} position={[0, targetHeight / 2, 0]} />

      {/* ── Data Particles ── */}
      <DataParticles position={[0, 0, 0]} color={color} height={targetHeight} />

      {/* ── Value Label (HTML Overlay) ── */}
      <Html position={[0, targetHeight + 0.5, 0]} center>
        <div style={{
          color: color,
          fontFamily: "var(--font-mono)",
          fontSize: "0.85rem",
          fontWeight: "bold",
          textShadow: `0 0 10px ${color}`,
          background: "rgba(0,0,0,0.5)",
          padding: "2px 8px",
          borderRadius: "4px",
          border: `1px solid ${color}40`,
          whiteSpace: "nowrap"
        }}>
          {raw}
        </div>
      </Html>

      {/* ── Metric Label ── */}
      <Text
        position={[0, -0.6, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.35}
        color="rgba(255,255,255,0.5)"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

// ── Floor Grid ──
function AnalysisGrid() {
  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vWorldPos;
        float grid(float c) {
          float d = fwidth(c);
          return 1.0 - min(abs(fract(c - 0.5) - 0.5) / d, 1.0);
        }
        void main() {
          float gx = grid(vWorldPos.x * 1.0);
          float gz = grid(vWorldPos.z * 1.0);
          float g = max(gx, gz);
          float dist = length(vWorldPos.xz);
          float fade = 1.0 - smoothstep(5.0, 20.0, dist);
          
          // Radar sweep effect
          float angle = atan(vWorldPos.z, vWorldPos.x);
          float sweep = fract((angle + uTime) / (2.0 * 3.14159));
          float scanGlow = smoothstep(0.8, 1.0, sweep) * smoothstep(1.0, 0.99, sweep);
          
          float alpha = (g * 0.15 + scanGlow * 0.3) * fade;
          vec3 col = mix(vec3(0.0, 0.5, 1.0), vec3(0.0, 0.9, 1.0), scanGlow);
          
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });
  }, []);

  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime * 1.5;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} material={mat}>
      <planeGeometry args={[50, 50, 1, 1]} />
    </mesh>
  );
}

// ── Scanning Laser ──
function ScanningLaser() {
  const laserRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!laserRef.current) return;
    const t = state.clock.elapsedTime;
    // Sweep back and forth along X axis
    laserRef.current.position.x = Math.sin(t * 0.8) * 8;
  });

  return (
    <mesh ref={laserRef} position={[0, 4, 0]}>
      <boxGeometry args={[0.05, 10, 15]} />
      <meshBasicMaterial color="#00e5ff" transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

// ── Connection Lines ──
function ConnectionLine({ start, end, value1, value2 }: { start: THREE.Vector3, end: THREE.Vector3, value1: number, value2: number }) {
  const lineRef = useRef<any>(null);
  const points = useMemo(() => [start, end], [start, end]);
  
  // Color the line based on who is winning this metric
  const color = value1 > value2 ? "#ff6a00" : value1 < value2 ? "#00e5ff" : "#ffffff";
  const opacity = Math.abs(value1 - value2) > 10 ? 0.6 : 0.2; // Brighter if big difference

  useFrame((state) => {
    if (!lineRef.current?.material) return;
    const t = state.clock.elapsedTime;
    lineRef.current.material.opacity = opacity + Math.sin(t * 3) * 0.1;
  });

  return (
    <Line
      ref={lineRef}
      points={points}
      color={color}
      lineWidth={2}
      transparent
      opacity={opacity}
    />
  );
}

// ── Data Particles ──
function DataParticles({ position, color, height }: { position: [number, number, number], color: string, height: number }) {
  const ref = useRef<THREE.Points>(null);
  const count = 30;

  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = position[0] + (Math.random() - 0.5) * 0.8;
      pos[i * 3 + 1] = Math.random() * height;
      pos[i * 3 + 2] = position[2] + (Math.random() - 0.5) * 0.8;
      spd[i] = Math.random() * 0.5 + 0.2;
    }
    return { positions: pos, speeds: spd };
  }, [count, position, height]);

  useFrame((state) => {
    if (!ref.current) return;
    const posAttr = ref.current.geometry.attributes.position;
    if (!posAttr) return;
    const arr = posAttr.array as Float32Array;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * 0.05;
      if (arr[i * 3 + 1] > height + 1) {
        arr[i * 3 + 1] = 0; // Reset to bottom
      }
    }
    posAttr.needsUpdate = true;
  });

  const geoRef = useRef<THREE.BufferGeometry>(null);

  return (
    <points ref={ref}>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.05} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

// ── Holographic Containment Rings ──
function ContainmentRings() {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = Math.PI / 2;
      ring1Ref.current.rotation.z = t * 0.1;
      ring1Ref.current.position.y = Math.sin(t * 0.5) * 0.5 + 4;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = Math.PI / 2 + 0.2;
      ring2Ref.current.rotation.y = t * 0.15;
      ring2Ref.current.position.y = Math.cos(t * 0.4) * 0.5 + 2;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x = Math.PI / 2 - 0.2;
      ring3Ref.current.rotation.y = -t * 0.2;
      ring3Ref.current.position.y = 0.1;
    }
  });

  return (
    <group>
      <mesh ref={ring1Ref}>
        <ringGeometry args={[12, 12.05, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring2Ref}>
        <ringGeometry args={[14, 14.02, 64]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring3Ref}>
        <ringGeometry args={[16, 16.1, 64]} />
        <meshBasicMaterial color="#ff6a00" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ── Main Scene Content ──
function SceneContent({ f1, f2 }: { f1: RepoStats; f2: RepoStats }) {
  const metrics1 = useMemo(() => getMetrics(f1), [f1]);
  const metrics2 = useMemo(() => getMetrics(f2), [f2]);
  
  const numMetrics = metrics1.length;
  const spacingX = 2.5;
  const startX = -((numMetrics - 1) * spacingX) / 2;

  return (
    <group position={[0, -2, 0]}>
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 10, 5]} intensity={0.5} />

      <AnalysisGrid />
      <ScanningLaser />
      <ContainmentRings />

      {/* Connection Lines */}
      {metrics1.map((m, i) => (
        <ConnectionLine
          key={`conn-${i}`}
          start={new THREE.Vector3(startX + i * spacingX, 0.2, -1.2)}
          end={new THREE.Vector3(startX + i * spacingX, 0.2, 1.2)}
          value1={m.value}
          value2={metrics2[i].value}
        />
      ))}

      {/* Render bars for Fighter 1 (Orange) */}
      {metrics1.map((m, i) => (
        <DataBar
          key={`f1-${i}`}
          value={m.value}
          raw={m.raw}
          label={m.label}
          color="#ff6a00"
          position={[startX + i * spacingX, 0, -1.2]}
          delay={i * 0.1}
        />
      ))}

      {/* Render bars for Fighter 2 (Cyan) */}
      {metrics2.map((m, i) => (
        <DataBar
          key={`f2-${i}`}
          value={m.value}
          raw={m.raw}
          label="" // Label rendered on F1 side
          color="#00e5ff"
          position={[startX + i * spacingX, 0, 1.2]}
          delay={0.5 + i * 0.1}
        />
      ))}

      {/* Title Text in 3D Space */}
      <Text
        position={[0, 9, -2]}
        fontSize={0.8}
        color="#ffffff"
        anchorX="center"
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf"
      >
        AEROX-WAR DEEP SCAN ANALYSIS
      </Text>

      {/* Orbit Controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={10}
        maxDistance={30}
        minPolarAngle={Math.PI * 0.1}
        maxPolarAngle={Math.PI * 0.45}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </group>
  );
}

export default function GraphScene({ fighter1, fighter2 }: GraphProps) {
  return (
    <div className="absolute inset-0 z-10" style={{ background: "#060610" }}>
      {/* Legend Overlay */}
      <div className="absolute top-24 left-8 bg-black/40 border border-white/10 p-4 rounded-xl backdrop-blur-md text-xs font-mono text-white/70 z-20 pointer-events-none w-64">
        <h3 className="text-white/90 font-bold mb-3 tracking-widest text-sm">TELEMETRY KEY</h3>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-3 h-3 rounded-full" style={{ background: "#ff6a00", boxShadow: "0 0 10px #ff6a00" }} />
          <span>{fighter1.name}</span>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-3 h-3 rounded-full" style={{ background: "#00e5ff", boxShadow: "0 0 10px #00e5ff" }} />
          <span>{fighter2.name}</span>
        </div>

        <h3 className="text-white/90 font-bold mb-2 tracking-widest text-[10px] uppercase opacity-50">Power Algorithm</h3>
        <div className="space-y-2 text-[10px] leading-tight mb-4 border-b border-white/10 pb-4">
          <p><span className="text-[#ff6a00] font-bold">40% COMPLEXITY</span> (Codebase Size)</p>
          <p><span className="text-[#00e5ff] font-bold">30% VELOCITY</span> (Commit Rate)</p>
          <p><span className="text-[#00ff88] font-bold">30% STABILITY</span> (Bug Fix Ratio)</p>
          <p className="text-white/50 italic mt-2">* Popularity/Stars are explicitly excluded from the Power Score to ensure pure technical merit.</p>
        </div>

        <h3 className="text-white/90 font-bold mb-2 tracking-widest text-[10px] uppercase opacity-50">Metrics Glossary</h3>
        <div className="space-y-2 text-[10px] leading-tight">
          <p><span className="text-white/90 font-bold">POWER:</span> The true engineering strength of the repo.</p>
          <p><span className="text-white/90 font-bold">VELOCITY:</span> Code shipment speed (commits per week).</p>
          <p><span className="text-white/90 font-bold">COMPLEXITY:</span> Codebase weight derived from Total Lines of Code.</p>
          <p><span className="text-white/90 font-bold">STABILITY:</span> Issue resolution health (closed vs open issues).</p>
          <p><span className="text-white/90 font-bold">POPULARITY:</span> Social proof, measured by total Stars & Forks.</p>
        </div>
      </div>

      <Canvas
        camera={{ position: [0, 8, 18], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={["#060610"]} />
        <fog attach="fog" args={["#060610", 15, 40]} />
        <SceneContent f1={fighter1} f2={fighter2} />
        <EffectComposer>
          <Bloom
            intensity={1.2}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
