"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ── SVG Icons ── */
const ScanIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff6a00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
    <path d="M11 8v6" />
    <path d="M8 11h6" />
  </svg>
);

const DataIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const RocketIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff6a00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

const TrophyIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

interface TimelineStep {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: TimelineStep[] = [
  {
    number: "PHASE 01",
    title: "Repo Analysis",
    description:
      "Deep-scan both repositories — commits, branches, file structure, language distribution, and dependency graphs. Every byte matters.",
    icon: <ScanIcon />,
  },
  {
    number: "PHASE 02",
    title: "Data Scrambling",
    description:
      "Normalize and weight raw metrics through our proprietary algorithm. Compare complexity scores, contributor velocity, and code entropy.",
    icon: <DataIcon />,
  },
  {
    number: "PHASE 03",
    title: "Jet Construction",
    description:
      "Assemble interactive battle cards with real-time health bars, power gauges, and head-to-head stat breakdowns for the ultimate showdown.",
    icon: <RocketIcon />,
  },
  {
    number: "PHASE 04",
    title: "Battle Verdict",
    description:
      "Declare the champion with a comprehensive score breakdown. Export results, share on social, or rematch with different repos.",
    icon: <TrophyIcon />,
  },
];

export default function TimelineSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);
  const dotsRef = useRef<(HTMLDivElement | null)[]>([]);
  const headingRef = useRef<HTMLDivElement>(null);

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

      // Timeline progress bar follows scroll smoothly
      if (progressRef.current && sectionRef.current) {
        gsap.to(progressRef.current, {
          height: "100%",
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 40%",
            end: "bottom 40%",
            scrub: 1, // Smooth scrub
          },
        });
      }

      // Animate each step + dot
      stepsRef.current.forEach((step, i) => {
        if (!step) return;

        const dot = dotsRef.current[i];

        gsap.fromTo(
          step,
          {
            opacity: 0,
            x: 40,
            scale: 0.98,
          },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 1,
            ease: "expo.out",
            scrollTrigger: {
              trigger: step,
              start: "top 85%",
              toggleActions: "play none none reverse",
              onEnter: () => {
                if (dot) {
                  gsap.to(dot, {
                    scale: 1.4,
                    backgroundColor: i % 2 === 0 ? "#ff6a00" : "#00e5ff",
                    borderColor: i % 2 === 0 ? "#ff6a00" : "#00e5ff",
                    boxShadow: i % 2 === 0 
                      ? "0 0 20px rgba(255, 106, 0, 0.6)" 
                      : "0 0 20px rgba(0, 229, 255, 0.6)",
                    duration: 0.5,
                    ease: "back.out(1.7)"
                  });
                }
              },
              onLeaveBack: () => {
                if (dot) {
                  gsap.to(dot, {
                    scale: 1,
                    backgroundColor: "#12121c",
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    boxShadow: "none",
                    duration: 0.5,
                    ease: "power2.in"
                  });
                }
              },
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="how-it-works" className="relative z-10 py-32 px-4">
      {/* Section heading */}
      <div ref={headingRef} className="text-center mb-24">
        <div className="section-tag">How It Works</div>
        <h2 className="section-title">
          The Battle <span className="text-shimmer">Protocol</span>
        </h2>
        <p className="section-subtitle">
          Four phases of ruthless code analysis. Every metric counted. Every
          commit weighed. No mercy.
        </p>
      </div>

      {/* Clean Timeline Layout */}
      <div className="relative max-w-4xl mx-auto">
        {/* Track Background */}
        <div ref={trackRef} className="absolute left-[24px] md:left-[120px] top-0 bottom-0 w-px bg-white/10 z-0" />
        
        {/* Track Progress */}
        <div 
          ref={progressRef} 
          className="absolute left-[24px] md:left-[120px] top-0 w-[3px] rounded-full bg-gradient-to-b from-neon-orange to-neon-cyan z-0 shadow-[0_0_12px_rgba(255,106,0,0.5)] -translate-x-[1px]" 
          style={{ height: 0 }} 
        />

        {/* Steps */}
        <div className="space-y-12 relative z-10 py-12">
          {steps.map((step, i) => {
            return (
              <div key={i} className="relative flex flex-col md:flex-row gap-6 md:gap-12 items-start pl-[64px] md:pl-0">
                
                {/* Dot */}
                <div
                  ref={(el) => { dotsRef.current[i] = el; }}
                  className="absolute left-[24px] md:left-[120px] top-[28px] md:top-[44px] -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#12121c] border-2 border-white/20 z-20"
                />

                {/* Left side (Desktop): Phase Number */}
                <div className="hidden md:flex md:w-[90px] shrink-0 justify-end pt-9">
                  <span className="font-heading text-xs font-bold tracking-[0.1em] uppercase text-white/50 text-right">
                    {step.number}
                  </span>
                </div>

                {/* Mobile Phase Number */}
                <div className="md:hidden pt-2">
                  <span className="font-heading text-xs font-bold tracking-[0.1em] uppercase text-white/50">
                    {step.number}
                  </span>
                </div>

                {/* Right side: Step card */}
                <div
                  ref={(el) => { stepsRef.current[i] = el; }}
                  className="flex-1 w-full"
                >
                  <div className="glass-card p-6 md:p-8 text-left shadow-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,106,0,0.1)] group hover:-translate-y-1 border border-white/5 hover:border-white/10">
                    <div className="flex items-center gap-4 mb-4">
                      {/* Icon */}
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300">
                        {step.icon}
                      </div>
                      <h3 className="font-heading font-bold text-xl md:text-2xl text-white tracking-wide">{step.title}</h3>
                    </div>
                    <p className="text-[0.95rem] text-white/60 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
