"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════
   Fair Engine Section — Landing Page
   
   Showcases the deep-tissue fairness comparison algorithm
   with 4 pillar cards, weight breakdowns, event triggers,
   and Thermal Overload safeguard info.
   ═══════════════════════════════════════════════════════ */

interface Pillar {
  title: string;
  description: string;
  weight: string;
  formula: string;
  color: "orange" | "cyan" | "green" | "red";
  icon: React.ReactNode;
}

/* ── SVG Icons ── */
const MaintainabilityIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const CommunityIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const PenaltyIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const NitroIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const ShieldFlickerIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const SonicBoomIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ThermalIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
  </svg>
);

const pillars: Pillar[] = [
  {
    title: "Maintainability Index",
    description:
      "Measures PR merge discipline and bug resolution speed. Evaluates how well the team maintains and stabilizes the codebase.",
    weight: "60%",
    formula: "(MergedPRs ÷ TotalPRs) × 0.4 + (ClosedBugs ÷ OpenBugs) × 0.6",
    color: "orange",
    icon: <MaintainabilityIcon />,
  },
  {
    title: "Community Momentum",
    description:
      "Calculates the real-time growth velocity of Stars and Forks in the last 24 hours using logarithmic dampening.",
    weight: "30%",
    formula: "starGrowth × 0.7 + forkGrowth × 0.3",
    color: "cyan",
    icon: <CommunityIcon />,
  },
  {
    title: "Security Armor",
    description:
      "Baseline of 1.0 with deductions for critical vulnerability alerts discovered in the repository's dependency graph.",
    weight: "10%",
    formula: "1.0 − (vulnerabilities × 0.2)",
    color: "green",
    icon: <ShieldIcon />,
  },
  {
    title: "Stale Penalty",
    description:
      "Subtracts from the Maintainability Index for each 7-day period since the last commit. Abandoned repos pay a steep price.",
    weight: "−0.1 / 7d",
    formula: "−(weeksSinceLastCommit × 0.1)",
    color: "red",
    icon: <PenaltyIcon />,
  },
];

const eventTriggers = [
  {
    event: "NEW_COMMIT",
    effect: "Nitro Boost",
    description: "Engine trail ignition flare on the Jet",
    icon: <NitroIcon />,
    color: "#ff6a00",
  },
  {
    event: "NEW_ISSUE",
    effect: "Shield Flicker",
    description: "Damage-absorbing shimmer across the hull",
    icon: <ShieldFlickerIcon />,
    color: "#00e5ff",
  },
  {
    event: "NEW_STAR",
    effect: "Sonic Boom",
    description: "Expanding shockwave ring around the Jet",
    icon: <SonicBoomIcon />,
    color: "#ffd700",
  },
];

function AnimatedCounter({
  target,
  suffix = "",
  animated,
}: {
  target: number;
  suffix?: string;
  animated: boolean;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!animated) return;
    const duration = 1200;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [animated, target]);

  return (
    <span>
      {animated ? value : 0}
      {suffix}
    </span>
  );
}

