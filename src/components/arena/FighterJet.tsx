"use client";

import { useRef, useMemo, useEffect, forwardRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ── Trail particles helper (imperative geometry) ── */
const TrailPoints = forwardRef<
  THREE.Points,
  {
    trailMat: THREE.ShaderMaterial;
    trailPositions: Float32Array;
    trailSizes: Float32Array;
  }
>(function TrailPoints({ trailMat, trailPositions, trailSizes }, ref) {
  const geoRef = useRef<THREE.BufferGeometry>(null);

  useEffect(() => {
    if (!geoRef.current) return;
    geoRef.current.setAttribute(
      "position",
      new THREE.BufferAttribute(trailPositions, 3)
    );
    geoRef.current.setAttribute(
      "aSize",
      new THREE.BufferAttribute(trailSizes, 1)
    );
  }, [trailPositions, trailSizes]);

  return (
    <points ref={ref} material={trailMat}>
      <bufferGeometry ref={geoRef} />
    </points>
  );
});

/* ═══════════════════════════════════════════════════════
   FighterJet — Procedural low-poly fighter jet

   Dimensions driven by repo stats:
     Wing Span    = f(activeContributors)
     Fuselage Len = f(totalLinesOfCode)
     Engine Glow  = f(commitVelocity)
   ═══════════════════════════════════════════════════════ */

interface FighterJetProps {
  position: [number, number, number];
  color: string;       // "#ff6a00" or "#00e5ff"
  contributors: number;
  linesOfCode: number;
  commitVelocity: number;
  powerScore: number;  // drives flight speed & agility
  side: "left" | "right"; // facing direction
  firing?: boolean;
  shieldPulse?: boolean;
}

export default function FighterJet({
  position,
  color,
  contributors,
  linesOfCode,
  commitVelocity,
  powerScore,
  side,
  firing = false,
  shieldPulse = false,
}: FighterJetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const shieldRef = useRef<THREE.Mesh>(null);
  const projectileRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Points>(null);

  // ── Compute dimensions from stats ──
  const wingspan = Math.max(1.5, Math.min(1 + contributors * 0.15, 6));
  const fuselageLength = Math.max(
    2,
    Math.min(2 + Math.log10(Math.max(linesOfCode, 1)) * 0.8, 6)
  );
  const engineIntensity = Math.min(commitVelocity / 50, 1);
  const trailLength = Math.max(2, Math.min(commitVelocity * 0.3, 10));

  const direction = side === "left" ? 1 : -1;
  const col = useMemo(() => new THREE.Color(color), [color]);

  // ── Fuselage geometry — sleek angular stealth shape ──
  const fuselageGeo = useMemo(() => {
    const shape = new THREE.Shape();
    const hw = 0.22;
    const len = fuselageLength;
    // Sharp needle nose → angular midsection → tapered exhaust
    shape.moveTo(0, len * 0.55);
    shape.lineTo(hw * 0.15, len * 0.42);
    shape.lineTo(hw * 0.5, len * 0.28);
    shape.lineTo(hw * 1.1, len * 0.08);
    shape.lineTo(hw * 1.15, -len * 0.05);
    shape.lineTo(hw * 0.9, -len * 0.28);
    shape.lineTo(hw * 0.7, -len * 0.42);
    shape.lineTo(hw * 0.45, -len * 0.52);
    shape.lineTo(-hw * 0.45, -len * 0.52);
    shape.lineTo(-hw * 0.7, -len * 0.42);
    shape.lineTo(-hw * 0.9, -len * 0.28);
    shape.lineTo(-hw * 1.15, -len * 0.05);
    shape.lineTo(-hw * 1.1, len * 0.08);
    shape.lineTo(-hw * 0.5, len * 0.28);
    shape.lineTo(-hw * 0.15, len * 0.42);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.18,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelSegments: 2,
    });
    geo.center();
    return geo;
  }, [fuselageLength]);

  // ── Canard fins (small forward wings) ──
  const canardGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const cw = wingspan * 0.28;
    const cl = fuselageLength * 0.12;
    const verts = new Float32Array([
      0.15, 0.02, fuselageLength * 0.22,
      cw, 0.04, fuselageLength * 0.22 - cl * 0.3,
      0.2, 0.02, fuselageLength * 0.22 - cl,
      -0.15, 0.02, fuselageLength * 0.22,
      -cw, 0.04, fuselageLength * 0.22 - cl * 0.3,
      -0.2, 0.02, fuselageLength * 0.22 - cl,
    ]);
    geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    geo.setIndex([0, 1, 2, 3, 5, 4]);
    geo.computeVertexNormals();
    return geo;
  }, [wingspan, fuselageLength]);

  // ── Main wings — cranked delta with notched trailing edge ──
  const wingGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const hw = wingspan / 2;
    const wd = fuselageLength * 0.38;
    const verts = new Float32Array([
      // Right wing (5 verts for complex shape)
      0.22, 0, wd * 0.15,
      hw * 0.55, -0.02, wd * 0.22,
      hw, -0.04, wd * 0.05,
      hw * 0.75, -0.03, -wd * 0.5,
      0.25, 0, -wd * 0.85,
      // Left wing
      -0.22, 0, wd * 0.15,
      -hw * 0.55, -0.02, wd * 0.22,
      -hw, -0.04, wd * 0.05,
      -hw * 0.75, -0.03, -wd * 0.5,
      -0.25, 0, -wd * 0.85,
    ]);
    geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    geo.setIndex([0,1,4, 1,3,4, 1,2,3, 5,9,6, 6,9,8, 6,8,7]);
    geo.computeVertexNormals();
    return geo;
  }, [wingspan, fuselageLength]);

  // ── Dual canted vertical stabilizers ──
  const tailGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const h = fuselageLength * 0.22;
    const offset = 0.18;
    const verts = new Float32Array([
      // Right stabilizer (canted outward)
      offset, 0, -fuselageLength * 0.32,
      offset + 0.08, h, -fuselageLength * 0.44,
      offset + 0.04, 0, -fuselageLength * 0.5,
      // Left stabilizer
      -offset, 0, -fuselageLength * 0.32,
      -offset - 0.08, h, -fuselageLength * 0.44,
      -offset - 0.04, 0, -fuselageLength * 0.5,
    ]);
    geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    geo.setIndex([0, 1, 2, 3, 5, 4]);
    geo.computeVertexNormals();
    return geo;
  }, [fuselageLength]);

  // ── Cockpit canopy ──
  const cockpitGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
    return geo;
  }, []);

  // ── Engine trail particles (denser, dual-stream) ──
  const trailPositions = useMemo(() => {
    const count = 160;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const stream = i < count / 2 ? 0.18 : -0.18;
      positions[i * 3] = stream + (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 2] =
        -fuselageLength * 0.5 - Math.random() * trailLength;
    }
    return positions;
  }, [fuselageLength, trailLength]);

  const trailSizes = useMemo(() => {
    const count = 160;
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      sizes[i] = Math.random() * 4 + 1.5;
    }
    return sizes;
  }, []);

  // ── Trail shader material ──
  const trailMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: col },
        uIntensity: { value: engineIntensity },
        uFuselageLen: { value: fuselageLength },
        uTrailLen: { value: trailLength },
      },
      vertexShader: `
        attribute float aSize;
        uniform float uTime;
        uniform float uFuselageLen;
        uniform float uTrailLen;
        varying float vAlpha;

        void main() {
          vec3 pos = position;
          // Animate particles backward
          float offset = mod(pos.z + uFuselageLen * 0.5 + uTime * 3.0, uTrailLen);
          pos.z = -uFuselageLen * 0.5 - offset;
          
          // Spread outward along trail
          float t = offset / uTrailLen;
          pos.x += sin(uTime * 2.0 + float(gl_VertexID) * 0.5) * t * 0.15;
          pos.y += cos(uTime * 2.5 + float(gl_VertexID) * 0.3) * t * 0.15;

          vAlpha = (1.0 - t) * 0.8;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = aSize * (200.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uIntensity;
        varying float vAlpha;

        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float glow = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(uColor, glow * vAlpha * uIntensity);
        }
      `,
    });
  }, [col, engineIntensity, fuselageLength, trailLength]);

  // ── Shield pulse effect ──
  const shieldMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: col },
        uActive: { value: 0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uActive;
        varying vec3 vNormal;
        varying vec3 vPos;

        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
          float wave = sin(vPos.y * 10.0 + uTime * 5.0) * 0.5 + 0.5;
          float alpha = fresnel * wave * uActive * 0.6;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    });
  }, [col]);

  // ── Projectile ──
  const projectileMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0,
    });
  }, [col]);

  // ── Firing animation state ──
  const firingState = useRef({ active: false, progress: 0 });
  const shieldState = useRef({ active: false, progress: 0 });

  useEffect(() => {
    if (firing) {
      firingState.current = { active: true, progress: 0 };
    }
  }, [firing]);

  useEffect(() => {
    if (shieldPulse) {
      shieldState.current = { active: true, progress: 0 };
    }
  }, [shieldPulse]);

  /* ═══════════════════════════════════════════════════════
     FLIGHT DYNAMICS — Power-driven smooth orbital flight
     
     Higher powerScore → faster orbits, wider sweeps,
     more dramatic banking, longer engine trails.
     Lower powerScore  → gentle, slow drifts.
     ═══════════════════════════════════════════════════════ */

  // Normalized power factor (0 → sluggish, 1 → top ace)
  const powerFactor = useMemo(() => {
    return Math.min(Math.max(powerScore / 200, 0.08), 1);
  }, [powerScore]);

  // Flight parameters derived from power
  const flight = useMemo(() => ({
    // Orbit speed — how fast the jet circles
    orbitSpeed: 0.15 + powerFactor * 0.45,
    // Orbit radius — how wide the sweep is
    radiusX: 1.2 + powerFactor * 2.5,
    radiusZ: 0.8 + powerFactor * 2.0,
    // Altitude variation
    altitudeAmp: 0.3 + powerFactor * 0.9,
    altitudeFreq: 0.3 + powerFactor * 0.4,
    // Banking intensity — how much the jet rolls into turns
    bankAngle: 0.08 + powerFactor * 0.35,
    // Pitch intensity — nose follows vertical velocity
    pitchAngle: 0.04 + powerFactor * 0.18,
    // Micro-jitter for liveliness
    jitter: 0.01 + powerFactor * 0.03,
  }), [powerFactor]);

  // Smooth lerp targets — we lerp actual pos/rot toward these
  const smoothPos = useRef(new THREE.Vector3(...position));
  const smoothRot = useRef(new THREE.Euler(0, 0, 0));
  const prevY = useRef(position[1]);

  // ── Animation loop ──
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const sideSign = side === "left" ? -1 : 1;

    // ── Orbital flight path (figure-8 lemniscate) ──
    const orbitT = t * flight.orbitSpeed;

    // X: figure-8 oscillation around home position
    const targetX =
      position[0] +
      Math.sin(orbitT) * flight.radiusX * 0.6 +
      Math.sin(orbitT * 2.1) * flight.radiusX * 0.25;

    // Z: gentle forward-back drift
    const targetZ =
      position[2] +
      Math.cos(orbitT * 0.7) * flight.radiusZ +
      Math.sin(orbitT * 1.3) * flight.radiusZ * 0.3;

    // Y: smooth altitude undulation
    const targetY =
      position[1] +
      Math.sin(orbitT * flight.altitudeFreq) * flight.altitudeAmp +
      Math.sin(orbitT * flight.altitudeFreq * 2.3) * flight.altitudeAmp * 0.3;

    // ── Smooth lerp position (buttery smoothness) ──
    const lerpFactor = 1 - Math.pow(0.001, delta); // frame-rate independent lerp
    smoothPos.current.x += (targetX - smoothPos.current.x) * lerpFactor * 0.8;
    smoothPos.current.y += (targetY - smoothPos.current.y) * lerpFactor * 0.6;
    smoothPos.current.z += (targetZ - smoothPos.current.z) * lerpFactor * 0.8;

    groupRef.current.position.copy(smoothPos.current);

    // ── Compute velocity for banking/pitching ──
    const velocityY = smoothPos.current.y - prevY.current;
    prevY.current = smoothPos.current.y;

    // Horizontal velocity for yaw (nose direction)
    const dx = Math.cos(orbitT) * flight.orbitSpeed * flight.radiusX;

    // ── Banking — roll into the turn ──
    const targetRollZ = -dx * flight.bankAngle;
    // ── Pitching — nose follows vertical direction ──
    const targetPitchX = -velocityY * flight.pitchAngle * 15;
    // ── Micro-jitter for liveliness ──
    const jitterZ = Math.sin(t * 7.3) * flight.jitter;
    const jitterX = Math.sin(t * 5.7) * flight.jitter * 0.5;

    // ── Smooth lerp rotation ──
    const currentRot = groupRef.current.rotation;
    currentRot.z += ((targetRollZ + jitterZ) - currentRot.z) * lerpFactor * 0.5;
    currentRot.x += ((targetPitchX + jitterX) - currentRot.x) * lerpFactor * 0.4;

    // ── Trail animation ──
    trailMat.uniforms.uTime.value = t;

    // ── Shield ──
    shieldMat.uniforms.uTime.value = t;
    if (shieldState.current.active) {
      shieldState.current.progress += delta * 2;
      if (shieldState.current.progress > 1) {
        shieldState.current.active = false;
        shieldState.current.progress = 0;
      }
      const p = shieldState.current.progress;
      const scale = 1 + p * 0.5;
      shieldMat.uniforms.uActive.value =
        p < 0.5 ? p * 2 : (1 - p) * 2;
      if (shieldRef.current) {
        shieldRef.current.scale.setScalar(scale);
      }
    } else {
      shieldMat.uniforms.uActive.value *= 0.95;
    }

    // ── Projectile firing ──
    if (firingState.current.active && projectileRef.current) {
      firingState.current.progress += delta * 4;
      const p = firingState.current.progress;
      projectileMat.opacity = p < 0.3 ? p / 0.3 : Math.max(0, 1 - (p - 0.3) * 1.5);
      projectileRef.current.position.z =
        fuselageLength * 0.5 + p * 12 * direction;
      projectileRef.current.position.x = 0;
      if (p > 1) {
        firingState.current.active = false;
        firingState.current.progress = 0;
        projectileMat.opacity = 0;
        projectileRef.current.position.z = fuselageLength * 0.5;
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, side === "left" ? 0 : Math.PI, 0]}
    >
      {/* ── Primary Fuselage Hull ── */}
      <mesh geometry={fuselageGeo} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.92}
          roughness={0.18}
          emissive={color}
          emissiveIntensity={0.08}
        />
      </mesh>

      {/* ── Fuselage accent stripe (thinner, glowing) ── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[0.85, 0.85, 1.02]}>
        <boxGeometry args={[0.02, fuselageLength * 0.7, 0.22]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>

      {/* ── Canard Fins ── */}
      <mesh geometry={canardGeo}>
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.85}
          roughness={0.2}
          emissive={color}
          emissiveIntensity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Main Wings ── */}
      <mesh geometry={wingGeo}>
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.88}
          roughness={0.2}
          emissive={color}
          emissiveIntensity={0.06}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Wing edge glow strips ── */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * wingspan * 0.35, -0.02, -fuselageLength * 0.08]} rotation={[0, s * 0.15, s * -0.04]}>
          <boxGeometry args={[wingspan * 0.32, 0.008, 0.015]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} />
        </mesh>
      ))}

      {/* ── Dual Vertical Stabilizers ── */}
      <mesh geometry={tailGeo}>
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.85}
          roughness={0.22}
          emissive={color}
          emissiveIntensity={0.12}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Cockpit Canopy (holographic tint) ── */}
      <mesh geometry={cockpitGeo} position={[0, 0.1, fuselageLength * 0.2]} rotation={[-0.2, 0, 0]}>
        <meshPhysicalMaterial
          color={color}
          metalness={0.1}
          roughness={0.05}
          transmission={0.6}
          thickness={0.5}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Engine Nacelles (angular intake pods) ── */}
      {[0.2, -0.2].map((x) => (
        <group key={x} position={[x, -0.02, -fuselageLength * 0.38]}>
          <mesh>
            <boxGeometry args={[0.1, 0.08, 0.25]} />
            <meshStandardMaterial color="#0d0d1a" metalness={0.95} roughness={0.15} />
          </mesh>
          {/* Intake glow ring */}
          <mesh position={[0, 0, 0.13]}>
            <torusGeometry args={[0.045, 0.012, 8, 16]} />
            <meshBasicMaterial color={color} transparent opacity={0.7 + engineIntensity * 0.3} />
          </mesh>
          {/* Exhaust nozzle glow */}
          <mesh position={[0, 0, -0.13]}>
            <circleGeometry args={[0.04, 12]} />
            <meshBasicMaterial color={color} transparent opacity={0.5 + engineIntensity * 0.5} />
          </mesh>
        </group>
      ))}

      {/* ── Engine point lights (dual) ── */}
      <pointLight color={color} intensity={3 + engineIntensity * 10} distance={6 + trailLength} position={[0.2, 0, -fuselageLength * 0.5]} />
      <pointLight color={color} intensity={3 + engineIntensity * 10} distance={6 + trailLength} position={[-0.2, 0, -fuselageLength * 0.5]} />

      {/* ── Nose tip glow ── */}
      <pointLight color={color} intensity={1.5} distance={3} position={[0, 0.05, fuselageLength * 0.5]} />

      {/* ── Engine Exhaust Trail ── */}
      <TrailPoints trailMat={trailMat} trailPositions={trailPositions} trailSizes={trailSizes} ref={trailRef} />

      {/* ── Shield Bubble ── */}
      <mesh ref={shieldRef} material={shieldMat}>
        <sphereGeometry args={[wingspan * 0.6, 24, 24]} />
      </mesh>

      {/* ── Projectile ── */}
      <mesh ref={projectileRef} material={projectileMat} position={[0, 0, fuselageLength * 0.5]}>
        <sphereGeometry args={[0.12, 8, 8]} />
      </mesh>
    </group>
  );
}
