"use client";

import dynamic from "next/dynamic";
import SectionDivider from "@/components/SectionDivider";
import Footer from "@/components/Footer";

// Dynamic imports to avoid SSR issues with canvas/GSAP
const MatrixBackground = dynamic(
  () => import("@/components/MatrixBackground"),
  { ssr: false }
);
const SmoothScroll = dynamic(() => import("@/components/SmoothScroll"), {
  ssr: false,
});
const HeroSection = dynamic(() => import("@/components/HeroSection"), {
  ssr: false,
});
const TimelineSection = dynamic(
  () => import("@/components/TimelineSection"),
  { ssr: false }
);
const FeaturesSection = dynamic(
  () => import("@/components/FeaturesSection"),
  { ssr: false }
);

export default function Home() {
  return (
    <SmoothScroll>
      {/* Background layers */}
      <MatrixBackground />

      {/* Bokeh light leaks */}
      <div className="bokeh-container">
        <div className="bokeh-orb" />
        <div className="bokeh-orb" />
        <div className="bokeh-orb" />
        <div className="bokeh-orb" />
      </div>

      {/* Scan line effect */}
      <div className="scan-line" />

      {/* Main content */}
      <main>
        <HeroSection />

        <SectionDivider variant="orange" />

        <TimelineSection />

        <SectionDivider variant="cyan" flip />

        <FeaturesSection />

        <SectionDivider variant="orange" />

        <Footer />
      </main>
    </SmoothScroll>
  );
}
