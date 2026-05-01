"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Feature {
  title: string;
  description: string;
  value: number;
  label: string;
  color: "orange" | "cyan" | "mixed";
  icon: string;
}

const features: Feature[] = [
  {
    title: "Code Complexity",
    description:
      "A heavyweight metric analyzing the sheer scale, depth, and Total Lines of Code (40% Weight).",
    value: 85,
    label: "COMPLEX",
    color: "orange",
    icon: "🧠",
  },
  {
    title: "Commit Velocity",
    description:
      "Evaluates deployment speed, commit frequency, and the raw momentum of the repository (30% Weight).",
    value: 92,
    label: "VELOCITY",
    color: "cyan",
    icon: "⚡",
  },
  {
    title: "Bug Stability",
    description:
      "Calculates the ratio of closed vs open issues to determine team responsiveness and code health (30% Weight).",
    value: 78,
    label: "STABILITY",
    color: "mixed",
    icon: "🛡️",
  },
];

function RadialProgress({
  value,
  color,
  label,
  animated,
}: {
  value: number;
  color: "orange" | "cyan" | "mixed";
  label: string;
  animated: boolean;
}) {
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!animated) return;
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [animated, value]);

  return (
    <div className="radial-progress-container">
      <svg
        width="160"
        height="160"
        viewBox="0 0 160 160"
      >
        <defs>
          <linearGradient id="gradient-orange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff6a00" />
            <stop offset="100%" stopColor="#ff9a40" />
          </linearGradient>
          <linearGradient id="gradient-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="100%" stopColor="#60f0ff" />
          </linearGradient>
          <linearGradient id="gradient-mixed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff6a00" />
            <stop offset="50%" stopColor="#ff9a40" />
            <stop offset="100%" stopColor="#00e5ff" />
          </linearGradient>
        </defs>

        {/* Background ring */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          className="radial-progress-bg"
        />

        {/* Progress ring */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          className={`radial-progress-bar ${color}`}
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          style={{
            transition: animated
              ? "stroke-dashoffset 1.5s cubic-bezier(0.23, 1, 0.32, 1)"
              : "none",
          }}
        />
      </svg>

      <div className="radial-value">
        <span className="radial-number">{animated ? displayValue : 0}</span>
        <span className="radial-label">{label}</span>
      </div>
    </div>
  );
}

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Heading
      if (headingRef.current) {
        gsap.fromTo(
          headingRef.current.children,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: headingRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      // Cards
      cardsRef.current.forEach((card, i) => {
        if (!card) return;

        gsap.fromTo(
          card,
          { opacity: 0, y: 60, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            delay: i * 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 82%",
              toggleActions: "play none none reverse",
              onEnter: () => setAnimated(true),
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="features" className="relative z-10 py-32 px-4">
      {/* Section heading */}
      <div ref={headingRef} className="text-center mb-20">
        <div className="section-tag">Battle Metrics</div>
        <h2 className="section-title">
          Health Scores & <span className="text-shimmer">Power Levels</span>
        </h2>
        <p className="section-subtitle">
          Every repository is measured across three critical dimensions.
          Real data. No speculation.
        </p>
      </div>

      {/* Feature cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, i) => (
          <div
            key={i}
            ref={(el) => { cardsRef.current[i] = el; }}
            className="glass-card glow-border p-8 text-center"
            style={{ opacity: 0 }}
          >
            <div className="text-3xl mb-4">{feature.icon}</div>

            <RadialProgress
              value={feature.value}
              color={feature.color}
              label={feature.label}
              animated={animated}
            />

            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-desc">{feature.description}</p>

            {/* Bottom accent line */}
            <div
              className="mt-6 mx-auto h-px w-16"
              style={{
                background:
                  feature.color === "orange"
                    ? "linear-gradient(90deg, transparent, #ff6a00, transparent)"
                    : feature.color === "cyan"
                    ? "linear-gradient(90deg, transparent, #00e5ff, transparent)"
                    : "linear-gradient(90deg, #ff6a00, transparent, #00e5ff)",
              }}
            />
          </div>
        ))}
      </div>

      {/* Power level bars */}
      <div className="max-w-4xl mx-auto mt-20">
        <div className="glass-card p-8">
          <h3
            className="text-center mb-8"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "0.75rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            Sample Power Level Breakdown
          </h3>

          <div className="space-y-6">
            {[
              { label: "Code Complexity (Size & Depth)", value: 40, color: "#ff6a00" },
              { label: "Commit Velocity (Momentum)", value: 30, color: "#00e5ff" },
              { label: "Bug Stability (Issue Ratio)", value: 30, color: "#00ff88" },
              { label: "Popularity (Stars/Forks)", value: 0, color: "#ff2a2a" },
            ].map((bar, i) => (
              <div key={i}>
                <div className="flex justify-between mb-2">
                  <span
                    className="text-xs tracking-wider uppercase"
                    style={{
                      fontFamily: "var(--font-heading)",
                      color: "rgba(255,255,255,0.5)",
                      fontSize: "0.65rem",
                    }}
                  >
                    {bar.label}
                  </span>
                  <span
                    className="text-xs font-bold"
                    style={{
                      fontFamily: "var(--font-heading)",
                      color: bar.color,
                      fontSize: "0.7rem",
                    }}
                  >
                    {animated ? bar.value : 0}%
                  </span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: animated ? `${bar.value}%` : "0%",
                      background: `linear-gradient(90deg, ${bar.color}, ${bar.color}88)`,
                      boxShadow: `0 0 10px ${bar.color}66`,
                      transition:
                        "width 1.5s cubic-bezier(0.23, 1, 0.32, 1)",
                      transitionDelay: `${i * 0.1}s`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-[10px] text-white/40 uppercase tracking-widest" style={{ fontFamily: "var(--font-mono)" }}>
              * Popularity metrics like GitHub Stars are explicitly excluded (0% weight) to ensure a pure test of technical engineering merit.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
