"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

/* ═══════════════════════════════════════════════════════
   TownScene — Procedural 3D city from repo file data

   Building rules:
   ┌──────────────────┬──────────────────────────────┐
   │ File Type        │ Building Style               │
   ├──────────────────┼──────────────────────────────┤
   │ .ts/.js/.tsx     │ Glass tower (cyan glow)      │
   │ .css/.scss       │ Colorful neon building       │
   │ .json/.yaml      │ Data warehouse (orange)      │
   │ .md/.txt         │ Low park bench (green)       │
   │ .py/.go/.rs      │ Industrial block (purple)    │
   │ Directories      │ Road intersections           │
   │ Large file       │ Tall skyscraper              │
   │ Small file       │ Low house                    │
   └──────────────────┴──────────────────────────────┘

   Height = log(fileSize) scaled
   ═══════════════════════════════════════════════════════ */

interface RepoFile {
  path: string;
  name: string;
  type: "file" | "dir";
  size: number;
  extension: string;
}

interface TownData {
  repoName: string;
  repoFullName: string;
  language: string;
  stars: number;
  files: RepoFile[];
  totalFiles: number;
  totalSize: number;
  directories: number;
}

interface TownSceneProps {
  townData: TownData;
  fighterColor: string; // "#ff6a00" or "#00e5ff"
}

// ── File type → color mapping ──
function getFileColor(ext: string): THREE.Color {
  // JavaScript/TypeScript family — cyan glass
  if ([".ts", ".tsx", ".js", ".jsx", ".mjs"].includes(ext))
    return new THREE.Color("#00e5ff");
  // Styles — vibrant pink/magenta
  if ([".css", ".scss", ".sass", ".less", ".styl"].includes(ext))
    return new THREE.Color("#ff4da6");
  // Config/data — warm orange
  if ([".json", ".yaml", ".yml", ".toml", ".xml", ".env"].includes(ext))
    return new THREE.Color("#ff9a40");
  // Documentation — soft green
  if ([".md", ".txt", ".rst", ".mdx"].includes(ext))
    return new THREE.Color("#4ade80");
  // Python/Go/Rust — purple
  if ([".py", ".go", ".rs", ".rb", ".java", ".kt"].includes(ext))
    return new THREE.Color("#a78bfa");
  // C/C++ — steel blue
  if ([".c", ".cpp", ".h", ".hpp"].includes(ext))
    return new THREE.Color("#60a5fa");
  // HTML — coral
  if ([".html", ".htm", ".ejs", ".hbs"].includes(ext))
    return new THREE.Color("#f97316");
  // Shell/scripts
  if ([".sh", ".bash", ".zsh", ".bat", ".ps1"].includes(ext))
    return new THREE.Color("#fbbf24");
  // Default — muted white
  return new THREE.Color("#8888aa");
}

