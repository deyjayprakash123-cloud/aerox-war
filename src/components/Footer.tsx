"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        footerRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 90%",
            toggleActions: "play none none none",
          },
        }
      );
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      id="footer"
      className="relative z-10 footer-gradient"
      style={{ opacity: 0 }}
    >
      <div className="footer-divider" />

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,106,0,0.2), rgba(0,229,255,0.2))",
                  border: "1px solid rgba(255,106,0,0.3)",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ff6a00"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 800,
                  fontSize: "1.2rem",
                  letterSpacing: "0.05em",
                  background:
                    "linear-gradient(135deg, #ff6a00, #00e5ff)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                AEROX-WAR
              </span>
            </div>
            <p
              style={{
                fontSize: "0.85rem",
                color: "rgba(255,255,255,0.35)",
                lineHeight: "1.7",
              }}
            >
              The ultimate GitHub repository battle arena. Pit your code
              against the competition and see who reigns supreme.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                marginBottom: "16px",
              }}
            >
              Quick Links
            </h4>
            <div className="space-y-3">
              <a href="#hero" className="footer-link block">
                Home
              </a>
              <a href="#how-it-works" className="footer-link block">
                How It Works
              </a>
              <a href="#features" className="footer-link block">
                Features
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                marginBottom: "16px",
              }}
            >
              Contact
            </h4>
            <div className="space-y-3">
              <a
                href="mailto:deyjayprakash123@gmail.com"
                className="footer-link flex items-center gap-2"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                deyjayprakash123@gmail.com
              </a>
              <a
                href="https://instagram.com/jayy__hx"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link flex items-center gap-2"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                @jayy__hx
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-divider mb-6" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p
            style={{
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            © {new Date().getFullYear()} AEROX-WAR. All rights reserved.
          </p>
          <p
            style={{
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            Developed by{" "}
            <span
              style={{
                color: "var(--color-neon-orange)",
                fontWeight: 600,
              }}
            >
              Jayaprakash
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