export default function FairEngineSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const pillarsRef = useRef<(HTMLDivElement | null)[]>([]);
  const triggersRef = useRef<HTMLDivElement>(null);
  const thermalRef = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Heading animation
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

      // Pillar cards
      pillarsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { opacity: 0, y: 50, scale: 0.92 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            delay: i * 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 84%",
              toggleActions: "play none none reverse",
              onEnter: () => setAnimated(true),
            },
          }
        );
      });

      // Event triggers section
      if (triggersRef.current) {
        gsap.fromTo(
          triggersRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: triggersRef.current,
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      // Thermal section
      if (thermalRef.current) {
        gsap.fromTo(
          thermalRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: thermalRef.current,
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const colorMap: Record<string, string> = {
    orange: "#ff6a00",
    cyan: "#00e5ff",
    green: "#00ff88",
    red: "#ff2a2a",
  };

  return (
    <section ref={sectionRef} id="fair-engine" className="relative z-10 py-32 px-4">
      {/* Section heading */}
      <div ref={headingRef} className="text-center mb-20">
        <div className="section-tag">Fair Comparison Engine</div>
        <h2 className="section-title">
          Deep-Tissue <span className="text-shimmer">Fairness</span> Algorithm
        </h2>
        <p className="section-subtitle">
          Beyond star counts. We measure real maintenance quality, security
          posture, and community momentum with mathematically weighted scoring.
        </p>
      </div>

      {/* ── 4 Pillar Cards ── */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {pillars.map((pillar, i) => (
          <div
            key={i}
            ref={(el) => { pillarsRef.current[i] = el; }}
            className="glass-card glow-border p-6"
            style={{ opacity: 0 }}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div
                className="fair-icon-box"
                style={{
                  color: colorMap[pillar.color],
                  borderColor: `${colorMap[pillar.color]}33`,
                  background: `${colorMap[pillar.color]}0d`,
                }}
              >
                {pillar.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3
                    className="feature-title"
                    style={{ marginBottom: 0, fontSize: "1.05rem" }}
                  >
                    {pillar.title}
                  </h3>
                  <span
                    className="fair-weight-badge"
                    style={{
                      color: colorMap[pillar.color],
                      borderColor: `${colorMap[pillar.color]}40`,
                      background: `${colorMap[pillar.color]}10`,
                    }}
                  >
                    {pillar.weight}
                  </span>
                </div>
                <p className="feature-desc" style={{ maxWidth: "none", margin: 0, fontSize: "0.85rem" }}>
                  {pillar.description}
                </p>
                <div className="fair-formula-tag">
                  {pillar.formula}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Weight Breakdown Visualization ── */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="glass-card p-8">
          <h3 className="fair-section-subtitle">
            Weighted Score Composition
          </h3>
          <div className="space-y-5">
            {[
              { label: "Maintainability Index", value: 60, color: "#ff6a00", sub: "PR merge rate + Bug resolution − Stale penalty" },
              { label: "Community Momentum", value: 30, color: "#00e5ff", sub: "24hr Star/Fork growth velocity" },
              { label: "Security Armor", value: 10, color: "#00ff88", sub: "1.0 baseline − 0.2 per vulnerability" },
            ].map((bar, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1.5">
                  <div>
                    <span className="fair-bar-label">{bar.label}</span>
                    <span className="fair-bar-sub">{bar.sub}</span>
                  </div>
                  <span className="fair-bar-value" style={{ color: bar.color }}>
                    <AnimatedCounter target={bar.value} suffix="%" animated={animated} />
                  </span>
                </div>
                <div className="fair-bar-track">
                  <div
                    className="fair-bar-fill"
                    style={{
                      width: animated ? `${bar.value}%` : "0%",
                      background: `linear-gradient(90deg, ${bar.color}, ${bar.color}88)`,
                      boxShadow: `0 0 12px ${bar.color}44`,
                      transitionDelay: `${i * 0.15}s`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-[10px] text-white/40 uppercase tracking-widest" style={{ fontFamily: "var(--font-mono)" }}>
              * GitHub Stars are weighted only through Community Momentum (24hr growth), never as a raw count. Pure engineering merit drives the final score.
            </p>
          </div>
        </div>
      </div>

      {/* ── Real-Time JSON Triggers ── */}
      <div ref={triggersRef} className="max-w-4xl mx-auto mb-16" style={{ opacity: 0 }}>
        <div className="glass-card p-8">
          <h3 className="fair-section-subtitle">
            Real-Time 3D Event Triggers
          </h3>
          <p className="text-center text-white/35 text-sm mb-8" style={{ fontFamily: "var(--font-body)" }}>
            JSON changes from the GitHub API are mapped to cinematic 3D animations on the battle jets.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {eventTriggers.map((trigger, i) => (
              <div
                key={i}
                className="fair-trigger-card"
                style={{ borderColor: `${trigger.color}20` }}
              >
                <div
                  className="fair-trigger-icon"
                  style={{ color: trigger.color }}
                >
                  {trigger.icon}
                </div>
                <div
                  className="fair-trigger-event"
                  style={{ color: trigger.color }}
                >
                  {trigger.event}
                </div>
                <div className="fair-trigger-effect">{trigger.effect}</div>
                <div className="fair-trigger-desc">{trigger.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Thermal Overload Safeguard ── */}
      <div ref={thermalRef} className="max-w-4xl mx-auto" style={{ opacity: 0 }}>
        <div
          className="glass-card p-8"
          style={{ borderColor: "rgba(255,77,0,0.15)" }}
        >
          <div className="flex items-center gap-3 justify-center mb-6">
            <div
              className="fair-icon-box"
              style={{
                color: "#FF4D00",
                borderColor: "rgba(255,77,0,0.3)",
                background: "rgba(255,77,0,0.08)",
              }}
            >
              <ThermalIcon />
            </div>
            <h3 className="fair-section-subtitle" style={{ marginBottom: 0 }}>
              Thermal Overload Safeguard
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="fair-safeguard-item">
              <div className="fair-safeguard-badge" style={{ color: "#ff6a00", borderColor: "rgba(255,106,0,0.3)" }}>
                403 / RATE LIMIT
              </div>
              <p className="fair-safeguard-text">
                When the GitHub API returns a 403 or Rate Limit error, the engine
                automatically falls back to <strong style={{ color: "#ff6a00" }}>Simulated Data</strong> from
                the last successful Redis cache entry.
              </p>
            </div>
            <div className="fair-safeguard-item">
              <div className="fair-safeguard-badge" style={{ color: "#00e5ff", borderColor: "rgba(0,229,255,0.3)" }}>
                EMERGENCY PILOT LOGIN
              </div>
              <p className="fair-safeguard-text">
                A flag is sent to the UI to display an{" "}
                <strong style={{ color: "#00e5ff" }}>Emergency Pilot Login Required</strong>{" "}
                overlay, prompting GitHub OAuth authentication for elevated API limits (5,000 req/hr).
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
