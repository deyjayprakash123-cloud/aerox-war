"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ═══════════════════════════════════════════════════════
   InfiniteGrid — Dark wireframe grid floor
   Fades to transparency at edges for infinite illusion.
   Orange/cyan accent lines.
   ═══════════════════════════════════════════════════════ */

export default function InfiniteGrid() {
  const gridRef = useRef<THREE.Group>(null);

  // Custom grid shader for fade-at-edges
  const gridMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color("#ff6a00") },
        uColor2: { value: new THREE.Color("#00e5ff") },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying vec3 vWorldPos;

        float gridLine(float coord, float lineWidth) {
          float derivative = fwidth(coord);
          float grid = abs(fract(coord - 0.5) - 0.5) / derivative;
          return 1.0 - min(grid, 1.0);
        }

        void main() {
          // Grid lines
          float gridX = gridLine(vWorldPos.x, 0.02);
          float gridZ = gridLine(vWorldPos.z, 0.02);
          float grid = max(gridX, gridZ);

          // Larger accent grid every 5 units
          float bigGridX = gridLine(vWorldPos.x / 5.0, 0.03);
          float bigGridZ = gridLine(vWorldPos.z / 5.0, 0.03);
          float bigGrid = max(bigGridX, bigGridZ);

          // Fade based on distance from center
          float dist = length(vWorldPos.xz);
          float fade = 1.0 - smoothstep(15.0, 40.0, dist);

          // Color mix: orange near center, cyan at edges
          float colorMix = smoothstep(5.0, 25.0, dist);
          vec3 lineColor = mix(uColor1, uColor2, colorMix);

          // Small grid lines
          float smallAlpha = grid * 0.15 * fade;
          // Big grid lines
          float bigAlpha = bigGrid * 0.35 * fade;

          float totalAlpha = max(smallAlpha, bigAlpha);

          // Pulse effect
          float pulse = sin(uTime * 0.5 - dist * 0.15) * 0.5 + 0.5;
          totalAlpha *= (0.7 + pulse * 0.3);

          gl_FragColor = vec4(lineColor, totalAlpha);
        }
      `,
    });
  }, []);

  useFrame((state) => {
    gridMaterial.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <group ref={gridRef}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={gridMaterial}>
        <planeGeometry args={[100, 100, 1, 1]} />
      </mesh>
    </group>
  );
}