// ── Procedural building from a file ──
function Building({
  file,
  posX,
  posZ,
  maxSize,
}: {
  file: RepoFile;
  posX: number;
  posZ: number;
  maxSize: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  const color = useMemo(() => getFileColor(file.extension), [file.extension]);

  // Height derived from file size (log scale)
  const rawHeight = Math.log10(Math.max(file.size, 10)) * 0.8;
  const height = Math.max(0.3, Math.min(rawHeight, 4.5));

  // Width based on relative size
  const sizeRatio = file.size / Math.max(maxSize, 1);
  const width = 0.3 + sizeRatio * 0.5;
  const depth = 0.3 + sizeRatio * 0.4;

  // Is it a "skyscraper" (large file)?
  const isSkyscraper = file.size > maxSize * 0.3;

  // Gentle hover animation
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    // Subtle breathing glow
    if (glowRef.current) {
      glowRef.current.intensity =
        0.3 + Math.sin(t * 1.5 + posX * 2) * 0.15;
    }
  });

  return (
    <group position={[posX, 0, posZ]}>
      {/* Building body */}
      <mesh ref={meshRef} position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={color}
          metalness={isSkyscraper ? 0.9 : 0.5}
          roughness={isSkyscraper ? 0.1 : 0.4}
          emissive={color}
          emissiveIntensity={isSkyscraper ? 0.2 : 0.08}
          transparent
          opacity={isSkyscraper ? 0.85 : 0.75}
        />
      </mesh>

      {/* Rooftop accent for tall buildings */}
      {height > 1.5 && (
        <mesh position={[0, height + 0.05, 0]}>
          <boxGeometry args={[width * 0.6, 0.1, depth * 0.6]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
      )}

      {/* Window lines (horizontal stripes) */}
      {height > 0.8 &&
        Array.from({ length: Math.min(Math.floor(height / 0.35), 8) }).map(
          (_, i) => (
            <mesh
              key={i}
              position={[0, 0.3 + i * 0.35, depth / 2 + 0.001]}
            >
              <planeGeometry args={[width * 0.8, 0.04]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={0.4}
              />
            </mesh>
          )
        )}

      {/* Glow light on top */}
      <pointLight
        ref={glowRef}
        color={color.getHex()}
        intensity={0.3}
        distance={2 + height}
        position={[0, height + 0.3, 0]}
      />

      {/* Ground shadow/glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[width * 0.8, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.06}
        />
      </mesh>
    </group>
  );
}

// ── Road segments between buildings ──
function Road({
  from,
  to,
  color,
}: {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
}) {
  const lineObj = useMemo(() => {
    const points = [new THREE.Vector3(...from), new THREE.Vector3(...to)];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.12,
    });
    return new THREE.Line(geo, mat);
  }, [from, to, color]);

  return <primitive object={lineObj} />;
}

// ── Ambient particles (population / activity) ──
function TownParticles({ count, color }: { count: number; color: string }) {
  const ref = useRef<THREE.Points>(null);

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 0.5 + 0.1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      speeds[i] = Math.random() * 0.3 + 0.1;
    }
    return { positions, speeds };
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const posAttr = ref.current.geometry.attributes.position;
    if (!posAttr) return;
    const arr = posAttr.array as Float32Array;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      arr[i * 3] += Math.sin(t * speeds[i] + i) * 0.003;
      arr[i * 3 + 2] += Math.cos(t * speeds[i] * 0.7 + i) * 0.003;
    }
    posAttr.needsUpdate = true;
  });

  const geoRef = useRef<THREE.BufferGeometry>(null);

  useEffect(() => {
    if (!geoRef.current) return;
    geoRef.current.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
  }, [positions]);

  return (
    <points ref={ref}>
      <bufferGeometry ref={geoRef} />
      <pointsMaterial
        color={color}
        size={0.06}
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ── Ground grid ──
function TownGrid() {
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
          float gx = grid(vWorldPos.x * 0.5);
          float gz = grid(vWorldPos.z * 0.5);
          float g = max(gx, gz);
          float dist = length(vWorldPos.xz);
          float fade = 1.0 - smoothstep(10.0, 35.0, dist);
          float alpha = g * 0.08 * fade;
          vec3 col = mix(vec3(0.0, 0.9, 1.0), vec3(1.0, 0.42, 0.0), smoothstep(8.0, 20.0, dist));
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });
  }, []);

  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={mat}>
      <planeGeometry args={[80, 80, 1, 1]} />
    </mesh>
  );
}

// ── Camera gentle drift ──
function CameraDrift() {
  const { camera } = useThree();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    camera.position.y += (12 + Math.sin(t * 0.12) * 1.5 - camera.position.y) * 0.01;
    camera.position.x += (Math.sin(t * 0.08) * 2 - camera.position.x) * 0.005;
  });
  return null;
}

// ── Layout algorithm: spiral placement ──
function computeLayout(files: RepoFile[]) {
  const codeFiles = files.filter((f) => f.type === "file");
  const maxSize = Math.max(...codeFiles.map((f) => f.size), 1);

  const buildings: Array<{
    file: RepoFile;
    x: number;
    z: number;
  }> = [];

  // Golden-angle spiral for aesthetic, organic placement
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const spacing = 1.4;

  codeFiles.forEach((file, i) => {
    const angle = i * goldenAngle;
    const radius = spacing * Math.sqrt(i + 1);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    buildings.push({ file, x, z });
  });

  return { buildings, maxSize };
}

// ── Main scene ──
function SceneContent({ townData, fighterColor }: TownSceneProps) {
  const { buildings, maxSize } = useMemo(
    () => computeLayout(townData.files),
    [townData.files]
  );

  // Roads: connect nearby buildings
  const roads = useMemo(() => {
    const result: Array<{
      from: [number, number, number];
      to: [number, number, number];
    }> = [];

    for (let i = 0; i < Math.min(buildings.length, 60); i++) {
      // Connect to next building in spiral
      const next = (i + 1) % buildings.length;
      result.push({
        from: [buildings[i].x, 0.02, buildings[i].z],
        to: [buildings[next].x, 0.02, buildings[next].z],
      });

      // Cross-connections every 5th
      if (i % 5 === 0 && i + 3 < buildings.length) {
        result.push({
          from: [buildings[i].x, 0.02, buildings[i].z],
          to: [buildings[i + 3].x, 0.02, buildings[i + 3].z],
        });
      }
    }
    return result;
  }, [buildings]);

  const particleCount = Math.min(townData.stars * 2, 300) + 50;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.12} />
      <directionalLight
        position={[15, 20, 10]}
        intensity={0.25}
        color="#ffffff"
      />
      <pointLight
        position={[0, 8, 0]}
        intensity={0.4}
        color={fighterColor}
        distance={40}
      />

      {/* Starfield */}
      <Stars radius={80} depth={50} count={2000} factor={2} saturation={0} fade speed={0.3} />

      {/* Ground grid */}
      <TownGrid />

      {/* Roads */}
      {roads.map((road, i) => (
        <Road key={i} from={road.from} to={road.to} color={fighterColor} />
      ))}

      {/* Buildings */}
      {buildings.map((b, i) => (
        <Building
          key={i}
          file={b.file}
          posX={b.x}
          posZ={b.z}
          maxSize={maxSize}
        />
      ))}

      {/* Activity particles */}
      <TownParticles count={particleCount} color={fighterColor} />

      {/* Camera drift */}
      <CameraDrift />

      {/* Bloom */}
      <EffectComposer>
        <Bloom
          intensity={1.3}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
      </EffectComposer>

      {/* Controls */}
      <OrbitControls
        enablePan
        enableZoom
        minDistance={5}
        maxDistance={40}
        minPolarAngle={Math.PI * 0.1}
        maxPolarAngle={Math.PI * 0.45}
        autoRotate
        autoRotateSpeed={0.15}
        target={[0, 1, 0]}
      />
    </>
  );
}

export default function TownScene({ townData, fighterColor }: TownSceneProps) {
  return (
    <div className="absolute inset-0" style={{ background: "#060610" }}>
      <Canvas
        camera={{ position: [8, 12, 16], fov: 45, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={["#060610"]} />
        <fog attach="fog" args={["#060610", 25, 55]} />
        <SceneContent townData={townData} fighterColor={fighterColor} />
      </Canvas>
    </div>
  );
}
