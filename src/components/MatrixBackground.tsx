"use client";

import { useEffect, useRef } from "react";

export default function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    // Grid config
    const gridSpacing = 50;
    const chars = "01アイウエオカキクケコサシスセソ";

    // Falling columns
    const columns = Math.floor(width / gridSpacing);
    const drops: number[] = new Array(columns).fill(1);
    const speeds: number[] = Array.from(
      { length: columns },
      () => Math.random() * 0.5 + 0.2
    );
    const opacity: number[] = Array.from(
      { length: columns },
      () => Math.random() * 0.3 + 0.05
    );

    // Intersection nodes that pulse
    interface GridNode {
      x: number;
      y: number;
      pulse: number;
      pulseSpeed: number;
      maxAlpha: number;
    }

    const nodes: GridNode[] = [];
    for (let x = 0; x < width; x += gridSpacing) {
      for (let y = 0; y < height; y += gridSpacing) {
        if (Math.random() > 0.7) {
          nodes.push({
            x,
            y,
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: Math.random() * 0.02 + 0.005,
            maxAlpha: Math.random() * 0.15 + 0.03,
          });
        }
      }
    }

    function draw() {
      if (!ctx || !canvas) return;

      // Subtle fade — creates trail effect
      ctx.fillStyle = "rgba(10, 10, 15, 0.08)";
      ctx.fillRect(0, 0, width, height);

      // Draw grid lines
      ctx.strokeStyle = "rgba(255, 106, 0, 0.015)";
      ctx.lineWidth = 0.5;

      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y < height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw pulsing grid nodes
      for (const node of nodes) {
        node.pulse += node.pulseSpeed;
        const alpha = (Math.sin(node.pulse) * 0.5 + 0.5) * node.maxAlpha;

        ctx.beginPath();
        ctx.arc(node.x, node.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`;
        ctx.fill();

        // Glow ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 229, 255, ${alpha * 0.3})`;
        ctx.fill();
      }

      // Falling characters
      ctx.font = "12px 'JetBrains Mono', monospace";

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * gridSpacing + gridSpacing / 2;
        const y = drops[i] * gridSpacing;

        // Alternate colors between orange and cyan
        if (i % 3 === 0) {
          ctx.fillStyle = `rgba(255, 106, 0, ${opacity[i]})`;
        } else {
          ctx.fillStyle = `rgba(0, 229, 255, ${opacity[i] * 0.7})`;
        }

        ctx.fillText(char, x, y);

        if (y > height && Math.random() > 0.98) {
          drops[i] = 0;
          opacity[i] = Math.random() * 0.3 + 0.05;
        }

        drops[i] += speeds[i];
      }

      animationId = requestAnimationFrame(draw);
    }

    draw();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="matrix-grid">
      <canvas ref={canvasRef} />
    </div>
  );
}
