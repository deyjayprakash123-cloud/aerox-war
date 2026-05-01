import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "AEROX-WAR — Rank Higher, Code Harder",
  description:
    "AEROX-WAR pits GitHub repositories head-to-head in an ultimate code analysis battle. Compare health scores, power levels, and contributor stamina in real-time.",
  keywords: [
    "GitHub",
    "code analysis",
    "repository comparison",
    "developer tools",
    "AEROX",
  ],
  openGraph: {
    title: "AEROX-WAR — Rank Higher, Code Harder",
    description:
      "Pit repositories head-to-head. Analyze health scores, power levels, and code defense in real-time.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
