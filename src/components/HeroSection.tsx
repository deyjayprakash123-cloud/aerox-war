"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";

export default function HeroSection() {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  const handleRumble = useCallback(() => {
    const repo1 = (document.getElementById("repo-url-1") as HTMLInputElement)?.value?.trim();
    const repo2 = (document.getElementById("repo-url-2") as HTMLInputElement)?.value?.trim();

    if (!repo1 || !repo2) {
      // Shake the form to indicate error
      if (formRef.current) {
        gsap.to(formRef.current, {
          keyframes: [
            { x: -8, duration: 0.07 },
            { x: 8, duration: 0.07 },
            { x: -6, duration: 0.07 },
            { x: 6, duration: 0.07 },
            { x: -3, duration: 0.07 },
            { x: 3, duration: 0.07 },
            { x: 0, duration: 0.07 },
          ],
          ease: "power2.out",
        });
      }
      return;
    }

    const params = new URLSearchParams({ repo1, repo2 });
    router.push(`/battle?${params.toString()}`);
  }, [router]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        badgeRef.current,
        { opacity: 0, y: 30, scale: 0.8 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8 }
      )
        .fromTo(
          titleRef.current,
          { opacity: 0, scale: 0.7, y: 50 },
          { opacity: 1, scale: 1, y: 0, duration: 1.2 },
          "-=0.4"
        )
        .fromTo(
          subtitleRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8 },
          "-=0.6"
        )
        .fromTo(
          formRef.current,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 1 },
          "-=0.4"
        );

      // Floating particles
      if (particlesRef.current) {
        const particles = particlesRef.current.children;
        gsap.utils.toArray(particles).forEach((p) => {
          const el = p as HTMLElement;
          gsap.to(el, {
            y: "random(-40, 40)",
            x: "random(-30, 30)",
            duration: "random(4, 8)",
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: "random(0, 3)",
          });
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden"
    >
      {/* Floating particles */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background:
                i % 2 === 0
                  ? "rgba(255, 106, 0, 0.4)"
                  : "rgba(0, 229, 255, 0.3)",
              boxShadow:
                i % 2 === 0
                  ? "0 0 8px rgba(255, 106, 0, 0.4)"
                  : "0 0 8px rgba(0, 229, 255, 0.3)",
            }}
          />
        ))}
      </div>

      {/* Badge */}
      <div
        ref={badgeRef}
        className="mb-8"
        style={{ opacity: 0 }}
      >
        <div className="section-tag">
          <span className="inline-flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full bg-neon-orange"
              style={{
                animation: "pulse-glow 2s ease-in-out infinite",
                boxShadow: "0 0 8px rgba(255,106,0,0.6)",
                background: "#ff6a00",
              }}
            />
            BATTLE PROTOCOL v2.0
          </span>
        </div>
      </div>

      {/* Title */}
      <h1
        ref={titleRef}
        className="hero-title text-center mb-4"
        style={{ opacity: 0 }}
      >
        RANK HIGHER,
        <br />
        CODE HARDER
      </h1>

      {/* Subtitle */}
      <p
        ref={subtitleRef}
        className="hero-subtitle text-center mb-14"
        style={{ opacity: 0 }}
      >
        PIT REPOS HEAD-TO-HEAD
      </p>

      {/* Input Form */}
      <div
        ref={formRef}
        className="w-full max-w-2xl"
        style={{ opacity: 0 }}
      >
        <div className="glass-card p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Repo 1 */}
            <div className="input-wrapper">
              <span className="input-label">🟠 FIGHTER 1</span>
              <input
                id="repo-url-1"
                type="url"
                className="input-github"
                placeholder="https://github.com/user/repo"
                autoComplete="off"
              />
            </div>

            {/* Repo 2 */}
            <div className="input-wrapper">
              <span
                className="input-label"
                style={{ color: "var(--color-neon-cyan)" }}
              >
                🔵 FIGHTER 2
              </span>
              <input
                id="repo-url-2"
                type="url"
                className="input-github"
                placeholder="https://github.com/user/repo"
                autoComplete="off"
              />
            </div>
          </div>

          {/* RUMBLE button */}
          <div className="flex justify-center">
            <button
              id="btn-rumble"
              className="btn-rumble"
              type="button"
              onClick={handleRumble}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              RUMBLE
            </button>
          </div>
        </div>

        {/* Decorative bottom scan line */}
        <div className="mt-6 flex items-center gap-4 justify-center">
          <div className="h-px flex-1 max-w-20 bg-gradient-to-r from-transparent to-neon-orange/30" />
          <span
            className="text-xs tracking-[0.2em] uppercase"
            style={{
              fontFamily: "var(--font-heading)",
              color: "rgba(255,255,255,0.2)",
            }}
          >
            Initializing Combat Systems
          </span>
          <div className="h-px flex-1 max-w-20 bg-gradient-to-l from-transparent to-neon-cyan/30" />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <span
          className="text-xs tracking-[0.25em] uppercase"
          style={{ fontFamily: "var(--font-heading)", fontSize: "0.6rem" }}
        >
          Scroll
        </span>
        <div
          className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1"
        >
          <div
            className="w-1 h-2 rounded-full bg-neon-orange"
            style={{
              animation: "scroll-dot 2s ease-in-out infinite",
              background: "#ff6a00",
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-dot {
          0%,
          100% {
            transform: translateY(0);
            opacity: 1;
          }
          50% {
            transform: translateY(12px);
            opacity: 0.3;
          }
        }
      `}</style>
    </section>
  );
}
