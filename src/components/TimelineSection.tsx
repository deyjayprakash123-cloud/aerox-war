"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface TimelineStep {
  number: string;
  title: string;
  description: string;
  icon: string;
}

const steps: TimelineStep[] = [
  {
    number: "PHASE 01",
    title: "Repo Analysis",
    description:
      "Deep-scan both repositories — commits, branches, file structure, language distribution, and dependency graphs. Every byte matters.",
    icon: "🔬",
  },
  {
    number: "PHASE 02",
    title: "Data Scrambling",
    description:
      "Normalize and weight raw metrics through our proprietary algorithm. Compare complexity scores, contributor velocity, and code entropy.",
    icon: "⚡",
  },
  {
    number: "PHASE 03",
    title: "Jet Construction",
    description:
      "Assemble interactive battle cards with real-time health bars, power gauges, and head-to-head stat breakdowns for the ultimate showdown.",
    icon: "🚀",
  },
  {
    number: "PHASE 04",
    title: "Battle Verdict",
    description:
      "Declare the champion with a comprehensive score breakdown. Export results, share on social, or rematch with different repos.",
    icon: "🏆",
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

      // Timeline progress bar follows scroll
      if (progressRef.current && sectionRef.current) {
        gsap.to(progressRef.current, {
          height: "100%",
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
            end: "bottom 40%",
            scrub: 0.5,
          },
        });
      }

      // Animate each step + dot
      stepsRef.current.forEach((step, i) => {
        if (!step) return;

        const dot = dotsRef.current[i];
        const isLeft = i % 2 === 0;

        // Step card fade in
        gsap.fromTo(
          step,
          {
            opacity: 0.15,
            x: isLeft ? -40 : 40,
            y: 20,
          },
          {
            opacity: 1,
            x: 0,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: step,
              start: "top 75%",
              end: "top 40%",
              toggleActions: "play none none reverse",
              onEnter: () => {
                step.classList.add("active");
                if (dot) {
                  dot.classList.add(i % 2 === 0 ? "active" : "active-cyan");
                }
              },
              onLeaveBack: () => {
                step.classList.remove("active");
                if (dot) {
                  dot.classList.remove("active", "active-cyan");
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
      <div ref={headingRef} className="text-center mb-20">
        <div className="section-tag">How It Works</div>
        <h2 className="section-title">
          The Battle <span className="text-shimmer">Protocol</span>
        </h2>
        <p className="section-subtitle">
          Four phases of ruthless code analysis. Every metric counted. Every
          commit weighed. No mercy.
        </p>
      </div>

      {/* Timeline */}
      <div className="timeline-container max-w-4xl mx-auto">
        {/* Track */}
        <div ref={trackRef} className="timeline-track" />
        <div ref={progressRef} className="timeline-progress" style={{ height: 0 }} />

        {/* Steps */}
        <div className="space-y-32">
          {steps.map((step, i) => {
            const isLeft = i % 2 === 0;
            const dotTop = `calc(${(i / (steps.length - 1)) * 100}% + 0px)`;

            return (
              <div key={i} className="relative">
                {/* Dot on timeline */}
                <div
                  ref={(el) => { dotsRef.current[i] = el; }}
                  className="timeline-dot"
                  style={{ top: "50%" }}
                />

                {/* Step card */}
                <div
                  ref={(el) => { stepsRef.current[i] = el; }}
                  className={`timeline-step ${isLeft ? "left" : "right"}`}
                >
                  <div className="glass-card p-6 inline-block text-left max-w-md">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{step.icon}</span>
                      <span className="step-number">{step.number}</span>
                    </div>
                    <h3 className="step-title">{step.title}</h3>
                    <p className="step-desc">{step.description}</p>
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
