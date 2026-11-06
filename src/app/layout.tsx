import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted (bundled) fonts: no request to Google, preloaded, no layout shift. Both are SIL OFL licensed.
const bricolage = localFont({
  src: [
    { path: "../fonts/bricolage-grotesque-latin-opsz-normal.woff2", weight: "200 800", style: "normal" },
  ],
  variable: "--font-bricolage",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
const interTight = localFont({
  src: [
    { path: "../fonts/inter-tight-latin-wght-normal.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-inter-tight",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Fit&Sync: personal fitness & nutrition coaching",
  description: "Personal targets, meal plans, training programs, weekly reports and an AI coach in your corner.",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Fit&Sync" },
};

export const viewport: Viewport = { themeColor: "#0A0A0B", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={`${bricolage.variable} ${interTight.variable}`}>
      <body className="grain min-h-screen">{children}</body>
    </html>
  );
}
